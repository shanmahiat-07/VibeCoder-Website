import { create } from 'zustand';
import type {
  BuilderComponentNode,
  BuilderPageInput,
  BuilderPageLayout,
  BuilderPageState,
  BuilderSerializableLayout,
  BuilderSerializedComponent,
  BuilderState,
} from '../types/builder-state.types';

const EMPTY_LAYOUT: BuilderPageLayout = {
  rootIds: [],
  nodes: {},
};

const cloneLayout = (layout: BuilderPageLayout): BuilderPageLayout => ({
  rootIds: [...layout.rootIds],
  nodes: Object.fromEntries(
    Object.entries(layout.nodes).map(([id, node]) => [
      id,
      {
        ...node,
        props: { ...node.props },
        children: [...node.children],
      },
    ])
  ),
});

const parseLayoutJson = (layoutJson?: string | null): BuilderSerializableLayout => {
  if (!layoutJson) {
    return { components: [] };
  }

  try {
    const parsed = JSON.parse(layoutJson) as BuilderSerializableLayout;
    return Array.isArray(parsed.components) ? parsed : { components: [] };
  } catch {
    return { components: [] };
  }
};

const normalizeComponents = (
  components: BuilderSerializedComponent[],
  layout: BuilderPageLayout = { ...EMPTY_LAYOUT, rootIds: [], nodes: {} }
): BuilderPageLayout => {
  const nodes = { ...layout.nodes };
  const rootIds: string[] = [];

  const visit = (component: BuilderSerializedComponent, parentId?: string) => {
    const childIds = (component.children || []).map((child) => child.id);

    nodes[component.id] = {
      id: component.id,
      type: component.type,
      props: component.props || {},
      children: childIds,
    };

    if (!parentId) {
      rootIds.push(component.id);
    }

    (component.children || []).forEach((child) => visit(child, component.id));
  };

  components.forEach((component) => visit(component));

  return {
    rootIds,
    nodes,
  };
};

const serializeLayout = (layout: BuilderPageLayout): BuilderSerializableLayout => {
  const serializeNode = (nodeId: string): BuilderSerializedComponent => {
    const node = layout.nodes[nodeId];

    return {
      id: node.id,
      type: node.type,
      props: node.props,
      children: node.children.map(serializeNode),
    };
  };

  return {
    components: layout.rootIds.filter((nodeId) => Boolean(layout.nodes[nodeId])).map(serializeNode),
  };
};

const createPageState = (page: BuilderPageInput): BuilderPageState => ({
  pageId: page.pageId,
  siteId: page.siteId,
  pageName: page.pageName,
  pageSlug: page.pageSlug,
  layout: normalizeComponents(parseLayoutJson(page.layoutJson).components),
  isDirty: false,
  lastSavedJson: page.layoutJson ?? JSON.stringify({ components: [] }),
});

const findParentId = (layout: BuilderPageLayout, componentId: string): string | null => {
  for (const node of Object.values(layout.nodes)) {
    if (node.children.includes(componentId)) {
      return node.id;
    }
  }

  return null;
};

const removeFromCurrentParent = (
  layout: BuilderPageLayout,
  componentId: string
): BuilderPageLayout => {
  const nextLayout = cloneLayout(layout);
  const parentId = findParentId(nextLayout, componentId);

  if (parentId) {
    nextLayout.nodes[parentId] = {
      ...nextLayout.nodes[parentId],
      children: nextLayout.nodes[parentId].children.filter((id) => id !== componentId),
    };
  } else {
    nextLayout.rootIds = nextLayout.rootIds.filter((id) => id !== componentId);
  }

  return nextLayout;
};

const removeNodeTree = (layout: BuilderPageLayout, componentId: string): BuilderPageLayout => {
  const nextLayout = removeFromCurrentParent(layout, componentId);
  const nextNodes = { ...nextLayout.nodes };

  const visit = (nodeId: string) => {
    const node = nextNodes[nodeId];
    if (!node) return;

    node.children.forEach(visit);
    delete nextNodes[nodeId];
  };

  visit(componentId);

  return {
    rootIds: nextLayout.rootIds,
    nodes: nextNodes,
  };
};

const shouldKeepExistingPage = (existingPage: BuilderPageState | undefined) =>
  Boolean(existingPage && existingPage.isDirty);

export const useWebsiteBuilderStore = create<BuilderState>()((set, get) => ({
  pagesById: {},
  pageOrder: [],
  activePageId: null,
  selectedComponentId: null,

  hydratePages: (pages) =>
    set((state) => {
      const incomingPages = pages.map(createPageState);
      const incomingPageIds = new Set(incomingPages.map((page) => page.pageId));
      const incomingSiteIds = new Set(incomingPages.map((page) => page.siteId));
      const pagesById = Object.fromEntries(
        incomingPages.map((page) => {
          const existingPage = state.pagesById[page.pageId];
          const nextPage =
            existingPage && shouldKeepExistingPage(existingPage) ? existingPage : page;

          return [page.pageId, nextPage];
        })
      );
      const preservedDirtyPages = state.pageOrder
        .map((pageId) => state.pagesById[pageId])
        .filter(
          (page): page is BuilderPageState =>
            Boolean(page) &&
            page.isDirty &&
            incomingSiteIds.has(page.siteId) &&
            !incomingPageIds.has(page.pageId)
        );

      preservedDirtyPages.forEach((page) => {
        pagesById[page.pageId] = page;
      });

      const pageOrder = [
        ...incomingPages.map((page) => page.pageId),
        ...preservedDirtyPages.map((page) => page.pageId),
      ];
      const activePageId =
        state.activePageId && pagesById[state.activePageId]
          ? state.activePageId
          : (pageOrder[0] ?? null);
      const selectedComponentId =
        activePageId &&
        state.selectedComponentId &&
        pagesById[activePageId]?.layout.nodes[state.selectedComponentId]
          ? state.selectedComponentId
          : null;

      return {
        pagesById,
        pageOrder,
        activePageId,
        selectedComponentId,
      };
    }),

  setActivePage: (pageId) =>
    set((state) => ({
      activePageId: state.pagesById[pageId] ? pageId : state.activePageId,
      selectedComponentId: null,
    })),

  selectComponent: (componentId) =>
    set(() => ({
      selectedComponentId: componentId,
    })),

  createPage: (page) =>
    set((state) => {
      const nextPage = createPageState(page);

      return {
        pagesById: {
          ...state.pagesById,
          [page.pageId]: nextPage,
        },
        pageOrder: state.pageOrder.includes(page.pageId)
          ? state.pageOrder
          : [...state.pageOrder, page.pageId],
        activePageId: state.activePageId ?? page.pageId,
      };
    }),

  addComponent: (pageId, component, options) =>
    set((state) => {
      const page = state.pagesById[pageId];
      if (!page) return state;

      const layout = cloneLayout(page.layout);
      const nextNode: BuilderComponentNode = {
        ...component,
        props: { ...component.props },
        children: [...(component.children || [])],
      };

      layout.nodes[nextNode.id] = nextNode;

      const targetIndex = options?.index ?? Number.MAX_SAFE_INTEGER;
      const parentId = options?.parentId ?? null;

      if (parentId) {
        const parent = layout.nodes[parentId];
        if (!parent) return state;

        const children = [...parent.children];
        children.splice(Math.min(targetIndex, children.length), 0, nextNode.id);
        layout.nodes[parentId] = {
          ...parent,
          children,
        };
      } else {
        const rootIds = [...layout.rootIds];
        rootIds.splice(Math.min(targetIndex, rootIds.length), 0, nextNode.id);
        layout.rootIds = rootIds;
      }

      return {
        pagesById: {
          ...state.pagesById,
          [pageId]: {
            ...page,
            layout,
            isDirty: true,
          },
        },
        selectedComponentId: nextNode.id,
      };
    }),

  updateComponentProps: (pageId, componentId, props) =>
    set((state) => {
      const page = state.pagesById[pageId];
      const node = page?.layout.nodes[componentId];
      if (!page || !node) return state;

      return {
        pagesById: {
          ...state.pagesById,
          [pageId]: {
            ...page,
            layout: {
              ...page.layout,
              nodes: {
                ...page.layout.nodes,
                [componentId]: {
                  ...node,
                  props: {
                    ...node.props,
                    ...props,
                  },
                },
              },
            },
            isDirty: true,
          },
        },
      };
    }),

  removeComponent: (pageId, componentId) =>
    set((state) => {
      const page = state.pagesById[pageId];
      if (!page || !page.layout.nodes[componentId]) return state;

      return {
        pagesById: {
          ...state.pagesById,
          [pageId]: {
            ...page,
            layout: removeNodeTree(page.layout, componentId),
            isDirty: true,
          },
        },
        selectedComponentId:
          state.selectedComponentId === componentId ? null : state.selectedComponentId,
      };
    }),

  moveComponent: (pageId, componentId, options) =>
    set((state) => {
      const page = state.pagesById[pageId];
      if (!page || !page.layout.nodes[componentId]) return state;

      let layout = removeFromCurrentParent(page.layout, componentId);
      const targetIndex = options.targetIndex;
      const targetParentId = options.targetParentId ?? null;

      if (targetParentId) {
        const parent = layout.nodes[targetParentId];
        if (!parent) return state;

        const children = [...parent.children];
        children.splice(Math.min(targetIndex, children.length), 0, componentId);
        layout = {
          ...layout,
          nodes: {
            ...layout.nodes,
            [targetParentId]: {
              ...parent,
              children,
            },
          },
        };
      } else {
        const rootIds = [...layout.rootIds];
        rootIds.splice(Math.min(targetIndex, rootIds.length), 0, componentId);
        layout = {
          ...layout,
          rootIds,
        };
      }

      return {
        pagesById: {
          ...state.pagesById,
          [pageId]: {
            ...page,
            layout,
            isDirty: true,
          },
        },
      };
    }),

  replacePageLayout: (pageId, layoutJson) =>
    set((state) => {
      const page = state.pagesById[pageId];
      if (!page) return state;

      return {
        pagesById: {
          ...state.pagesById,
          [pageId]: {
            ...page,
            layout: normalizeComponents(parseLayoutJson(layoutJson).components),
            lastSavedJson: layoutJson,
            isDirty: false,
          },
        },
        selectedComponentId: null,
      };
    }),

  markPageSaved: (pageId, savedJson) =>
    set((state) => {
      const page = state.pagesById[pageId];
      if (!page) return state;

      return {
        pagesById: {
          ...state.pagesById,
          [pageId]: {
            ...page,
            lastSavedJson: savedJson ?? get().getPageJson(pageId),
            isDirty: false,
          },
        },
      };
    }),

  getPageJson: (pageId) => {
    const page = get().pagesById[pageId];
    if (!page) {
      return JSON.stringify({ components: [] });
    }

    return JSON.stringify(serializeLayout(page.layout));
  },
}));

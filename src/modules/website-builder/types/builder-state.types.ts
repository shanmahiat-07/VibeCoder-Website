export type BuilderComponentProps = Record<string, unknown>;

export interface BuilderSerializedComponent {
  id: string;
  type: string;
  props: BuilderComponentProps;
  children?: BuilderSerializedComponent[];
}

export interface BuilderSerializableLayout {
  components: BuilderSerializedComponent[];
}

export interface BuilderComponentNode {
  id: string;
  type: string;
  props: BuilderComponentProps;
  children: string[];
}

export interface BuilderPageLayout {
  rootIds: string[];
  nodes: Record<string, BuilderComponentNode>;
}

export interface BuilderPageState {
  pageId: string;
  siteId: string;
  pageName: string;
  pageSlug: string;
  layout: BuilderPageLayout;
  isDirty: boolean;
  lastSavedJson: string | null;
}

export interface BuilderPageInput {
  pageId: string;
  siteId: string;
  pageName: string;
  pageSlug: string;
  layoutJson?: string | null;
}

export interface BuilderState {
  pagesById: Record<string, BuilderPageState>;
  pageOrder: string[];
  activePageId: string | null;
  selectedComponentId: string | null;
  hydratePages: (pages: BuilderPageInput[]) => void;
  setActivePage: (pageId: string) => void;
  selectComponent: (componentId: string | null) => void;
  createPage: (page: BuilderPageInput) => void;
  addComponent: (
    pageId: string,
    component: Omit<BuilderComponentNode, 'children'> & { children?: string[] },
    options?: {
      parentId?: string | null;
      index?: number;
    }
  ) => void;
  updateComponentProps: (
    pageId: string,
    componentId: string,
    props: Partial<BuilderComponentProps>
  ) => void;
  removeComponent: (pageId: string, componentId: string) => void;
  moveComponent: (
    pageId: string,
    componentId: string,
    options: {
      targetParentId?: string | null;
      targetIndex: number;
    }
  ) => void;
  replacePageLayout: (pageId: string, layoutJson: string) => void;
  markPageSaved: (pageId: string, savedJson?: string) => void;
  getPageJson: (pageId: string) => string;
}

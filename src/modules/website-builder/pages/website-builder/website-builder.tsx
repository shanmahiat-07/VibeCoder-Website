import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowRight,
  FormInput,
  Image as ImageIcon,
  PanelRight,
  Square,
  Trash2,
  Type,
  Wallpaper,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  createPage,
  createSite,
  deletePage,
  getLayout,
  getPages,
  getSites,
  publishSite,
  saveLayout,
} from '../../services/website-builder.service';
import type { WebsitePage, WebsiteSite } from '../../types/website-builder.types';

type LibraryType = 'hero' | 'text' | 'image' | 'form';

type LayoutComponent = {
  id: string;
  type: LibraryType;
  props: {
    text?: string;
    color?: string;
    imageUrl?: string;
  };
};

type LayoutState = {
  components: LayoutComponent[];
};

const LIBRARY_ITEMS: Array<{
  type: LibraryType;
  label: string;
  description: string;
  icon: typeof Type;
  defaultProps: LayoutComponent['props'];
}> = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Large heading section',
    icon: Wallpaper,
    defaultProps: { text: 'Hero headline', color: '#e2e8f0' },
  },
  {
    type: 'text',
    label: 'Text Block',
    description: 'Simple text content',
    icon: Type,
    defaultProps: { text: 'Write your content here', color: '#cbd5e1' },
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Image with URL',
    icon: ImageIcon,
    defaultProps: { imageUrl: 'https://placehold.co/1200x600', text: 'Image alt text' },
  },
  {
    type: 'form',
    label: 'Form',
    description: 'Simple form section',
    icon: FormInput,
    defaultProps: { text: 'Contact Form', color: '#e2e8f0' },
  },
];

const emptyLayout: LayoutState = { components: [] };

const parseLayout = (layoutJson: string): LayoutState => {
  try {
    const parsed = JSON.parse(layoutJson) as Partial<LayoutState>;
    if (!parsed || !Array.isArray(parsed.components)) {
      return emptyLayout;
    }

    return {
      components: parsed.components
        .filter((component): component is LayoutComponent => Boolean(component?.id && component?.type))
        .map((component) => ({
          id: component.id,
          type: component.type,
          props: component.props || {},
        })),
    };
  } catch {
    return emptyLayout;
  }
};

const stringifyLayout = (layout: LayoutState) => JSON.stringify(layout);

const createId = () => `cmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const DraggableLibraryItem = ({
  type,
  label,
  description,
  icon: Icon,
}: {
  type: LibraryType;
  label: string;
  description: string;
  icon: typeof Type;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${type}`,
    data: {
      source: 'library',
      componentType: type,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-300/40 hover:bg-white/10"
      {...listeners}
      {...attributes}
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
      </div>
    </button>
  );
};

const SortableCanvasItem = ({
  component,
  isSelected,
  onSelect,
}: {
  component: LayoutComponent;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: component.id,
    data: {
      source: 'canvas',
      componentId: component.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'w-full rounded-3xl border p-5 text-left transition',
        isSelected
          ? 'border-cyan-300/60 bg-cyan-300/10 shadow-lg shadow-cyan-950/20'
          : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]',
      ].join(' ')}
      onClick={() => onSelect(component.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onSelect(component.id);
        }
      }}
      {...attributes}
      {...listeners}
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
        {component.type}
      </div>

      {component.type === 'image' ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
          <img src={component.props.imageUrl || 'https://placehold.co/1200x600'} alt={component.props.text || 'Image'} className="h-48 w-full object-cover" />
        </div>
      ) : null}

      <p className="mt-3 text-lg font-semibold" style={{ color: component.props.color || '#f8fafc' }}>
        {component.props.text || component.type}
      </p>
    </div>
  );
};

export const WebsiteBuilderPage = () => {
  const navigate = useNavigate();
  const { siteId: routeSiteId, pageId: routePageId } = useParams();

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  const [sites, setSites] = useState<WebsiteSite[]>([]);
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState(routeSiteId ?? '');
  const [selectedPageId, setSelectedPageId] = useState(routePageId ?? '');
  const [layout, setLayout] = useState<LayoutState>(emptyLayout);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const lastSavedRef = useRef('');
  const debounceRef = useRef<number | null>(null);

  const { setNodeRef: setCanvasDropRef, isOver } = useDroppable({
    id: 'canvas-dropzone',
    data: { source: 'canvas-dropzone' },
  });

  const selectedComponent = useMemo(
    () => layout.components.find((component) => component.id === selectedComponentId) ?? null,
    [layout.components, selectedComponentId]
  );

  const goToBuilderRoute = (siteId: string, pageId?: string) => {
    if (!siteId) {
      navigate('/website-builder');
      return;
    }

    if (!pageId) {
      navigate(`/website-builder/${siteId}`);
      return;
    }

    navigate(`/website-builder/${siteId}/${pageId}`);
  };

  const loadSites = async () => {
    const response = await getSites();
    setSites(response.items);

    const nextSiteId = routeSiteId || selectedSiteId || response.items[0]?.itemId || '';
    setSelectedSiteId(nextSiteId);
    return nextSiteId;
  };

  const loadPages = async (siteId: string, preferredPageId?: string) => {
    if (!siteId) {
      setPages([]);
      setSelectedPageId('');
      setLayout(emptyLayout);
      setSelectedComponentId(null);
      return '';
    }

    let response = await getPages(siteId);

    if (response.items.length === 0) {
      await createPage(siteId, 'Home');
      response = await getPages(siteId);
    }

    setPages(response.items);

    const nextPageId =
      (preferredPageId && response.items.some((page) => page.itemId === preferredPageId)
        ? preferredPageId
        : '') || response.items[0]?.itemId || '';

    setSelectedPageId(nextPageId);
    return nextPageId;
  };

  const loadLayout = async (siteId: string, pageId: string) => {
    if (!siteId || !pageId) {
      setLayout(emptyLayout);
      setSelectedComponentId(null);
      lastSavedRef.current = stringifyLayout(emptyLayout);
      return;
    }

    const layoutJson = await getLayout(siteId, pageId);
    const parsedLayout = parseLayout(layoutJson);
    setLayout(parsedLayout);
    setSelectedComponentId(null);
    lastSavedRef.current = stringifyLayout(parsedLayout);
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      setIsLoading(true);
      try {
        const nextSiteId = await loadSites();
        if (!active || !nextSiteId) return;

        const nextPageId = await loadPages(nextSiteId, routePageId || selectedPageId);
        if (!active) return;

        if (nextSiteId && nextPageId) {
          goToBuilderRoute(nextSiteId, nextPageId);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void init();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (routeSiteId && routeSiteId !== selectedSiteId) {
      setSelectedSiteId(routeSiteId);
    }
    if (routePageId && routePageId !== selectedPageId) {
      setSelectedPageId(routePageId);
    }
  }, [routeSiteId, routePageId, selectedSiteId, selectedPageId]);

  useEffect(() => {
    if (!selectedSiteId) return;

    void loadPages(selectedSiteId, routePageId || selectedPageId).then((nextPageId) => {
      if (nextPageId && (nextPageId !== routePageId || selectedSiteId !== routeSiteId)) {
        goToBuilderRoute(selectedSiteId, nextPageId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteId]);

  useEffect(() => {
    void loadLayout(selectedSiteId, selectedPageId);
  }, [selectedSiteId, selectedPageId]);

  useEffect(() => {
    if (!selectedSiteId || !selectedPageId) {
      return;
    }

    const nextJson = stringifyLayout(layout);
    if (nextJson === lastSavedRef.current) {
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      void saveLayout(selectedSiteId, selectedPageId, nextJson).then(() => {
        lastSavedRef.current = nextJson;
      });
    }, 700);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [layout, selectedSiteId, selectedPageId]);

  const handleCreateSite = async () => {
    const siteName = window.prompt('Site name', 'My Site')?.trim();
    if (!siteName) return;

    await createSite(siteName);
    const nextSiteId = await loadSites();
    if (!nextSiteId) return;

    const nextPageId = await loadPages(nextSiteId);
    if (nextPageId) {
      goToBuilderRoute(nextSiteId, nextPageId);
    }
  };

  const handleCreatePage = async () => {
    if (!selectedSiteId) return;

    const pageName = window.prompt('Page name', 'Home')?.trim();
    if (!pageName) return;

    const createdPage = await createPage(selectedSiteId, pageName);
    await loadPages(selectedSiteId, createdPage.itemId);
    goToBuilderRoute(selectedSiteId, createdPage.itemId);
  };

  const handleSelectPage = (page: WebsitePage) => {
    setSelectedPageId(page.itemId);
    goToBuilderRoute(page.siteId, page.itemId);
  };

  const handleDeletePage = async (page: WebsitePage) => {
    const confirmed = window.confirm(`Delete page "${page.pageName}"?`);
    if (!confirmed) return;

    await deletePage(page.siteId, page.itemId);
    const nextPageId = await loadPages(page.siteId);

    if (nextPageId) {
      goToBuilderRoute(page.siteId, nextPageId);
    } else {
      goToBuilderRoute(page.siteId);
    }
  };

  const handlePublishSite = async () => {
    if (!selectedSiteId) return;
    await publishSite(selectedSiteId);
    await loadSites();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeSource = active.data.current?.source;
    const overSource = over.data.current?.source;

    if (activeSource === 'library' && (overSource === 'canvas-dropzone' || overSource === 'canvas')) {
      const componentType = active.data.current?.componentType as LibraryType | undefined;
      const libraryItem = LIBRARY_ITEMS.find((item) => item.type === componentType);

      if (!libraryItem) {
        return;
      }

      const nextComponent: LayoutComponent = {
        id: createId(),
        type: libraryItem.type,
        props: { ...libraryItem.defaultProps },
      };

      setLayout((current) => ({
        components: [...current.components, nextComponent],
      }));
      setSelectedComponentId(nextComponent.id);
      return;
    }

    if (activeSource === 'canvas' && overSource === 'canvas') {
      const oldIndex = layout.components.findIndex((component) => component.id === String(active.id));
      const newIndex = layout.components.findIndex((component) => component.id === String(over.id));

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return;
      }

      setLayout((current) => ({
        components: arrayMove(current.components, oldIndex, newIndex),
      }));
    }
  };

  const updateSelectedComponent = (patch: Partial<LayoutComponent['props']>) => {
    if (!selectedComponent) return;

    setLayout((current) => ({
      components: current.components.map((component) =>
        component.id === selectedComponent.id
          ? { ...component, props: { ...component.props, ...patch } }
          : component
      ),
    }));
  };

  const removeSelectedComponent = () => {
    if (!selectedComponent) return;

    setLayout((current) => ({
      components: current.components.filter((component) => component.id !== selectedComponent.id),
    }));
    setSelectedComponentId((current) => (current === selectedComponent.id ? null : current));
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col">
          <header className="border-b border-white/10 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
                  Website Builder
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-white">Drag-and-drop page composer</h1>
                <p className="mt-1 text-sm text-slate-400">Layout JSON auto-saves per page in Selise Content Block.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedSiteId}
                  onChange={(event) => {
                    const nextSiteId = event.target.value;
                    setSelectedSiteId(nextSiteId);
                    goToBuilderRoute(nextSiteId);
                  }}
                  className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="">Select site</option>
                  {sites.map((site) => (
                    <option key={site.itemId} value={site.itemId}>
                      {site.siteName}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handleCreateSite} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  + Create Site
                </button>
                <button
                  type="button"
                  onClick={handleCreatePage}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  disabled={!selectedSiteId}
                >
                  + Add Page
                </button>
                <button
                  type="button"
                  onClick={handlePublishSite}
                  className="rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100"
                  disabled={!selectedSiteId}
                >
                  Publish Site
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedSiteId && selectedPageId) {
                      window.open(`/site/${selectedSiteId}/${selectedPageId}`, '_blank');
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
                  disabled={!selectedSiteId || !selectedPageId}
                >
                  Preview page
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </header>

          <section className="grid flex-1 gap-4 p-4 sm:p-6 xl:grid-cols-[280px_minmax(0,1fr)_360px] xl:p-8">
            <aside className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Pages</h2>
                <button
                  type="button"
                  onClick={handleCreatePage}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs"
                  disabled={!selectedSiteId}
                >
                  + Add
                </button>
              </div>

              <div className="mb-6 space-y-2">
                {pages.map((page) => {
                  const isActive = page.itemId === selectedPageId;

                  return (
                    <div
                      key={page.itemId}
                      className={[
                        'flex items-center justify-between gap-2 rounded-xl border px-3 py-2',
                        isActive ? 'border-cyan-300/60 bg-cyan-300/10' : 'border-white/10 bg-white/5',
                      ].join(' ')}
                    >
                      <button type="button" onClick={() => handleSelectPage(page)} className="truncate text-left text-sm text-white">
                        {page.pageName}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeletePage(page)}
                        className="rounded-md p-1 text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-200"
                        title="Delete page"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">Components</h2>
              </div>
              <div className="space-y-3">
                {LIBRARY_ITEMS.map((item) => (
                  <DraggableLibraryItem
                    key={item.type}
                    type={item.type}
                    label={item.label}
                    description={item.description}
                    icon={item.icon}
                  />
                ))}
              </div>
            </aside>

            <div className="rounded-3xl border border-dashed border-cyan-300/20 bg-slate-900/60 p-6">
              <div className="flex h-full min-h-[640px] flex-col rounded-[1.5rem] border border-white/10 bg-slate-950 p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm font-medium text-white">Canvas</p>
                    <p className="text-xs text-slate-400">Drag from library, reorder by dragging inside canvas</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300">
                    <Square className="size-3.5" />
                    {layout.components.length} blocks
                  </div>
                </div>

                <div
                  ref={setCanvasDropRef}
                  className={[
                    'mt-6 flex-1 space-y-4 rounded-3xl border p-4 transition',
                    isOver ? 'border-cyan-300/50 bg-cyan-300/5' : 'border-white/10 bg-slate-900/40',
                  ].join(' ')}
                >
                  {isLoading || layout.components.length === 0 ? (
                    <div className="flex h-full min-h-[500px] items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] text-center">
                      <div className="max-w-md px-6">
                        <p className="text-lg font-semibold text-white">Canvas is empty</p>
                        <p className="mt-2 text-sm leading-7 text-slate-400">Drag Hero, Text Block, Image, or Form from the left panel.</p>
                      </div>
                    </div>
                  ) : (
                    <SortableContext
                      items={layout.components.map((component) => component.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {layout.components.map((component) => (
                        <SortableCanvasItem
                          key={component.id}
                          component={component}
                          isSelected={component.id === selectedComponentId}
                          onSelect={setSelectedComponentId}
                        />
                      ))}
                    </SortableContext>
                  )}
                </div>
              </div>
            </div>

            <aside className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Properties</h2>
                <PanelRight className="size-4 text-slate-400" />
              </div>

              {selectedComponent ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Selected block</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedComponent.type}</p>
                    <p className="mt-1 text-sm text-slate-400">Block ID: {selectedComponent.id}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-slate-200" htmlFor="prop-text">
                      Text
                    </label>
                    <input
                      id="prop-text"
                      value={selectedComponent.props.text || ''}
                      onChange={(event) => updateSelectedComponent({ text: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-slate-200" htmlFor="prop-color">
                      Color
                    </label>
                    <input
                      id="prop-color"
                      value={selectedComponent.props.color || '#e2e8f0'}
                      onChange={(event) => updateSelectedComponent({ color: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-slate-200" htmlFor="prop-image-url">
                      Image URL
                    </label>
                    <input
                      id="prop-image-url"
                      value={selectedComponent.props.imageUrl || ''}
                      onChange={(event) => updateSelectedComponent({ imageUrl: event.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={removeSelectedComponent}
                    className="w-full rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20"
                  >
                    Remove block
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-slate-400">
                  Select a block to edit text, color, and image URL.
                </div>
              )}
            </aside>
          </section>
        </div>
      </main>
    </DndContext>
  );
};

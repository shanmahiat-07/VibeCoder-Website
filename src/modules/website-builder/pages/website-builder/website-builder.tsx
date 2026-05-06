import { useEffect, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CloudOff,
  Copy,
  Globe2,
  LoaderCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui-kit/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-kit/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui-kit/dialog';
import { Input } from '@/components/ui-kit/input';
import { Label } from '@/components/ui-kit/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui-kit/tabs';
import { useGlobalMutation } from '@/state/query-client/hooks';
import { BuilderCanvas } from '../../components/builder-canvas/builder-canvas';
import {
  BuilderSidebar,
  PaletteComponentType,
} from '../../components/builder-sidebar/builder-sidebar';
import { BuilderPropertiesPanel } from '../../components/builder-properties-panel/builder-properties-panel';
import { DynamicLayoutRenderer } from '../../components/renderer/dynamic-layout-renderer';
import { useBuilderSiteSync } from '../../hooks/use-builder-site-sync';
import { createPage as createWebsitePage } from '../../services/website-builder.service';
import { useWebsiteBuilderStore } from '../../store/website-builder.store';
import type { BuilderComponentNode } from '../../types/builder-state.types';
import type { PageListResponse, WebsitePage } from '../../types/website-builder.types';

const EMPTY_LAYOUT_JSON = JSON.stringify({ components: [] });

const SAMPLE_PAGES = [
  {
    pageId: 'page-home',
    siteId: 'site-demo',
    pageName: 'Home',
    pageSlug: 'home',
    layoutJson: JSON.stringify({
      components: [
        {
          id: 'hero-seed',
          type: 'hero',
          props: {
            title: 'Build your website visually',
            subtitle: 'Drag components into the canvas and edit them on the right.',
            ctaText: 'Start building',
          },
        },
      ],
    }),
  },
  {
    pageId: 'page-about',
    siteId: 'site-demo',
    pageName: 'About',
    pageSlug: 'about',
    layoutJson: JSON.stringify({
      components: [
        {
          id: 'text-seed',
          type: 'text',
          props: {
            text: 'This page explains the story behind the site. Switch between pages to keep separate layouts in one builder state.',
          },
        },
      ],
    }),
  },
];

const createComponentTemplate = (type: PaletteComponentType): BuilderComponentNode => {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${type}-${Date.now()}`;

  if (type === 'hero') {
    return {
      id,
      type,
      props: {
        title: 'New hero section',
        subtitle: 'Describe the value of this section in one sentence.',
        ctaText: 'Click here',
      },
      children: [],
    };
  }

  if (type === 'image') {
    return {
      id,
      type,
      props: {
        imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
        alt: 'Freshly dropped image block',
      },
      children: [],
    };
  }

  return {
    id,
    type,
    props: {
      text: 'Write your paragraph here.',
    },
    children: [],
  };
};

type CreatePageVariables = {
  siteId: string;
  name: string;
};

const upsertPageListItem = (
  previous: PageListResponse | undefined,
  page: WebsitePage
): PageListResponse => {
  const previousItems = previous?.items ?? [];
  const alreadyExists = previousItems.some((item) => item.itemId === page.itemId);
  const nextItems = alreadyExists
    ? previousItems.map((item) => (item.itemId === page.itemId ? page : item))
    : [...previousItems, page];
  const pageSize = previous?.pageSize ?? 50;
  const totalCount = alreadyExists
    ? (previous?.totalCount ?? nextItems.length)
    : (previous?.totalCount ?? previousItems.length) + 1;

  return {
    items: nextItems,
    totalCount,
    pageNo: previous?.pageNo ?? 1,
    pageSize,
    totalPages: Math.max(previous?.totalPages ?? 1, Math.ceil(totalCount / pageSize)),
    hasNextPage: previous?.hasNextPage ?? false,
    hasPreviousPage: previous?.hasPreviousPage ?? false,
  };
};

const copyTextToClipboard = async (value: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  const didCopy = document.execCommand('copy');
  document.body.removeChild(textArea);

  if (!didCopy) {
    throw new Error('Clipboard copy failed');
  }
};

export const WebsiteBuilderPage = () => {
  const { siteId: routeSiteId, pageId: routePageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const pagesById = useWebsiteBuilderStore((state) => state.pagesById);
  const pageOrder = useWebsiteBuilderStore((state) => state.pageOrder);
  const activePageId = useWebsiteBuilderStore((state) => state.activePageId);
  const hydratePages = useWebsiteBuilderStore((state) => state.hydratePages);
  const setActivePage = useWebsiteBuilderStore((state) => state.setActivePage);
  const createBuilderPage = useWebsiteBuilderStore((state) => state.createPage);
  const addComponent = useWebsiteBuilderStore((state) => state.addComponent);
  const moveComponent = useWebsiteBuilderStore((state) => state.moveComponent);
  const getPageJson = useWebsiteBuilderStore((state) => state.getPageJson);
  const {
    activePageSaveStatus,
    hasBackendBinding,
    isLoadingPages,
    isPagesError,
    pagesErrorMessage,
    refetchPages,
    retryActivePageSave,
  } = useBuilderSiteSync({
    siteId: routeSiteId,
    pageId: routePageId,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const createPageMutation = useGlobalMutation<WebsitePage, Error, CreatePageVariables>({
    mutationFn: ({ siteId, name }) => createWebsitePage(siteId, name),
    onSuccess: (createdPage) => {
      queryClient.setQueryData<PageListResponse>(
        ['website-builder-pages', createdPage.siteId],
        (previous) => upsertPageListItem(previous, createdPage)
      );

      createBuilderPage({
        pageId: createdPage.itemId,
        siteId: createdPage.siteId,
        pageName: createdPage.pageName,
        pageSlug: createdPage.pageSlug,
        layoutJson: createdPage.layoutJson || EMPTY_LAYOUT_JSON,
      });
      setActivePage(createdPage.itemId);
      navigate(`/website-builder/${createdPage.siteId}/${createdPage.itemId}`);
    },
  });

  useEffect(() => {
    if (!hasBackendBinding && pageOrder.length === 0) {
      hydratePages(SAMPLE_PAGES);
    }
  }, [hasBackendBinding, hydratePages, pageOrder.length]);

  useEffect(() => {
    if (!hasBackendBinding || !routeSiteId || isLoadingPages) return;

    if (routePageId && pagesById[routePageId]) {
      if (activePageId !== routePageId) {
        setActivePage(routePageId);
      }
      return;
    }

    if (activePageId && routePageId !== activePageId) {
      navigate(`/website-builder/${routeSiteId}/${activePageId}`, { replace: true });
    }
  }, [
    activePageId,
    hasBackendBinding,
    isLoadingPages,
    navigate,
    pagesById,
    routePageId,
    routeSiteId,
    setActivePage,
  ]);

  const activePage = activePageId ? pagesById[activePageId] : null;
  const publicPath = activePage ? `/site/${activePage.siteId}/${activePage.pageId}` : '';
  const publicUrl = publicPath;

  const activePageJson = useMemo(() => {
    if (!activePageId) {
      return JSON.stringify({ components: [] }, null, 2);
    }

    return JSON.stringify(JSON.parse(getPageJson(activePageId)), null, 2);
  }, [activePageId, getPageJson]);

  useEffect(() => {
    if (isPublishDialogOpen) {
      setCopyStatus('idle');
    }
  }, [isPublishDialogOpen, publicUrl]);

  const handlePublish = () => {
    if (!activePageId || !activePage) return;

    if (activePage.isDirty) {
      retryActivePageSave();
    }

    setIsPublishDialogOpen(true);
  };

  const handleCopyPublicUrl = async () => {
    if (!publicUrl) return;

    try {
      await copyTextToClipboard(publicUrl);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
  };

  const handleRetryPages = () => {
    void refetchPages();
  };

  const handleAddPage = () => {
    const nextIndex = pageOrder.length + 1;
    const pageName = `Page ${nextIndex}`;

    if (hasBackendBinding && routeSiteId) {
      createPageMutation.mutate({
        siteId: routeSiteId,
        name: pageName,
      });
      return;
    }

    const pageId = `page-${Date.now()}`;

    createBuilderPage({
      pageId,
      siteId: 'site-demo',
      pageName,
      pageSlug: `page-${nextIndex}`,
      layoutJson: EMPTY_LAYOUT_JSON,
    });
    setActivePage(pageId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!activePageId || !activePage) return;

    const { active, over } = event;
    if (!over) return;

    const activeSource = active.data.current?.source;
    const overId = String(over.id);

    if (activeSource === 'palette') {
      const componentType = active.data.current?.componentType as PaletteComponentType | undefined;
      if (!componentType) return;

      const component = createComponentTemplate(componentType);
      const overIndex = activePage.layout.rootIds.findIndex((id) => id === overId);

      addComponent(activePageId, component, {
        index: overIndex >= 0 ? overIndex : activePage.layout.rootIds.length,
      });
      return;
    }

    if (activeSource === 'canvas') {
      const activeId = String(active.id);
      const oldIndex = activePage.layout.rootIds.findIndex((id) => id === activeId);
      const newIndex = activePage.layout.rootIds.findIndex((id) => id === overId);

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return;
      }

      const reorderedIds = arrayMove(activePage.layout.rootIds, oldIndex, newIndex);
      const movedIndex = reorderedIds.findIndex((id) => id === activeId);

      moveComponent(activePageId, activeId, {
        targetIndex: movedIndex,
      });
    }
  };

  const saveIndicator = (() => {
    if (!hasBackendBinding) {
      return {
        label: 'Demo mode',
        icon: null,
        className: 'text-muted-foreground',
      };
    }

    if (isLoadingPages) {
      return {
        label: 'Loading pages...',
        icon: <LoaderCircle className="size-4 animate-spin" />,
        className: 'text-muted-foreground',
      };
    }

    if (isPagesError) {
      return {
        label: 'Page load failed',
        icon: <AlertCircle className="size-4" />,
        className: 'text-destructive',
      };
    }

    if (activePageSaveStatus === 'saving') {
      return {
        label: 'Saving...',
        icon: <LoaderCircle className="size-4 animate-spin" />,
        className: 'text-primary',
      };
    }

    if (activePageSaveStatus === 'saved') {
      return {
        label: 'Saved',
        icon: <CheckCircle2 className="size-4" />,
        className: 'text-emerald-600',
      };
    }

    if (activePageSaveStatus === 'error') {
      return {
        label: 'Save failed',
        icon: <CloudOff className="size-4" />,
        className: 'text-destructive',
      };
    }

    return {
      label: 'Ready',
      icon: <CheckCircle2 className="size-4" />,
      className: 'text-muted-foreground',
    };
  })();

  const handlePageTabChange = (nextPageId: string) => {
    setActivePage(nextPageId);

    if (hasBackendBinding && routeSiteId) {
      navigate(`/website-builder/${routeSiteId}/${nextPageId}`);
    }
  };

  return (
    <main
      className="flex w-full flex-col gap-6 p-4 md:p-6"
      role="main"
      aria-label="Website Builder"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Website Builder</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag components from the sidebar, reorder them on the canvas, and edit their props on
            the right.
          </p>
          <div className={`mt-3 inline-flex items-center gap-2 text-sm ${saveIndicator.className}`}>
            {saveIndicator.icon}
            <span>{saveIndicator.label}</span>
            {activePageSaveStatus === 'error' ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={retryActivePageSave}
                className="h-7 px-2"
              >
                <RefreshCw className="size-3.5" />
                Retry
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handlePublish}
              disabled={isLoadingPages || isPagesError || !activePageId || !activePage}
            >
              <Globe2 className="size-4" />
              Publish
            </Button>
            <Button
              onClick={handleAddPage}
              disabled={isLoadingPages || isPagesError || createPageMutation.isPending}
              loading={createPageMutation.isPending}
            >
              <Plus className="size-4" />
              Add Page
            </Button>
          </div>
          {createPageMutation.isError ? (
            <p className="text-sm text-destructive" role="status">
              Could not create the page. Try again.
            </p>
          ) : null}
        </div>
      </div>

      {isLoadingPages ? (
        <Card>
          <CardContent className="flex min-h-[220px] items-center justify-center gap-3 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Loading pages...
          </CardContent>
        </Card>
      ) : null}

      {!isLoadingPages && isPagesError ? (
        <Card>
          <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="size-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Could not load pages</h2>
              <p className="max-w-md text-sm text-muted-foreground">{pagesErrorMessage}</p>
            </div>
            <Button type="button" variant="outline" onClick={handleRetryPages}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoadingPages && !isPagesError && pageOrder.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">No pages yet</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Create the first page to start building this site.
              </p>
            </div>
            <Button
              onClick={handleAddPage}
              loading={createPageMutation.isPending}
              disabled={createPageMutation.isPending}
            >
              <Plus className="size-4" />
              Add Page
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoadingPages && !isPagesError && pageOrder.length > 0 ? (
        <Tabs value={activePageId ?? undefined} onValueChange={handlePageTabChange}>
          <TabsList>
            {pageOrder.map((pageId) => (
              <TabsTrigger key={pageId} value={pageId}>
                {pagesById[pageId]?.pageName ?? pageId}
              </TabsTrigger>
            ))}
          </TabsList>

          {activePageId ? (
            <TabsContent value={activePageId} className="mt-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
                  <div className="min-h-[720px]">
                    <BuilderSidebar />
                  </div>
                  <div className="min-h-[720px]">
                    <BuilderCanvas pageId={activePageId} />
                  </div>
                  <div className="space-y-6">
                    <div className="min-h-[360px]">
                      <BuilderPropertiesPanel pageId={activePageId} />
                    </div>
                    <Card>
                      <CardHeader className="border-b">
                        <CardTitle>Live Preview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-xl border bg-muted/10 p-4">
                          <DynamicLayoutRenderer
                            layout={pagesById[activePageId]?.layout}
                            mode="preview"
                            className="space-y-4"
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="border-b">
                        <CardTitle>Layout JSON</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="max-h-[320px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
                          {activePageJson}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <DragOverlay>
                  <div className="rounded-lg border border-primary/40 bg-card px-4 py-3 text-sm font-medium shadow-lg">
                    Dragging component
                  </div>
                </DragOverlay>
              </DndContext>
            </TabsContent>
          ) : null}
        </Tabs>
      ) : null}

      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Page</DialogTitle>
            <DialogDescription>Public route for the active page.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="public-url">Public URL</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="public-url" value={publicUrl} readOnly />
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyPublicUrl}
                disabled={!publicUrl}
                className="sm:w-[120px]"
              >
                {copyStatus === 'copied' ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copyStatus === 'copied' ? 'Copied' : 'Copy'}
              </Button>
            </div>
            {copyStatus === 'error' ? (
              <p className="text-sm text-destructive" role="status">
                Copy failed. Select the URL and copy it manually.
              </p>
            ) : null}
            {activePageSaveStatus === 'saving' ? (
              <p className="text-sm text-muted-foreground" role="status">
                Latest changes are still saving.
              </p>
            ) : null}
          </div>

          <DialogFooter>
            {publicPath && activePageSaveStatus !== 'saving' ? (
              <Button asChild variant="outline">
                <a href={publicPath} target="_blank" rel="noreferrer">
                  Open Public Page
                </a>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Open Public Page
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

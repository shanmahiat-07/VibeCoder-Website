import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGlobalMutation, useGlobalQuery } from '@/state/query-client/hooks';
import { getPages, savePage } from '../services/website-builder.service';
import { useWebsiteBuilderStore } from '../store/website-builder.store';
import type {
  PageListResponse,
  SavePageInput,
  SavePageResponse,
} from '../types/website-builder.types';

export type BuilderSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type UseBuilderSiteSyncParams = {
  siteId?: string;
  pageId?: string;
};

export const useBuilderSiteSync = ({ siteId, pageId }: UseBuilderSiteSyncParams) => {
  const queryClient = useQueryClient();
  const [saveStatusByPageId, setSaveStatusByPageId] = useState<Record<string, BuilderSaveStatus>>(
    {}
  );
  const hydratePages = useWebsiteBuilderStore((state) => state.hydratePages);
  const setActivePage = useWebsiteBuilderStore((state) => state.setActivePage);
  const markPageSaved = useWebsiteBuilderStore((state) => state.markPageSaved);
  const pagesById = useWebsiteBuilderStore((state) => state.pagesById);
  const activePageId = useWebsiteBuilderStore((state) => state.activePageId);
  const getPageJson = useWebsiteBuilderStore((state) => state.getPageJson);
  const timeoutMapRef = useRef<Record<string, number>>({});

  const enabled = Boolean(siteId);

  const pagesQuery = useGlobalQuery({
    queryKey: ['website-builder-pages', siteId],
    queryFn: () => {
      if (!siteId) {
        throw new Error('siteId is required to load builder pages');
      }

      return getPages(siteId);
    },
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: savePageAsync } = useGlobalMutation<SavePageResponse, Error, SavePageInput>({
    mutationFn: savePage,
    suppressToast: true,
    onSuccess: (_, variables) => {
      const currentJson = getPageJson(variables.pageId);

      queryClient.setQueryData<PageListResponse>(
        ['website-builder-pages', variables.siteId],
        (previous) =>
          previous
            ? {
                ...previous,
                items: previous.items.map((page) =>
                  page.itemId === variables.pageId
                    ? {
                        ...page,
                        layoutJson: variables.json,
                      }
                    : page
                ),
              }
            : previous
      );

      if (currentJson !== variables.json) {
        setSaveStatusByPageId((previous) => ({
          ...previous,
          [variables.pageId]: 'saving',
        }));
        return;
      }

      markPageSaved(variables.pageId, variables.json);
      setSaveStatusByPageId((previous) => ({
        ...previous,
        [variables.pageId]: 'saved',
      }));
    },
    onError: (_, variables) => {
      setSaveStatusByPageId((previous) => ({
        ...previous,
        [variables.pageId]: 'error',
      }));
    },
  });
  const savePageAsyncRef = useRef(savePageAsync);

  useEffect(() => {
    savePageAsyncRef.current = savePageAsync;
  }, [savePageAsync]);

  const clearSaveTimeout = useCallback((targetPageId: string) => {
    const timeoutId = timeoutMapRef.current[targetPageId];
    if (!timeoutId) return;

    window.clearTimeout(timeoutId);
    delete timeoutMapRef.current[targetPageId];
  }, []);

  const runSave = useCallback(async (input: SavePageInput) => {
    setSaveStatusByPageId((previous) => ({
      ...previous,
      [input.pageId]: 'saving',
    }));

    try {
      await savePageAsyncRef.current(input);
    } catch {
      // useGlobalMutation routes the error into onError; avoid an unhandled promise rejection.
    }
  }, []);

  const retryActivePageSave = useCallback(() => {
    if (!enabled || !siteId || !activePageId) return;

    const page = pagesById[activePageId];
    if (!page?.isDirty) return;

    clearSaveTimeout(activePageId);
    void runSave({
      siteId,
      pageId: activePageId,
      json: getPageJson(activePageId),
    });
  }, [activePageId, clearSaveTimeout, enabled, getPageJson, pagesById, runSave, siteId]);

  useEffect(() => {
    if (!enabled || !pagesQuery.data) return;

    const mappedPages = pagesQuery.data.items.map((page) => ({
      pageId: page.itemId,
      siteId: page.siteId,
      pageName: page.pageName,
      pageSlug: page.pageSlug,
      layoutJson: page.layoutJson,
    }));

    hydratePages(mappedPages);

    const nextActivePageId =
      (pageId && mappedPages.some((page) => page.pageId === pageId) ? pageId : null) ??
      mappedPages[0]?.pageId ??
      null;

    if (nextActivePageId) {
      setActivePage(nextActivePageId);
    }
  }, [enabled, hydratePages, pageId, pagesQuery.data, setActivePage]);

  useEffect(() => {
    if (!enabled || !siteId) return;

    const sitePages = Object.values(pagesById).filter((page) => page.siteId === siteId);

    sitePages.forEach((page) => {
      if (!page.isDirty) {
        return;
      }

      const pageJson = getPageJson(page.pageId);

      clearSaveTimeout(page.pageId);

      setSaveStatusByPageId((previous) => ({
        ...previous,
        [page.pageId]: 'saving',
      }));

      const timeoutId = window.setTimeout(() => {
        void runSave({
          siteId,
          pageId: page.pageId,
          json: pageJson,
        });

        if (timeoutMapRef.current[page.pageId] === timeoutId) {
          delete timeoutMapRef.current[page.pageId];
        }
      }, 800);

      timeoutMapRef.current[page.pageId] = timeoutId;
    });
  }, [clearSaveTimeout, enabled, getPageJson, pagesById, runSave, siteId]);

  useEffect(
    () => () => {
      Object.values(timeoutMapRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
    },
    []
  );

  const activePageSaveStatus = activePageId ? (saveStatusByPageId[activePageId] ?? 'idle') : 'idle';

  const loadedPages = useMemo(() => pagesQuery.data?.items ?? [], [pagesQuery.data]);
  const pagesErrorMessage =
    pagesQuery.error instanceof Error ? pagesQuery.error.message : 'Pages could not be loaded';

  return {
    activePageSaveStatus,
    hasBackendBinding: enabled,
    isLoadingPages: enabled ? pagesQuery.isLoading : false,
    isFetchingPages: enabled ? pagesQuery.isFetching : false,
    isPagesError: enabled ? pagesQuery.isError : false,
    pagesErrorMessage,
    loadedPages,
    refetchPages: pagesQuery.refetch,
    retryActivePageSave,
  };
};

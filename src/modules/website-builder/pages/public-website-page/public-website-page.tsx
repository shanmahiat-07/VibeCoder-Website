import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { LoadingOverlay } from '@/components/core/loading-overlay/loading-overlay';
import { cn } from '@/lib/utils';
import { DynamicLayoutRenderer } from '../../components/renderer/dynamic-layout-renderer';
import { getPages } from '../../services/website-builder.service';
import type { WebsitePage } from '../../types/website-builder.types';

const sortPages = (pages: WebsitePage[]) =>
  [...pages].sort((firstPage, secondPage) => {
    const firstOrder = Number(firstPage.pageOrder) || 0;
    const secondOrder = Number(secondPage.pageOrder) || 0;

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    return firstPage.pageName.localeCompare(secondPage.pageName);
  });

const getPublicPagePath = (page: WebsitePage) => `/site/${page.siteId}/${page.itemId}`;

export const PublicWebsitePage = () => {
  const { siteId, pageId } = useParams();

  const pagesQuery = useQuery({
    queryKey: ['public-website-pages', siteId],
    queryFn: () => {
      if (!siteId) {
        throw new Error('siteId is required');
      }

      return getPages(siteId);
    },
    enabled: Boolean(siteId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const pages = useMemo(() => sortPages(pagesQuery.data?.items ?? []), [pagesQuery.data?.items]);
  const activePage = useMemo(
    () => pages.find((page) => page.itemId === pageId) ?? null,
    [pageId, pages]
  );

  useEffect(() => {
    const nextTitle =
      activePage?.seoTitle?.trim() || activePage?.pageName?.trim() || 'Website Page';

    document.title = nextTitle;
  }, [activePage?.pageName, activePage?.seoTitle]);

  if (pagesQuery.isLoading) {
    return <LoadingOverlay />;
  }

  if (pagesQuery.isError) {
    return (
      <main className="min-h-screen bg-background px-4 py-16 text-foreground md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Unable to load this page</h1>
          <p className="text-sm text-muted-foreground">
            The content could not be fetched right now. Please try again later.
          </p>
        </div>
      </main>
    );
  }

  if (!activePage) {
    return (
      <main className="min-h-screen bg-background px-4 py-16 text-foreground md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            No published content was found for this site and page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {pages.length > 1 ? (
        <nav className="border-b bg-background" aria-label="Site navigation">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap gap-2 px-4 py-3 md:px-8">
            {pages.map((page) => {
              const isActive = page.itemId === activePage.itemId;

              return (
                <Link
                  key={page.itemId}
                  to={getPublicPagePath(page)}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition hover:bg-muted',
                    isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {page.pageName}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}

      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {activePage.pageName}
          </h1>
          {activePage.seoDescription ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {activePage.seoDescription}
            </p>
          ) : null}
        </header>

        <DynamicLayoutRenderer
          layoutJson={activePage.layoutJson}
          mode="public"
          className="space-y-6"
        />
      </div>
    </main>
  );
};

import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import { ComponentRenderer } from '../../components/renderer/ComponentRenderer';
import { getPublishedPage, getPublishedPages, getPublishedSiteById } from '../../services/website-builder.service';
import type { WebsitePage, WebsiteSite } from '../../types/website-builder.types';

type LayoutComponent = {
  id: string;
  type: string;
  props?: {
    text?: string;
    color?: string;
    imageUrl?: string;
  };
};

type LayoutState = {
  components: LayoutComponent[];
};

const parseLayout = (layoutJson: string): LayoutState => {
  try {
    const parsed = JSON.parse(layoutJson) as Partial<LayoutState>;
    return {
      components: Array.isArray(parsed.components) ? parsed.components : [],
    };
  } catch {
    return { components: [] };
  }
};

export const PublicWebsitePage = () => {
  const { siteId, pageId } = useParams();
  const [site, setSite] = useState<WebsiteSite | null>(null);
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [currentPage, setCurrentPage] = useState<WebsitePage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!siteId || !pageId) {
        if (active) {
          setIsBlocked(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const publishedSite = await getPublishedSiteById(siteId);

        if (!active) return;

        if (!publishedSite) {
          setIsBlocked(true);
          return;
        }

        const publishedPages = await getPublishedPages(siteId);
        const selectedPage = await getPublishedPage(siteId, pageId);

        if (!active) return;

        if (!selectedPage) {
          setIsBlocked(true);
          return;
        }

        setSite(publishedSite);
        setPages(publishedPages.items);
        setCurrentPage(selectedPage);
      } catch {
        if (active) {
          setIsBlocked(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [siteId, pageId]);

  const layout = useMemo(() => parseLayout(currentPage?.layoutJson || '{"components":[]}'), [currentPage]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Loading site</p>
      </main>
    );
  }

  if (isBlocked || !site || !currentPage) {
    return <Navigate to="/404" replace />;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
          <div className="text-sm text-slate-300">
            <span className="font-semibold text-white">{site.siteName}</span>
            {site.publishedAt ? <span className="ml-2 text-slate-400">Published: {new Date(site.publishedAt).toLocaleString()}</span> : null}
          </div>
        </header>

        <section className="grid flex-1 gap-6 py-8 lg:grid-cols-[1fr_280px] lg:items-start">
          <article className="space-y-4">
            {layout.components.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">This page has no published components.</div>
            ) : (
              layout.components.map((component) => <ComponentRenderer key={component.id} component={component} />)
            )}
          </article>

          <aside className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
            <p className="text-sm font-semibold text-white">Pages</p>
            <div className="mt-3 space-y-2">
              {pages.map((page) => {
                const isActive = page.itemId === currentPage.itemId;
                return (
                  <Link
                    key={page.itemId}
                    to={`/site/${site.itemId}/${page.itemId}`}
                    className={[
                      'block rounded-xl border px-3 py-2 text-sm transition',
                      isActive
                        ? 'border-cyan-300/60 bg-cyan-300/10 text-white'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:text-white',
                    ].join(' ')}
                  >
                    {page.pageName}
                  </Link>
                );
              })}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
};

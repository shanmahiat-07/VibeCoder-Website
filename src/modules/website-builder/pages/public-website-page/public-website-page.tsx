import { ArrowLeft, FileText, LayoutPanelLeft, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

type PageBlock =
  | {
      type: 'hero';
      eyebrow: string;
      title: string;
      description: string;
      primaryAction: string;
      secondaryAction: string;
    }
  | {
      type: 'text';
      title: string;
      body: string;
    }
  | {
      type: 'button';
      label: string;
      variant: 'primary' | 'secondary';
    };

const mockPageBlocks: PageBlock[] = [
  {
    type: 'hero',
    eyebrow: 'Public page renderer',
    title: 'Build a simple page from a mock schema.',
    description:
      'This page simulates how a website route can resolve a site and page identifier into a rendered public layout.',
    primaryAction: 'Get started',
    secondaryAction: 'View source',
  },
  {
    type: 'text',
    title: 'Text block',
    body: 'Schema-driven content can be rendered through small block components that stay easy to reason about.',
  },
  {
    type: 'button',
    label: 'Open builder',
    variant: 'primary',
  },
];

const renderBlock = (block: PageBlock, index: number) => {
  switch (block.type) {
    case 'hero':
      return (
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
            {block.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {block.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{block.description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
            >
              {block.primaryAction}
            </button>
            <button
              type="button"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              {block.secondaryAction}
            </button>
          </div>
        </section>
      );
    case 'text':
      return (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
              <FileText className="size-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{block.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{block.body}</p>
            </div>
          </div>
        </section>
      );
    case 'button':
      return (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Action block</p>
              <p className="mt-1 text-sm text-slate-400">Rendered from the page schema.</p>
            </div>
            <button
              type="button"
              className={[
                'rounded-full px-4 py-2 text-sm font-medium transition',
                block.variant === 'secondary'
                  ? 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                  : 'bg-cyan-300 text-slate-950 hover:bg-cyan-200',
              ].join(' ')}
            >
              {block.label}
            </button>
          </div>
        </section>
      );
    default:
      return null;
  }
};

export const PublicWebsitePage = () => {
  const { siteId, pageId } = useParams();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            <Sparkles className="size-3.5 text-cyan-200" />
            Public renderer
          </div>
        </header>

        <section className="grid flex-1 gap-6 py-8 lg:grid-cols-[1fr_320px] lg:items-start">
          <article className="space-y-4">
            {mockPageBlocks.map((block, index) => (
              <div key={`${block.type}-${index}`}>{renderBlock(block, index)}</div>
            ))}
          </article>

          <aside className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
            <p className="text-sm font-semibold text-white">Page metadata</p>
            <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <LayoutPanelLeft className="size-4 text-cyan-200" />
                Rendered Page
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-slate-400">Site ID</p>
                  <p className="mt-1 break-all text-white">{siteId ?? 'unknown-site'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-slate-400">Page ID</p>
                  <p className="mt-1 break-all text-white">{pageId ?? 'unknown-page'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-white">Schema state</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                The page is rendered from a small block array with explicit component types:
                hero, text, and button.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
};

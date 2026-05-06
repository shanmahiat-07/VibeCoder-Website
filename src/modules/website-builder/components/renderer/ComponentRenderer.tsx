import type { ReactNode } from 'react';

type LayoutComponent = {
  id: string;
  type: string;
  props?: {
    text?: string;
    color?: string;
    imageUrl?: string;
  };
};

const renderByType = (component: LayoutComponent): ReactNode => {
  const text = component.props?.text || component.type;
  const color = component.props?.color || '#e2e8f0';

  if (component.type === 'hero') {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Hero Section</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl" style={{ color }}>
          {text}
        </h1>
      </section>
    );
  }

  if (component.type === 'text') {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-base leading-8" style={{ color }}>
          {text}
        </p>
      </section>
    );
  }

  if (component.type === 'image') {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <img
          src={component.props?.imageUrl || 'https://placehold.co/1200x600'}
          alt={text || 'Image'}
          className="h-auto w-full rounded-2xl border border-white/10 object-cover"
        />
      </section>
    );
  }

  if (component.type === 'form') {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="mb-4 text-lg font-semibold" style={{ color }}>
          {text}
        </p>
        <div className="space-y-3">
          <input className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm" placeholder="Your name" />
          <input className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm" placeholder="Email" />
          <button className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950">Submit</button>
        </div>
      </section>
    );
  }

  return null;
};

export const ComponentRenderer = ({ component }: { component: LayoutComponent }) => {
  return <>{renderByType(component)}</>;
};

import { useMemo, useState } from 'react';
import { ArrowRight, Image, PanelLeft, PanelRight, Plus, Square, Type } from 'lucide-react';

type ComponentType = 'Text' | 'Button' | 'Image' | 'Container';

type BuilderComponent = {
  id: string;
  type: ComponentType;
  props: Record<string, string>;
};

const componentLibrary: Array<{
  type: ComponentType;
  icon: typeof Type;
  title: string;
  description: string;
  initialProps: Record<string, string>;
}> = [
  {
    type: 'Text',
    icon: Type,
    title: 'Text',
    description: 'Typography block for headlines or copy.',
    initialProps: { content: 'New text block', size: '18', color: '#e2e8f0' },
  },
  {
    type: 'Button',
    icon: Square,
    title: 'Button',
    description: 'Action button for calls to action.',
    initialProps: { label: 'Call to action', variant: 'primary' },
  },
  {
    type: 'Image',
    icon: Image,
    title: 'Image',
    description: 'Visual block with source and alt text.',
    initialProps: { src: 'https://placehold.co/800x500', alt: 'Preview image' },
  },
  {
    type: 'Container',
    icon: PanelLeft,
    title: 'Container',
    description: 'A wrapper block to group content.',
    initialProps: { title: 'Section container', background: '#0f172a' },
  },
];

const cloneComponent = (item: (typeof componentLibrary)[number]) => ({
  id: `${item.type.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
  type: item.type,
  props: { ...item.initialProps },
});

const describeComponent = (component: BuilderComponent) => {
  switch (component.type) {
    case 'Text':
      return component.props.content || 'Text block';
    case 'Button':
      return component.props.label || 'Button';
    case 'Image':
      return component.props.alt || 'Image';
    case 'Container':
      return component.props.title || 'Container';
    default:
      return component.type;
  }
};

export const WebsiteBuilderPage = () => {
  const [selectedComponents, setSelectedComponents] = useState<BuilderComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  const selectedComponent = useMemo(
    () => selectedComponents.find((component) => component.id === selectedComponentId) ?? null,
    [selectedComponents, selectedComponentId],
  );

  const addComponent = (type: BuilderComponent['type']) => {
    const template = componentLibrary.find((item) => item.type === type);

    if (!template) {
      return;
    }

    const nextComponent = cloneComponent(template);

    setSelectedComponents((current) => [...current, nextComponent]);
    setSelectedComponentId(nextComponent.id);
  };

  const updateSelectedComponent = (patch: Record<string, string>) => {
    if (!selectedComponent) {
      return;
    }

    setSelectedComponents((current) =>
      current.map((component) =>
        component.id === selectedComponent.id
          ? { ...component, props: { ...component.props, ...patch } }
          : component,
      ),
    );
  };

  const removeSelectedComponent = () => {
    if (!selectedComponent) {
      return;
    }

    setSelectedComponents((current) =>
      current.filter((component) => component.id !== selectedComponent.id),
    );
    setSelectedComponentId((current) => (current === selectedComponent.id ? null : current));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col">
        <header className="border-b border-white/10 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
                Website Builder
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Visual page composer</h1>
              <p className="mt-1 text-sm text-slate-400">
                Add blocks, select them on the canvas, and edit their properties locally.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Edit mode
                <PanelLeft className="size-4" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
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
              <h2 className="text-lg font-semibold text-white">Components</h2>
              <Plus className="size-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {componentLibrary.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => addComponent(item.type)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-white/10"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="rounded-3xl border border-dashed border-cyan-300/20 bg-slate-900/60 p-6">
            <div className="flex h-full min-h-[640px] flex-col rounded-[1.5rem] border border-white/10 bg-slate-950 p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-medium text-white">Canvas</p>
                  <p className="text-xs text-slate-400">
                    Click a block to select it and edit the fields on the right
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300">
                  <Square className="size-3.5" />
                  {selectedComponents.length} blocks
                </div>
              </div>

              <div className="mt-6 flex-1 space-y-4 rounded-3xl border border-white/10 bg-slate-900/40 p-4">
                {selectedComponents.length === 0 ? (
                  <div className="flex h-full min-h-[500px] items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] text-center">
                    <div className="max-w-md px-6">
                      <p className="text-lg font-semibold text-white">Canvas is empty</p>
                      <p className="mt-2 text-sm leading-7 text-slate-400">
                        Add blocks from the left panel to build a simple page structure.
                      </p>
                    </div>
                  </div>
                ) : (
                  selectedComponents.map((component) => {
                    const isSelected = component.id === selectedComponentId;

                    return (
                      <button
                        key={component.id}
                        type="button"
                        onClick={() => setSelectedComponentId(component.id)}
                        className={[
                          'w-full rounded-3xl border p-5 text-left transition',
                          isSelected
                            ? 'border-cyan-300/60 bg-cyan-300/10 shadow-lg shadow-cyan-950/20'
                            : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                              {component.type}
                            </div>
                            <h3 className="mt-3 text-xl font-semibold text-white">
                              {describeComponent(component)}
                            </h3>
                          </div>
                          {isSelected ? (
                            <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-medium text-cyan-200">
                              Selected
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                          {component.type === 'Text' ? (
                            <p
                              className="text-slate-200"
                              style={{ fontSize: `${component.props.size || '18'}px`, color: component.props.color }}
                            >
                              {component.props.content}
                            </p>
                          ) : null}

                          {component.type === 'Button' ? (
                            <button
                              type="button"
                              className={[
                                'rounded-full px-4 py-2 text-sm font-medium transition',
                                component.props.variant === 'secondary'
                                  ? 'border border-white/15 bg-white/5 text-white'
                                  : 'bg-cyan-300 text-slate-950',
                              ].join(' ')}
                            >
                              {component.props.label}
                            </button>
                          ) : null}

                          {component.type === 'Image' ? (
                            <div className="overflow-hidden rounded-2xl border border-white/10">
                              <img
                                src={component.props.src}
                                alt={component.props.alt}
                                className="h-48 w-full object-cover"
                              />
                            </div>
                          ) : null}

                          {component.type === 'Container' ? (
                            <div
                              className="rounded-2xl border border-white/10 p-4"
                              style={{ backgroundColor: component.props.background }}
                            >
                              <p className="text-sm font-medium text-white">{component.props.title}</p>
                              <p className="mt-2 text-sm leading-7 text-slate-300">
                                A wrapper block for grouping sections and content.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })
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

                {selectedComponent.type === 'Text' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-200" htmlFor="text-content">
                        Content
                      </label>
                      <input
                        id="text-content"
                        value={selectedComponent.props.content || ''}
                        onChange={(event) => updateSelectedComponent({ content: event.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm text-slate-200" htmlFor="text-size">
                          Size
                        </label>
                        <input
                          id="text-size"
                          type="number"
                          value={selectedComponent.props.size || '18'}
                          onChange={(event) => updateSelectedComponent({ size: event.target.value })}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-slate-200" htmlFor="text-color">
                          Color
                        </label>
                        <input
                          id="text-color"
                          value={selectedComponent.props.color || '#e2e8f0'}
                          onChange={(event) => updateSelectedComponent({ color: event.target.value })}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50"
                        />
                      </div>
                    </div>
                  </>
                ) : null}

                {selectedComponent.type === 'Button' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-200" htmlFor="button-label">
                        Label
                      </label>
                      <input
                        id="button-label"
                        value={selectedComponent.props.label || ''}
                        onChange={(event) => updateSelectedComponent({ label: event.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-200" htmlFor="button-variant">
                        Variant
                      </label>
                      <select
                        id="button-variant"
                        value={selectedComponent.props.variant || 'primary'}
                        onChange={(event) => updateSelectedComponent({ variant: event.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50"
                      >
                        <option value="primary">Primary</option>
                        <option value="secondary">Secondary</option>
                      </select>
                    </div>
                  </>
                ) : null}

                {selectedComponent.type === 'Image' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-200" htmlFor="image-src">
                        Source URL
                      </label>
                      <input
                        id="image-src"
                        value={selectedComponent.props.src || ''}
                        onChange={(event) => updateSelectedComponent({ src: event.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-200" htmlFor="image-alt">
                        Alt text
                      </label>
                      <input
                        id="image-alt"
                        value={selectedComponent.props.alt || ''}
                        onChange={(event) => updateSelectedComponent({ alt: event.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                      />
                    </div>
                  </>
                ) : null}

                {selectedComponent.type === 'Container' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-200" htmlFor="container-title">
                        Title
                      </label>
                      <input
                        id="container-title"
                        value={selectedComponent.props.title || ''}
                        onChange={(event) => updateSelectedComponent({ title: event.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-200" htmlFor="container-background">
                        Background
                      </label>
                      <input
                        id="container-background"
                        value={selectedComponent.props.background || '#0f172a'}
                        onChange={(event) => updateSelectedComponent({ background: event.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                      />
                    </div>
                  </>
                ) : null}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">Actions</p>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedComponentId(null)}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                    >
                      Clear selection
                    </button>
                    <button
                      type="button"
                      onClick={removeSelectedComponent}
                      className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
                    >
                      Remove block
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">No block selected</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Add a block from the left panel, then click it on the canvas to edit its fields.
                </p>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
};

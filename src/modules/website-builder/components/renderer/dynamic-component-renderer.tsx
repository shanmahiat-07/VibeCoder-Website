import { cn } from '@/lib/utils';
import type {
  BuilderComponentNode,
  BuilderSerializedComponent,
} from '../../types/builder-state.types';

type RendererComponent = BuilderComponentNode | BuilderSerializedComponent;

export type DynamicRendererMode = 'editor' | 'preview' | 'public';

type RenderChildren = (
  children: string[] | BuilderSerializedComponent[] | undefined
) => React.ReactNode;

export interface DynamicComponentRendererProps {
  component: RendererComponent;
  mode?: DynamicRendererMode;
  isSelected?: boolean;
  renderChildren?: RenderChildren;
}

const getComponentChildren = (component: RendererComponent) =>
  'children' in component ? component.children : undefined;

export const DynamicComponentRenderer = ({
  component,
  mode = 'preview',
  isSelected = false,
  renderChildren,
}: DynamicComponentRendererProps) => {
  const children = renderChildren?.(getComponentChildren(component));
  const showEditorHint = mode === 'editor' && isSelected;
  const isPublic = mode === 'public';

  if (component.type === 'hero') {
    const title = String(component.props.title || (isPublic ? '' : 'Hero title'));
    const subtitle = String(
      component.props.subtitle || (isPublic ? '' : 'Add a strong subtitle for this section.')
    );
    const ctaText = String(component.props.ctaText || (isPublic ? '' : 'Get Started'));

    if (isPublic && !title && !subtitle && !ctaText && !children) {
      return null;
    }

    return (
      <section
        className={cn(
          'bg-slate-950 px-6 py-8 text-white',
          isPublic ? 'rounded-lg md:px-8 md:py-10' : 'rounded-xl'
        )}
      >
        {!isPublic ? (
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Hero</p>
        ) : null}
        {title ? (
          <h2 className={cn('text-3xl font-semibold', !isPublic && 'mt-3')}>{title}</h2>
        ) : null}
        {subtitle ? <p className="mt-3 max-w-xl text-sm text-slate-300">{subtitle}</p> : null}
        {ctaText ? (
          <div className="mt-5 inline-flex rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-950">
            {ctaText}
          </div>
        ) : null}
        {children ? <div className="mt-5 space-y-4">{children}</div> : null}
      </section>
    );
  }

  if (component.type === 'image') {
    const configuredSrc = String(component.props.imageUrl || component.props.src || '');
    const src = configuredSrc || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72';
    const alt = String(component.props.alt || (isPublic ? '' : 'Builder preview image'));

    if (isPublic && !configuredSrc && !children) {
      return null;
    }

    return (
      <figure
        className={cn('overflow-hidden bg-card', isPublic ? 'rounded-lg' : 'rounded-xl border')}
      >
        <img src={src} alt={alt} className="h-56 w-full object-cover" />
        {!isPublic ? (
          <figcaption className="border-t px-4 py-3 text-sm text-muted-foreground">
            {alt}
          </figcaption>
        ) : null}
        {children ? (
          <div className={cn('space-y-4', isPublic ? 'mt-4' : 'border-t px-4 py-4')}>
            {children}
          </div>
        ) : null}
      </figure>
    );
  }

  const text = String(
    component.props.text ||
      (isPublic ? '' : 'Use this block for body content, supporting text, or short explanations.')
  );

  if (isPublic && !text && !children) {
    return null;
  }

  return (
    <div
      className={cn(
        isPublic ? 'bg-background py-2' : 'rounded-xl border bg-background px-5 py-4',
        showEditorHint && 'shadow-sm'
      )}
    >
      {!isPublic ? (
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Text</p>
      ) : null}
      {text ? (
        <p className={cn('text-base leading-7 text-foreground', !isPublic && 'mt-3')}>{text}</p>
      ) : null}
      {showEditorHint ? <p className="mt-3 text-xs text-primary">Selected for editing</p> : null}
      {children ? <div className="mt-4 space-y-4">{children}</div> : null}
    </div>
  );
};

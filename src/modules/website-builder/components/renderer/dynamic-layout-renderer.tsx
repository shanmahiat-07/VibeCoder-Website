import type {
  BuilderPageLayout,
  BuilderSerializableLayout,
  BuilderSerializedComponent,
} from '../../types/builder-state.types';
import { DynamicComponentRenderer, type DynamicRendererMode } from './dynamic-component-renderer';

type DynamicLayoutRendererProps = {
  layoutJson?: string | null;
  layout?: BuilderPageLayout | null;
  mode?: DynamicRendererMode;
  selectedComponentId?: string | null;
  onSelectComponent?: (componentId: string) => void;
  className?: string;
};

const parseLayoutJson = (layoutJson?: string | null): BuilderSerializableLayout => {
  if (!layoutJson) {
    return { components: [] };
  }

  try {
    const parsed = JSON.parse(layoutJson) as BuilderSerializableLayout;
    return Array.isArray(parsed.components) ? parsed : { components: [] };
  } catch {
    return { components: [] };
  }
};

const isSerializedComponent = (
  component: string | BuilderSerializedComponent
): component is BuilderSerializedComponent => typeof component !== 'string';

const renderSerializedComponent = (
  component: BuilderSerializedComponent,
  options: {
    mode: DynamicRendererMode;
    selectedComponentId?: string | null;
    onSelectComponent?: (componentId: string) => void;
  }
): React.ReactNode => {
  const isSelected = options.selectedComponentId === component.id;
  const renderChildren = (children: string[] | BuilderSerializedComponent[] | undefined) => {
    if (!Array.isArray(children) || children.length === 0) {
      return null;
    }

    const serializedChildren = (children as Array<string | BuilderSerializedComponent>).filter(
      isSerializedComponent
    );

    return serializedChildren.length
      ? serializedChildren.map((child) => renderSerializedComponent(child, options))
      : null;
  };

  const content = (
    <DynamicComponentRenderer
      component={component}
      mode={options.mode}
      isSelected={isSelected}
      renderChildren={renderChildren}
    />
  );

  if (options.mode !== 'editor') {
    return (
      <div key={component.id} className="space-y-4">
        {content}
      </div>
    );
  }

  return (
    <div key={component.id} className="space-y-4">
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => options.onSelectComponent?.(component.id)}
      >
        {content}
      </button>
    </div>
  );
};

const renderNormalizedComponent = (
  componentId: string,
  layout: BuilderPageLayout,
  options: {
    mode: DynamicRendererMode;
    selectedComponentId?: string | null;
    onSelectComponent?: (componentId: string) => void;
  }
): React.ReactNode => {
  const component = layout.nodes[componentId];
  if (!component) return null;

  const isSelected = options.selectedComponentId === component.id;
  const content = (
    <DynamicComponentRenderer
      component={component}
      mode={options.mode}
      isSelected={isSelected}
      renderChildren={(children) =>
        Array.isArray(children) && children.length > 0
          ? (children as string[]).map((childId) =>
              renderNormalizedComponent(childId, layout, options)
            )
          : null
      }
    />
  );

  if (options.mode !== 'editor') {
    return (
      <div key={component.id} className="space-y-4">
        {content}
      </div>
    );
  }

  return (
    <div key={component.id} className="space-y-4">
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => options.onSelectComponent?.(component.id)}
      >
        {content}
      </button>
    </div>
  );
};

export const DynamicLayoutRenderer = ({
  layoutJson,
  layout,
  mode = 'preview',
  selectedComponentId,
  onSelectComponent,
  className,
}: DynamicLayoutRendererProps) => {
  const options = {
    mode,
    selectedComponentId,
    onSelectComponent,
  } as const;

  const content = layout
    ? layout.rootIds.map((componentId) => renderNormalizedComponent(componentId, layout, options))
    : parseLayoutJson(layoutJson).components.map((component) =>
        renderSerializedComponent(component, options)
      );

  return <div className={className}>{content}</div>;
};

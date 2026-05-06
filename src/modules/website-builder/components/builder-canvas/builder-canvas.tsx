import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { useWebsiteBuilderStore } from '../../store/website-builder.store';
import type { BuilderComponentNode } from '../../types/builder-state.types';
import { DynamicComponentRenderer } from '../renderer/dynamic-component-renderer';

const SortableCanvasItem = ({
  component,
  pageId,
}: {
  component: BuilderComponentNode;
  pageId: string;
}) => {
  const selectedComponentId = useWebsiteBuilderStore((state) => state.selectedComponentId);
  const selectComponent = useWebsiteBuilderStore((state) => state.selectComponent);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: component.id,
    data: {
      source: 'canvas',
      pageId,
      componentId: component.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedComponentId === component.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border-2 border-dashed ${
        isSelected ? 'border-primary bg-primary/5' : 'border-transparent'
      } ${isDragging ? 'opacity-60' : 'opacity-100'}`}
    >
      <button
        type="button"
        className="block w-full cursor-pointer text-left"
        onClick={() => selectComponent(component.id)}
        {...attributes}
        {...listeners}
      >
        <DynamicComponentRenderer component={component} mode="editor" isSelected={isSelected} />
      </button>
    </div>
  );
};

export const BuilderCanvas = ({ pageId }: { pageId: string }) => {
  const page = useWebsiteBuilderStore((state) => state.pagesById[pageId]);
  const { setNodeRef, isOver } = useDroppable({
    id: `builder-canvas-dropzone-${pageId}`,
    data: {
      source: 'canvas-dropzone',
      pageId,
    },
  });

  if (!page) {
    return null;
  }

  const components = page.layout.rootIds
    .map((id) => page.layout.nodes[id])
    .filter((component): component is BuilderComponentNode => Boolean(component));

  return (
    <Card className="h-full min-h-[720px]">
      <CardHeader className="border-b">
        <CardTitle>Canvas</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-76px)]">
        <div
          ref={setNodeRef}
          className={`h-full rounded-2xl border border-dashed p-4 transition ${
            isOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
          }`}
        >
          <SortableContext items={page.layout.rootIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {components.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-xl border border-dashed bg-background text-center text-sm text-muted-foreground">
                  Drag Hero, Text, or Image from the sidebar and drop it here.
                </div>
              ) : null}
              {components.map((component) => (
                <SortableCanvasItem key={component.id} component={component} pageId={pageId} />
              ))}
            </div>
          </SortableContext>
        </div>
      </CardContent>
    </Card>
  );
};

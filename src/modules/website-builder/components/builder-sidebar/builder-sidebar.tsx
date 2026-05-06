import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { GripVertical, Image as ImageIcon, LayoutTemplate, Type } from 'lucide-react';

export type PaletteComponentType = 'hero' | 'text' | 'image';

type PaletteItem = {
  type: PaletteComponentType;
  label: string;
  description: string;
  icon: typeof LayoutTemplate;
};

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Big title block with subtitle and CTA.',
    icon: LayoutTemplate,
  },
  {
    type: 'text',
    label: 'Text',
    description: 'Simple copy block for body content.',
    icon: Type,
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Visual block with image URL and alt text.',
    icon: ImageIcon,
  },
];

const SidebarPaletteItem = ({ item }: { item: PaletteItem }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      source: 'palette',
      componentType: item.type,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const Icon = item.icon;

  return (
    <button
      ref={setNodeRef}
      style={style}
      className="flex w-full items-start gap-3 rounded-lg border border-border bg-background p-3 text-left transition hover:border-primary/40 hover:bg-accent/40"
      {...listeners}
      {...attributes}
      type="button"
    >
      <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground">{item.label}</span>
          <GripVertical
            className={`size-4 text-muted-foreground ${isDragging ? 'opacity-100' : 'opacity-60'}`}
          />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
      </div>
    </button>
  );
};

export const BuilderSidebar = () => {
  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <CardTitle>Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {PALETTE_ITEMS.map((item) => (
          <SidebarPaletteItem key={item.type} item={item} />
        ))}
      </CardContent>
    </Card>
  );
};

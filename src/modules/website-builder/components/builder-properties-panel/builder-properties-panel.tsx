import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-kit/card';
import { Input } from '@/components/ui-kit/input';
import { Label } from '@/components/ui-kit/label';
import { Textarea } from '@/components/ui-kit/textarea';
import { useWebsiteBuilderStore } from '../../store/website-builder.store';

export const BuilderPropertiesPanel = ({ pageId }: { pageId: string }) => {
  const page = useWebsiteBuilderStore((state) => state.pagesById[pageId]);
  const selectedComponentId = useWebsiteBuilderStore((state) => state.selectedComponentId);
  const updateComponentProps = useWebsiteBuilderStore((state) => state.updateComponentProps);

  const selectedNode =
    page && selectedComponentId ? page.layout.nodes[selectedComponentId] : undefined;

  const updateProp = (key: string, value: string) => {
    if (!selectedNode) return;
    updateComponentProps(pageId, selectedNode.id, { [key]: value });
  };

  const updateImageUrl = (value: string) => {
    if (!selectedNode) return;
    updateComponentProps(pageId, selectedNode.id, {
      imageUrl: value,
      src: value,
    });
  };

  const selectedImageUrl = selectedNode
    ? String(selectedNode.props.imageUrl || selectedNode.props.src || '')
    : '';

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <CardTitle>Properties</CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedNode ? (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Select a component on the canvas to edit its content.
          </div>
        ) : null}

        {selectedNode ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Type</p>
              <p className="mt-2 font-medium capitalize text-foreground">{selectedNode.type}</p>
            </div>

            {selectedNode.type === 'hero' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="hero-title">Title</Label>
                  <Input
                    id="hero-title"
                    value={String(selectedNode.props.title || '')}
                    onChange={(event) => updateProp('title', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-subtitle">Subtitle</Label>
                  <Textarea
                    id="hero-subtitle"
                    value={String(selectedNode.props.subtitle || '')}
                    onChange={(event) => updateProp('subtitle', event.target.value)}
                    height="120px"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-cta">CTA Text</Label>
                  <Input
                    id="hero-cta"
                    value={String(selectedNode.props.ctaText || '')}
                    onChange={(event) => updateProp('ctaText', event.target.value)}
                  />
                </div>
              </>
            ) : null}

            {selectedNode.type === 'text' ? (
              <div className="space-y-2">
                <Label htmlFor="text-copy">Text Content</Label>
                <Textarea
                  id="text-copy"
                  value={String(selectedNode.props.text || '')}
                  onChange={(event) => updateProp('text', event.target.value)}
                  height="180px"
                />
              </div>
            ) : null}

            {selectedNode.type === 'image' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="image-src">Image URL</Label>
                  <Input
                    id="image-src"
                    value={selectedImageUrl}
                    onChange={(event) => updateImageUrl(event.target.value)}
                  />
                </div>
                {selectedImageUrl ? (
                  <div className="overflow-hidden rounded-lg border bg-muted/20">
                    <img
                      src={selectedImageUrl}
                      alt={String(selectedNode.props.alt || 'Image preview')}
                      className="h-36 w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="image-alt">Alt Text</Label>
                  <Input
                    id="image-alt"
                    value={String(selectedNode.props.alt || '')}
                    onChange={(event) => updateProp('alt', event.target.value)}
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

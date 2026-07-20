import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Pencil, Download, Eye } from 'lucide-react';
import { setPendingEditorTemplate, type PendingEditorTemplate } from '@/lib/templateEditorSession';
import { downloadTemplate } from '@/services/templates/templateDownload';
import { toast } from '@/hooks/use-toast';
import type { TemplateRecord } from '@/services/templates/types';

// Shared preview dialog. Renders the Cloudinary preview image and offers a
// one-click switch into the Visual Editor by seeding the sessionStorage
// handoff, so the editor can instantiate the matching Fabric.js JSON.
export interface TemplatePreviewLike {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  platform?: string | null;
  objective?: string | null;
  preview_url?: string | null;
  thumbnail_url?: string | null;
  template_json?: unknown;
  metadata?: Record<string, unknown> | null;
  layout_dna?: Record<string, unknown> | null;
  ai_tags?: string[] | null;
  industry_tags?: string[] | null;
  brand_compatible?: boolean | null;
}

interface Props {
  template: TemplatePreviewLike | null;
  onOpenChange: (open: boolean) => void;
  source?: PendingEditorTemplate['source'];
  detailsHref?: string;
  extraActions?: ReactNode;
}

export const TemplatePreviewDialog = ({ template, onOpenChange, source = 'library', detailsHref, extraActions }: Props) => {
  const navigate = useNavigate();
  const previewSrc = template?.preview_url || template?.thumbnail_url || '';

  const openInEditor = () => {
    if (!template) return;
    setPendingEditorTemplate(template as unknown as TemplateRecord, source);
    toast({
      title: 'Template loaded into editor',
      description: 'Brand, AI, and copy placeholders will resolve on open.',
    });
    onOpenChange(false);
    navigate('/visual-editor');
  };

  const exportJson = () => {
    if (!template) return;
    downloadTemplate({
      id: template.id,
      name: template.name,
      description: template.description ?? undefined,
      category: template.category ?? undefined,
      platform: template.platform ?? undefined,
      objective: template.objective ?? undefined,
      template_json: (template.template_json as never) ?? null,
      metadata: template.metadata ?? {},
      layout_dna: template.layout_dna ?? template.metadata ?? {},
      ai_tags: template.ai_tags ?? undefined,
      industry_tags: template.industry_tags ?? undefined,
      brand_compatible: template.brand_compatible ?? undefined,
    });
    toast({ title: 'Template exported', description: 'Saved as .advista.json' });
  };

  return (
    <Dialog open={!!template} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template?.name}</DialogTitle>
          <DialogDescription>{template?.description ?? 'AdVista template preview'}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
            {previewSrc ? (
              <img src={previewSrc} alt={template?.name ?? ''} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <LayoutGrid className="h-10 w-10 text-primary/40" />
              </div>
            )}
          </div>

          <div className="space-y-3 text-sm">
            {template?.category && (
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium">{template.category}</p>
              </div>
            )}
            {template?.platform && (
              <div>
                <p className="text-muted-foreground">Platform</p>
                <Badge variant="secondary" className="mt-1">{template.platform}</Badge>
              </div>
            )}
            {template?.objective && (
              <div>
                <p className="text-muted-foreground">Goal</p>
                <p className="font-medium">{template.objective}</p>
              </div>
            )}
            {(template?.industry_tags?.length ?? 0) > 0 && (
              <div>
                <p className="text-muted-foreground">Industry</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {template!.industry_tags!.map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {extraActions}
          {detailsHref && (
            <Button variant="ghost" onClick={() => { onOpenChange(false); navigate(detailsHref); }}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </Button>
          )}
          <Button variant="outline" onClick={exportJson}>
            <Download className="mr-2 h-4 w-4" /> Export JSON
          </Button>
          <Button onClick={openInEditor} className="gap-2">
            <Pencil className="h-4 w-4" /> Open in Visual Editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

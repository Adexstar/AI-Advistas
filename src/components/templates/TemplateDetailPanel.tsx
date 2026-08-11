import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Download, Sparkles, Wand2, Layers, Palette, Type,
  Image as ImageIcon, Info, Heart, ChevronDown, ChevronRight,
  CheckCircle2, Send, Copy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import { downloadTemplate } from '@/services/templates/templateDownload';
import { setPendingEditorTemplate } from '@/lib/templateEditorSession';
import { toast } from '@/hooks/use-toast';
import type { AdTemplate } from '@/hooks/useTemplates';
import type { OriginalTemplate } from '@/hooks/useOriginalsSearch';

type AnyTemplate = (AdTemplate | OriginalTemplate) & { _source?: 'originals' | 'user' };

interface Props {
  template: AnyTemplate | null;
  isFavorite: boolean;
  onFavorite: () => void;
  onClose: () => void;
  onDuplicate: (t: AnyTemplate) => void;
  onAssign: (t: AnyTemplate) => void;
}

const VARIABLE_DOCS = [
  { key: 'brand.logo', label: 'Brand logo', owner: 'Brand' },
  { key: 'brand.primaryColor', label: 'Primary color', owner: 'Brand' },
  { key: 'brand.font', label: 'Brand font', owner: 'Brand' },
  { key: 'headline', label: 'Headline', owner: 'AI' },
  { key: 'subheadline', label: 'Subheadline', owner: 'AI' },
  { key: 'body', label: 'Body copy', owner: 'AI' },
  { key: 'cta', label: 'Call to action', owner: 'AI' },
  { key: 'offer', label: 'Offer / promo', owner: 'AI' },
  { key: 'website', label: 'Website', owner: 'User' },
  { key: 'product_image', label: 'Product image', owner: 'User' },
  { key: 'hero_image', label: 'Hero image', owner: 'User' },
];

const OWNER_STYLE: Record<string, string> = {
  Brand: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  AI: 'bg-primary/10 text-primary border-primary/20',
  User: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

function ExpandableSection({ title, icon: Icon, defaultOpen = false, children }: { title: string; icon: any; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/60 last:border-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-3 text-sm font-medium text-foreground">
        <span className="flex items-center gap-2">{Icon && <Icon className="h-4 w-4 text-muted-foreground" />}{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="pb-3 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function TemplateDetailPanel({ template, isFavorite, onFavorite, onClose, onDuplicate, onAssign }: Props) {
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState<'preview' | 'thumbnail'>('preview');

  if (!template) return null;

  const isOriginal = template._source === 'originals';
  const thumb = (template as any).thumbnail_url;
  const preview = (template as any).preview_url || thumb;
  const metadata = (template as OriginalTemplate).metadata || {};
  const emotion = metadata.emotion as string | undefined;
  const layoutStyle = metadata.layout_style as string | undefined;
  const layers = metadata.layers as number | undefined;
  const variables = metadata.variables as number | undefined;
  const brandCompatible = isOriginal ? (template as OriginalTemplate).brand_compatible : true;
  const aiTags = (template as OriginalTemplate).ai_tags || [];
  const industryTags = (template as OriginalTemplate).industry_tags || [];
  const platform = (template as AdTemplate).platforms?.[0] || (template as OriginalTemplate).platform || 'Facebook';

  const handleOpenEditor = () => {
    setPendingEditorTemplate(template as any, 'library');
    toast({ title: 'Template loaded into editor' });
    onClose();
    navigate('/visual-editor');
  };

  const handleExport = () => {
    const t = template as any;
    downloadTemplate({
      id: t.id, name: t.name, description: t.description, category: t.category,
      platform: platform, objective: (template as OriginalTemplate).objective || t.goal,
      template_json: t.template_json ?? null, metadata: metadata,
      layout_dna: t.layout_dna ?? metadata, ai_tags: aiTags,
      industry_tags: industryTags, brand_compatible: brandCompatible,
    });
    toast({ title: 'Template exported', description: 'Downloaded as .advista.json' });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="truncate text-base font-semibold">{template.name}</h2>
          {isOriginal && <Badge className="rounded-full bg-primary/10 text-primary text-[10px] border-0">Original</Badge>}
          {brandCompatible && <Badge className="rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] border-0 flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5" />Brand Ready</Badge>}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition"><X className="h-4 w-4" /></button>
      </div>

      <ScrollArea className="flex-1">
        {/* Preview */}
        <div className="aspect-[4/5] w-full overflow-hidden bg-muted">
          {activeImage === 'preview' && preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
              <ImageIcon className="h-12 w-12 text-primary/30" />
            </div>
          )}
        </div>
        {preview && thumb && preview !== thumb && (
          <div className="flex gap-2 px-4 py-2">
            <button onClick={() => setActiveImage('preview')} className={cn('text-xs font-medium px-2 py-1 rounded', activeImage === 'preview' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>Preview</button>
            <button onClick={() => setActiveImage('thumbnail')} className={cn('text-xs font-medium px-2 py-1 rounded', activeImage === 'thumbnail' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>Thumbnail</button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 px-4 py-3">
          <Button size="sm" className="rounded-xl gap-1.5" onClick={handleOpenEditor}>
            <Wand2 className="h-3.5 w-3.5" /> Use Template
          </Button>
          <button onClick={(e) => { e.stopPropagation(); onFavorite(); }} className="grid h-9 w-9 place-items-center rounded-xl border border-border hover:bg-muted transition">
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'}`} />
          </button>
          <button onClick={() => { onDuplicate(template); }} className="grid h-9 w-9 place-items-center rounded-xl border border-border hover:bg-muted transition">
            <Copy className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => { onAssign(template); onClose(); }} className="grid h-9 w-9 place-items-center rounded-xl border border-border hover:bg-muted transition">
            <Send className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={handleExport} className="grid h-9 w-9 place-items-center rounded-xl border border-border hover:bg-muted transition">
            <Download className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          <Badge variant="secondary" className="rounded-full text-[10px]">{platform}</Badge>
          {template.category && <Badge variant="secondary" className="rounded-full text-[10px]">{template.category}</Badge>}
          {emotion && <Badge variant="secondary" className="rounded-full text-[10px]">{emotion}</Badge>}
          {layoutStyle && <Badge variant="secondary" className="rounded-full text-[10px]">{layoutStyle}</Badge>}
          {(template as OriginalTemplate).objective && <Badge variant="secondary" className="rounded-full text-[10px]">{(template as OriginalTemplate).objective}</Badge>}
        </div>

        <Separator />

        <div className="h-8" />
      </ScrollArea>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function RowCheck({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {checked ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-muted-foreground/50" />}
    </div>
  );
}



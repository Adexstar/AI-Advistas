import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Image as ImageIcon,
  Palette as PaletteIcon,
  Type,
  Layers,
  Plus,
  Upload,
  MoreVertical,
  Copy,
  Trash2,
  Pencil,
  Building2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  useBrandKits,
  useCreateBrandKit,
  useUpdateBrandKit,
  useDeleteBrandKit,
  useBrandColors,
  useAddBrandColor,
  useDeleteBrandColor,
  useBrandFonts,
  useAddBrandFont,
  useBrandAssets,
  useUploadBrandFile,
  computeBrandScore,
  type BrandKit,
} from '@/hooks/useBrandKit';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const INDUSTRIES = ['Marketing & Advertising', 'Technology', 'E-commerce', 'Real Estate', 'Restaurant', 'Fitness', 'Fashion', 'Education', 'Finance', 'Healthcare'];
const FONT_PRESETS = ['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Playfair Display', 'DM Sans', 'Space Grotesk', 'Manrope'];

const KpiCard = ({ icon: Icon, label, value, suffix }: any) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold leading-tight text-foreground">{value}</p>
        {suffix && <p className="text-[11px] text-muted-foreground">{suffix}</p>}
      </div>
    </div>
  </Card>
);

const CreateBrandDialog = ({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing?: BrandKit | null;
}) => {
  const create = useCreateBrandKit();
  const update = useUpdateBrandKit();
  const upload = useUploadBrandFile();
  const [form, setForm] = useState({
    name: '',
    industry: '',
    website: '',
    description: '',
    primary_color: '#6C63FF',
    secondary_color: '#4B46E5',
    accent_color: '#10B981',
    logo_url: '',
    cover_image_url: '',
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        industry: existing.industry || '',
        website: existing.website || '',
        description: existing.description || '',
        primary_color: existing.primary_color,
        secondary_color: existing.secondary_color,
        accent_color: existing.accent_color,
        logo_url: existing.logo_url || '',
        cover_image_url: existing.cover_image_url || '',
      });
    } else if (open) {
      setForm({ name: '', industry: '', website: '', description: '', primary_color: '#6C63FF', secondary_color: '#4B46E5', accent_color: '#10B981', logo_url: '', cover_image_url: '' });
    }
  }, [existing, open]);

  const handleUpload = async (file: File, field: 'logo_url' | 'cover_image_url') => {
    const r = await upload.mutateAsync({ file, prefix: field });
    setForm((f) => ({ ...f, [field]: r.url }));
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    if (existing) {
      await update.mutateAsync({ id: existing.id, updates: form });
    } else {
      await create.mutateAsync(form);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Brand Kit' : 'Create Brand Kit'}</DialogTitle>
          <DialogDescription>Define your brand identity to apply across campaigns, templates and ads.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Brand Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="AdVista Agency" />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
              <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://advista.com" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Brand Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A modern, trustworthy advertising studio…" />
          </div>
          {(['primary_color', 'secondary_color', 'accent_color'] as const).map((k) => (
            <div className="space-y-2" key={k}>
              <Label className="capitalize">{k.replace('_', ' ')}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent" />
                <Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            </div>
          ))}
          <div className="space-y-2">
            <Label>Logo</Label>
            <label className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50">
              {form.logo_url ? (
                <img src={form.logo_url} alt="logo" className="max-h-20 object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground"><Upload className="mx-auto mb-1 h-4 w-4" />Upload Logo</span>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo_url')} />
            </label>
          </div>
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <label className="flex h-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50">
              {form.cover_image_url ? (
                <img src={form.cover_image_url} alt="cover" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground"><Upload className="mx-auto mb-1 h-4 w-4" />Upload Cover</span>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'cover_image_url')} />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.name.trim() || create.isPending || update.isPending}>
            {existing ? 'Save Changes' : 'Create Brand Kit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const LogoCard = ({ url, label, onReplace }: { url?: string | null; label: string; onReplace: (f: File) => void }) => (
  <Card className="overflow-hidden">
    <div className="relative grid h-40 place-items-center bg-[conic-gradient(at_top_left,_#f8fafc_25%,_#eef2f7_0_50%,_#f8fafc_0_75%,_#eef2f7_0)] bg-[length:18px_18px]">
      {url ? <img src={url} alt={label} className="max-h-28 max-w-[80%] object-contain" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
    </div>
    <div className="flex items-center justify-between p-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">PNG · 512 × 512</p>
      </div>
      <label className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted">
        <MoreVertical className="h-4 w-4" />
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onReplace(e.target.files[0])} />
      </label>
    </div>
  </Card>
);

const ColorSwatch = ({ hex, label, onCopy, onDelete }: any) => (
  <div className="group relative">
    <div className="h-32 rounded-xl shadow-sm ring-1 ring-border" style={{ background: hex }} />
    <div className="mt-2">
      <p className="text-sm font-semibold text-foreground">{hex.toUpperCase()}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
      <button onClick={onCopy} className="grid h-7 w-7 place-items-center rounded-md bg-background/90 text-foreground shadow"><Copy className="h-3.5 w-3.5" /></button>
      {onDelete && <button onClick={onDelete} className="grid h-7 w-7 place-items-center rounded-md bg-background/90 text-destructive shadow"><Trash2 className="h-3.5 w-3.5" /></button>}
    </div>
  </div>
);

const BrandPreview = ({ brand }: { brand: BrandKit }) => (
  <Card className="overflow-hidden">
    <div className="p-4">
      <p className="text-sm font-semibold">Brand Preview</p>
      <p className="text-xs text-muted-foreground">See how your brand looks in action</p>
    </div>
    <div className="px-4">
      <Select defaultValue="ig">
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ig">Instagram Post</SelectItem>
          <SelectItem value="fb">Facebook Ad</SelectItem>
          <SelectItem value="ba">Banner</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="p-4">
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-xl p-5 text-white"
        style={{ background: `linear-gradient(135deg, ${brand.primary_color} 0%, ${brand.secondary_color} 100%)` }}
      >
        <div className="flex items-center gap-2">
          {brand.logo_url ? <img src={brand.logo_url} alt="" className="h-6 w-6 rounded" /> : <Sparkles className="h-5 w-5" />}
          <span className="text-sm font-semibold">{brand.name}</span>
        </div>
        <h3 className="mt-6 text-3xl font-extrabold leading-tight">
          Boost Your<br />Business<br />With <span style={{ color: brand.accent_color }}>Smart Ads</span>
        </h3>
        <p className="mt-3 text-xs opacity-80">Create, manage and optimize ad campaigns that drive results.</p>
        <Button size="sm" className="mt-4" style={{ background: brand.accent_color }}>Get Started</Button>
        <p className="absolute bottom-3 left-5 text-[10px] opacity-70">{brand.website || 'www.advista.com'}</p>
      </div>
      <div className="mt-3 flex justify-center gap-1">
        {[0, 1, 2, 3].map((i) => <span key={i} className={cn('h-1 w-6 rounded-full', i === 0 ? 'bg-foreground' : 'bg-muted')} />)}
      </div>
    </div>
  </Card>
);

const BrandWorkspace = ({ brand, allKits, onSelect, onEdit }: { brand: BrandKit; allKits: BrandKit[]; onSelect: (id: string) => void; onEdit: () => void }) => {
  const { toast } = useToast();
  const { data: colors = [] } = useBrandColors(brand.id);
  const { data: fonts = [] } = useBrandFonts(brand.id);
  const { data: assets = [] } = useBrandAssets(brand.id);
  const addColor = useAddBrandColor();
  const delColor = useDeleteBrandColor();
  const addFont = useAddBrandFont();
  const upload = useUploadBrandFile();
  const updateKit = useUpdateBrandKit();

  const score = useMemo(
    () =>
      computeBrandScore({
        logo_url: brand.logo_url,
        cover_image_url: brand.cover_image_url,
        description: brand.description,
        industry: brand.industry,
        colors: colors.length || 3,
        fonts: fonts.length,
        assets: assets.length,
      }),
    [brand, colors.length, fonts.length, assets.length]
  );

  const baseColors = useMemo(
    () =>
      colors.length > 0
        ? colors.map((c) => ({ id: c.id, hex: c.hex, label: c.name || 'Color' }))
        : [
            { id: 'p', hex: brand.primary_color, label: 'Primary' },
            { id: 's', hex: brand.secondary_color, label: 'Secondary' },
            { id: 'a', hex: brand.accent_color, label: 'Accent' },
          ],
    [colors, brand]
  );

  const copyHex = (hex: string) => { navigator.clipboard.writeText(hex); toast({ title: `Copied ${hex}` }); };

  const handleLogoUpload = async (file: File) => {
    const r = await upload.mutateAsync({ file, prefix: 'logos' });
    await updateKit.mutateAsync({ id: brand.id, updates: { logo_url: r.url } });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard icon={ImageIcon} label="Logos" value={brand.logo_url ? 4 : 0} suffix="Uploaded" />
          <KpiCard icon={PaletteIcon} label="Colors" value={baseColors.length} suffix="Saved" />
          <KpiCard icon={Type} label="Fonts" value={fonts.length || 3} suffix="Saved" />
          <KpiCard icon={Layers} label="Assets" value={assets.length} suffix="Files" />
        </div>

        {/* Logos */}
        <Card className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold">Logos</h3>
              <p className="text-xs text-muted-foreground">Manage your logo variations</p>
            </div>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild><span><Upload className="mr-2 h-4 w-4" />Upload Logo</span></Button>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <LogoCard url={brand.logo_url} label="Logo Primary" onReplace={handleLogoUpload} />
            <LogoCard url={brand.logo_url} label="Logo Dark" onReplace={handleLogoUpload} />
            <LogoCard url={brand.logo_url} label="Icon Logo" onReplace={handleLogoUpload} />
            <LogoCard url={brand.logo_url} label="Favicon" onReplace={handleLogoUpload} />
          </div>
        </Card>

        {/* Brand Colors */}
        <Card className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold">Brand Colors</h3>
              <p className="text-xs text-muted-foreground">Your saved brand color palette</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const hex = prompt('Enter HEX color', '#7C3AED');
                if (hex) addColor.mutate({ brand_id: brand.id, hex, name: 'Custom' });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />Add Color
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {baseColors.map((c) => (
              <ColorSwatch
                key={c.id}
                hex={c.hex}
                label={c.label}
                onCopy={() => copyHex(c.hex)}
                onDelete={colors.find((x) => x.id === c.id) ? () => delColor.mutate({ id: c.id, brand_id: brand.id }) : null}
              />
            ))}
            <button
              onClick={() => {
                const hex = prompt('Enter HEX color', '#22D3EE');
                if (hex) addColor.mutate({ brand_id: brand.id, hex, name: 'Custom' });
              }}
              className="grid h-32 place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground hover:bg-muted/40"
            >
              <span className="flex flex-col items-center gap-1 text-xs"><Plus className="h-5 w-5" />Add New Color</span>
            </button>
          </div>
        </Card>

        {/* Typography + Guidelines */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Typography</h3>
                <p className="text-xs text-muted-foreground">Manage your brand fonts</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const name = prompt('Font family (Google Font)', 'Inter');
                  const role = prompt('Role (Heading/Body/CTA)', 'Heading');
                  if (name && role) addFont.mutate({ brand_id: brand.id, name, role });
                }}
              >
                <Upload className="mr-2 h-4 w-4" />Upload Font
              </Button>
            </div>
            <div className="space-y-2">
              {(fonts.length > 0
                ? fonts
                : [
                    { id: '1', name: 'Inter Bold', role: 'Primary' },
                    { id: '2', name: 'Inter Regular', role: 'Secondary' },
                    { id: '3', name: 'Inter SemiBold', role: 'Accent' },
                  ]
              ).map((f: any) => (
                <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-muted text-sm font-bold">Aa</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{f.name}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-md">{f.role}</Badge>
                  <button className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Brand Guidelines</h3>
                <p className="text-xs text-muted-foreground">Define how your brand communicates</p>
              </div>
              <Button variant="outline" size="sm" onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
            </div>
            <div className="space-y-4 text-sm">
              {[
                { label: 'Tone of Voice', value: 'Professional, Clear, Confident' },
                { label: 'Industry', value: brand.industry || 'Marketing & Advertising' },
                { label: 'Brand Style', value: 'Modern, Clean, Minimal' },
                { label: 'Target Audience', value: 'Small Business Owners, Marketers' },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{row.label}</p>
                    <p className="text-sm text-foreground">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Brand Score */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Brand Score</h3>
              <p className="text-xs text-muted-foreground">Consistency across logos, colors, fonts, assets and completion.</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-primary">{score}</p>
              <p className="text-[11px] text-muted-foreground">/ 100</p>
            </div>
          </div>
          <Progress value={score} className="mt-3 h-2" />
        </Card>
      </div>

      {/* Right rail */}
      <div className="space-y-4">
        <BrandPreview brand={brand} />

        <Card>
          <div className="flex items-center justify-between p-4">
            <p className="text-sm font-semibold">Brand Kits</p>
            <Button variant="ghost" size="sm" onClick={onEdit}>Manage</Button>
          </div>
          <div className="space-y-1 px-2 pb-3">
            {allKits.map((k) => {
              const active = k.id === brand.id;
              return (
                <button
                  key={k.id}
                  onClick={() => onSelect(k.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg p-2 text-left transition',
                    active ? 'border border-primary/30 bg-primary/5' : 'hover:bg-muted'
                  )}
                >
                  <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-md bg-muted">
                    {k.logo_url ? <img src={k.logo_url} alt="" className="h-full w-full object-contain" /> : <Building2 className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{k.name}</p>
                    <p className="text-[11px] text-muted-foreground">{active ? '● Active' : `Updated ${new Date(k.updated_at).toLocaleDateString()}`}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
          <div className="p-3 pt-0">
            <Button variant="outline" className="w-full" onClick={onEdit}>
              <Plus className="mr-2 h-4 w-4" />Create New Brand Kit
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default function BrandKitPage() {
  const { data: kits = [], isLoading } = useBrandKits();
  const del = useDeleteBrandKit();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; editing: BrandKit | null }>({ open: false, editing: null });

  useEffect(() => {
    if (!activeId && kits.length > 0) setActiveId(kits[0].id);
  }, [kits, activeId]);

  const active = kits.find((k) => k.id === activeId) || kits[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Brand Kit</h1>
          <p className="text-sm text-muted-foreground">Manage your logos, colors, fonts, and brand assets.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {kits.length > 0 && (
            <Select value={active?.id} onValueChange={setActiveId}>
              <SelectTrigger className="h-10 w-[220px]">
                <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kits.map((k) => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => setDialog({ open: true, editing: null })}>
            <Plus className="mr-2 h-4 w-4" />New Brand Kit
          </Button>
          {active && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDialog({ open: true, editing: active })}>
                  <Pencil className="mr-2 h-4 w-4" />Edit Brand
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => del.mutate(active.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />Delete Brand
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
            <Skeleton className="h-72" />
            <Skeleton className="h-56" />
          </div>
          <Skeleton className="h-[600px]" />
        </div>
      ) : kits.length === 0 ? (
        <Card className="grid place-items-center gap-3 p-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><PaletteIcon className="h-6 w-6" /></div>
          <h3 className="text-xl font-bold">No Brand Kits Yet</h3>
          <p className="max-w-md text-sm text-muted-foreground">Create a brand kit to manage your logos, colors and fonts across every campaign.</p>
          <div className="mt-2 flex gap-2">
            <Button onClick={() => setDialog({ open: true, editing: null })}><Plus className="mr-2 h-4 w-4" />Create Brand Kit</Button>
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Import Brand Assets</Button>
          </div>
        </Card>
      ) : active ? (
        <BrandWorkspace
          brand={active}
          allKits={kits}
          onSelect={setActiveId}
          onEdit={() => setDialog({ open: true, editing: active })}
        />
      ) : null}

      <CreateBrandDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog({ open: v, editing: v ? dialog.editing : null })}
        existing={dialog.editing}
      />
    </div>
  );
}

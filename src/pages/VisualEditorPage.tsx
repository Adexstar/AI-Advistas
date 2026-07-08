import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { VisualEditorProvider } from '@/contexts/VisualEditorContext';
import { Canvas as FabricCanvas, Rect, Circle as FCircle, Textbox } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Megaphone, Plus, LayoutTemplate, PenTool, Palette, ImageIcon,
  BarChart3, Zap, Plug, Download, Bell, Users, Settings, CreditCard,
  Sparkles, ChevronDown, Edit3, Undo2, Redo2, Play, Send, MoreHorizontal, Maximize2,
  Menu, PanelRight, Search, Type as TypeIcon, Square as SquareIcon, Circle as CircleIcon,
  Triangle, Star, Wand2, Scissors, Image as ImgIcon, Sparkle, ChevronRight,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Layers as LayersIcon,
  Copy, Trash2, Lock, Eye, MousePointer, Check, Minus, X, Sun,
} from 'lucide-react';
import { AIActionsMenu } from '@/components/visual-editor/ai/AIActionsMenu';
import { DesignScorePanel, computeScores } from '@/components/visual-editor/DesignScorePanel';
import { AISuggestionsList } from '@/components/visual-editor/AISuggestionsList';
import { EmptyCanvasAIStart } from '@/components/visual-editor/EmptyCanvasAIStart';

/* ==================== Main App Sidebar (mirrors DashboardLayout) ==================== */
type NavItem = { name: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: string; notify?: number };
const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: 'Main', items: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
    { name: 'Create Ad', href: '/create', icon: Plus },
    { name: 'Templates', href: '/template-library', icon: LayoutTemplate },
    { name: 'Visual Editor', href: '/visual-editor', icon: PenTool },
    { name: 'Brand Kit', href: '/brand-kit', icon: Palette },
    { name: 'Media Library', href: '/media-library', icon: ImageIcon },
    { name: 'Analytics & Reports', href: '/analytics', icon: BarChart3 },
  ]},
  { title: 'Operations', items: [
    { name: 'Automation Center', href: '/automation', icon: Zap, notify: 3 },
    { name: 'Integrations Hub', href: '/integrations', icon: Plug, badge: 'Soon' },
    { name: 'Export Center', href: '/exports', icon: Download, badge: 'Soon' },
    { name: 'Notifications', href: '/notifications', icon: Bell, notify: 2 },
  ]},
  { title: 'Account', items: [
    { name: 'Team Workspace', href: '/team', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Billing', href: '/billing', icon: CreditCard },
  ]},
];

const AppSidebar: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-[240px] shrink-0 flex-col border-r border-white/10 bg-[hsl(240_15%_8%)] text-white">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-[hsl(243_82%_62%)] shadow-lg">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">AdVista</span>
      </div>
      <div className="px-4 pt-4">
        <Button asChild className="h-11 w-full justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-[hsl(243_82%_62%)] text-sm font-semibold shadow-lg hover:opacity-90">
          <NavLink to="/create"><Plus className="h-4 w-4" /> Create Ad</NavLink>
        </Button>
      </div>
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-5">
        {NAV_GROUPS.map((group, idx) => (
          <div key={group.title} className={cn('space-y-0.5', idx > 0 && 'border-t border-white/10 pt-4')}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{group.title}</p>
            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all',
                    active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="h-[16px] w-[16px] shrink-0" />
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.notify ? (
                    <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary/40 px-1 text-[9px] font-bold">{item.notify}</span>
                  ) : item.badge ? (
                    <Badge className="h-4 rounded-full bg-white/10 px-1.5 text-[9px] font-semibold text-white/60 hover:bg-white/10">{item.badge}</Badge>
                  ) : null}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold">JD</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">John Doe <Badge className="ml-1 h-3.5 rounded bg-primary/30 px-1 text-[8px] font-bold">Pro Plan</Badge></p>
            <p className="truncate text-[10px] text-white/50">AdVista Agency</p>
          </div>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-white/60">
            <span>Monthly Usage</span><span>73%</span>
          </div>
          <div className="mb-2 h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-[73%] bg-primary" />
          </div>
          <Button asChild size="sm" className="h-8 w-full rounded-lg bg-white text-primary hover:bg-white/90 text-[11px] font-semibold">
            <NavLink to="/billing">Upgrade Plan</NavLink>
          </Button>
        </div>
      </div>
    </aside>
  );
};

/* ==================== Workspace Bar (chips + actions) ==================== */
const Chip: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <button className="flex items-center gap-2 rounded-xl border bg-card px-3 py-1.5 hover:bg-muted/50 transition">
    <div className="text-left">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="flex items-center gap-1 text-[12px] font-semibold text-foreground">
        {icon}{value}
      </p>
    </div>
    <ChevronDown className="h-3 w-3 text-muted-foreground" />
  </button>
);

const WorkspaceBar: React.FC<{ onExport: () => void; onToggleLeft: () => void; onToggleRight: () => void }> = ({ onExport, onToggleLeft, onToggleRight }) => (
  <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card px-3 lg:px-5">
    <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={onToggleLeft}><Menu className="h-4 w-4" /></Button>
    <Button variant="ghost" size="icon" className="hidden lg:inline-flex h-9 w-9"><Menu className="h-4 w-4" /></Button>
    <div className="hidden md:flex items-center gap-2">
      <Chip label="Workspace" value="AdVista Agency" icon={<Sparkles className="h-3 w-3 text-primary" />} />
      <Chip label="Category" value="Beauty" />
      <Chip label="Goal" value="Conversions" />
      <Chip label="Mode" value="Assisted" icon={<Sparkles className="h-3 w-3 text-primary" />} />
    </div>
    <div className="ml-2 hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-600">
      <Sparkles className="h-3 w-3" /> AI Ready <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
    </div>
    <div className="flex-1" />
    <div className="hidden md:flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-9 w-9"><Undo2 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-9 w-9"><Redo2 className="h-4 w-4" /></Button>
    </div>
    <Button variant="outline" size="sm" className="h-9 gap-1.5 hidden md:inline-flex"><Maximize2 className="h-3.5 w-3.5" /> Resize</Button>
    <Button variant="outline" size="sm" className="h-9 gap-1.5 hidden sm:inline-flex"><Play className="h-3.5 w-3.5" /> Preview</Button>
    <Button size="sm" className="h-9 gap-1.5 bg-primary hover:bg-primary/90" onClick={onExport}>
      <Download className="h-3.5 w-3.5" /> Download <ChevronDown className="h-3 w-3 opacity-70" />
    </Button>
    <Button size="sm" className="h-9 gap-1.5 bg-primary hover:bg-primary/90 hidden sm:inline-flex"><Plus className="h-3.5 w-3.5" /> Publish</Button>
    <Button variant="ghost" size="icon" className="h-9 w-9 hidden md:inline-flex"><MoreHorizontal className="h-4 w-4" /></Button>
    <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={onToggleRight}><PanelRight className="h-4 w-4" /></Button>
  </header>
);

/* ==================== Elements / Uploads Sidebar ==================== */
const ElementsUploadsSidebar: React.FC<{
  onAddText: (text: string, size: number, weight: string) => void;
  onAddShape: (t: 'rectangle' | 'circle' | 'triangle' | 'star') => void;
}> = ({ onAddText, onAddShape }) => {
  const [tab, setTab] = useState<'elements' | 'uploads'>('elements');
  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      {/* Tabs */}
      <div className="flex items-center gap-0 border-b px-4">
        {(['elements', 'uploads'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'relative py-3.5 px-4 text-[13px] font-semibold capitalize transition-colors',
              tab === t ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {tab === 'elements' ? (
          <div className="p-4 space-y-5">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search elements..." className="pl-8 h-9 rounded-xl bg-muted/60 border-transparent text-xs" />
            </div>

            {/* Element type grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Text', icon: TypeIcon, onClick: () => onAddText('Add heading', 32, 'bold') },
                { label: 'Image', icon: ImageIcon, onClick: () => toast({ title: 'Choose an image' }) },
                { label: 'Shapes', icon: SquareIcon, onClick: () => onAddShape('rectangle') },
                { label: 'Icons', icon: Star, onClick: () => onAddShape('star') },
              ].map(({ label, icon: Icon, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="flex flex-col items-center gap-1.5 rounded-xl border bg-background py-3 hover:bg-muted/60 hover:border-primary/40 transition"
                >
                  <Icon className="h-5 w-5 text-foreground" />
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* Quick Add */}
            <section>
              <p className="mb-2 text-xs font-semibold">Quick Add</p>
              <div className="space-y-2">
                {[
                  { l: 'Headline', d: 'Add a title', s: 32, w: 'bold', icon: TypeIcon },
                  { l: 'Subheadline', d: 'Add a subtitle', s: 20, w: '600', icon: TypeIcon },
                  { l: 'Body Text', d: 'Add paragraph text', s: 14, w: 'normal', icon: TypeIcon },
                  { l: 'Button', d: 'Add CTA button', s: 14, w: '600', icon: SquareIcon },
                ].map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.l}
                      onClick={() => onAddText(p.l, p.s, p.w)}
                      className="flex w-full items-center gap-3 rounded-xl border bg-background px-3 py-2.5 text-left hover:bg-muted/60 hover:border-primary/40 transition"
                    >
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted"><Icon className="h-3.5 w-3.5" /></div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold leading-tight">{p.l}</p>
                        <p className="text-[10px] text-muted-foreground">{p.d}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Brand Kit */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">Brand Kit</p>
                <button className="text-[11px] font-medium text-primary hover:underline">View all</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Logos', value: 12, icon: ImageIcon, tint: 'bg-fuchsia-500/10 text-fuchsia-600' },
                  { label: 'Colors', value: 18, icon: Palette, tint: 'bg-amber-500/10 text-amber-600' },
                  { label: 'Fonts', value: 6, icon: TypeIcon, tint: 'bg-sky-500/10 text-sky-600' },
                ].map((k) => {
                  const Icon = k.icon;
                  return (
                    <div key={k.label} className="rounded-xl border bg-background px-2 py-2.5 text-center">
                      <div className={cn('mx-auto mb-1 grid h-7 w-7 place-items-center rounded-lg', k.tint)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-[11px] font-semibold text-foreground">{k.label}</p>
                      <p className="text-[15px] font-bold text-foreground leading-none">{k.value}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Shapes */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">Shapes</p>
                <button className="text-[11px] font-medium text-primary hover:underline">See all</button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[SquareIcon, CircleIcon, Triangle, Star, CircleIcon].map((Icon, i) => (
                  <button
                    key={i}
                    onClick={() => onAddShape(i === 1 ? 'circle' : i === 2 ? 'triangle' : i === 3 ? 'star' : 'rectangle')}
                    className="aspect-square grid place-items-center rounded-xl border bg-background hover:bg-muted/60 hover:border-primary/40 transition"
                  >
                    <Icon className="h-5 w-5 text-foreground" />
                  </button>
                ))}
              </div>
            </section>

            {/* Graphics */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">Graphics</p>
                <button className="text-[11px] font-medium text-primary hover:underline">See all</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  'from-fuchsia-400 to-purple-500',
                  'from-rose-300 to-orange-400',
                  'from-cyan-400 to-blue-500',
                  'from-emerald-400 to-teal-500',
                ].map((bg, i) => (
                  <button key={i} className={cn('aspect-square rounded-xl border bg-gradient-to-br opacity-90 hover:opacity-100 transition', bg)} />
                ))}
              </div>
            </section>

            {/* AI Tools */}
            <section>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-xs font-semibold">AI Tools</p>
                <Badge variant="secondary" className="h-4 rounded px-1.5 text-[9px] font-bold uppercase tracking-wider bg-accent/20 text-accent-foreground">Beta</Badge>
              </div>
              <div className="space-y-1.5">
                {[
                  { l: 'Generate Image', d: 'Create with AI', icon: ImgIcon },
                  { l: 'Remove Background', d: 'Instant background remover', icon: Scissors },
                  { l: 'Magic Resize', d: 'Resize for all platforms', icon: Maximize2 },
                  { l: 'Text to Image', d: 'Generate from text prompt', icon: Sparkle },
                ].map((a) => {
                  const Icon = a.icon;
                  return (
                    <button key={a.l} className="flex w-full items-center gap-2.5 rounded-xl border bg-background px-3 py-2.5 text-left hover:bg-muted/60 hover:border-primary/40 transition">
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-3.5 w-3.5" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold leading-tight">{a.l}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{a.d}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <button className="w-full rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-primary/40 hover:bg-muted/40 transition">
              <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-semibold">Upload files</p>
              <p className="text-[11px] text-muted-foreground mt-1">Drag & drop or click to browse</p>
            </button>
            <p className="text-[11px] text-muted-foreground text-center">Your uploads appear here.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

/* ==================== Formatting Toolbar ==================== */
const FormattingToolbar: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const update = (prop: string, val: any) => {
    if (!selected || !canvas) return;
    selected.set(prop, val);
    canvas.renderAll();
  };
  return (
    <div className="flex h-12 shrink-0 items-center gap-1 border-b bg-card px-3 overflow-x-auto">
      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs"><AlignLeft className="h-3.5 w-3.5" /><ChevronDown className="h-3 w-3" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8"><AlignCenter className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8"><LayersIcon className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8"><TypeIcon className="h-4 w-4" /></Button>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <Select value={selected?.fontFamily || 'Montserrat'} onValueChange={(v) => update('fontFamily', v)}>
        <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {['Montserrat', 'Poppins', 'Inter', 'Roboto', 'Playfair Display', 'Bebas Neue'].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={String(Math.round(selected?.fontSize || 48))} onValueChange={(v) => update('fontSize', parseInt(v))}>
        <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {[12, 14, 16, 20, 24, 32, 40, 48, 56, 72, 96].map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon" className={cn('h-8 w-8', selected?.fontWeight === 'bold' && 'bg-muted')} onClick={() => update('fontWeight', selected?.fontWeight === 'bold' ? 'normal' : 'bold')}><Bold className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className={cn('h-8 w-8', selected?.fontStyle === 'italic' && 'bg-muted')} onClick={() => update('fontStyle', selected?.fontStyle === 'italic' ? 'normal' : 'italic')}><Italic className="h-4 w-4" /></Button>
      <input
        type="color"
        value={selected?.fill || '#1a1145'}
        onChange={(e) => update('fill', e.target.value)}
        className="h-7 w-7 rounded border cursor-pointer"
      />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <Button variant="ghost" size="icon" className="h-8 w-8"><AlignLeft className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8"><AlignRight className="h-4 w-4" /></Button>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">Effects</Button>
      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs"><Play className="h-3 w-3" /> Animate</Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto"><MoreHorizontal className="h-4 w-4" /></Button>
    </div>
  );
};

/* ==================== Project Title Row (above canvas) ==================== */
const ProjectTitleRow: React.FC<{ name: string; setName: (s: string) => void; zoom: number; setZoom: (n: number) => void }> = ({ name, setName, zoom, setZoom }) => {
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b bg-card px-4">
      {editing ? (
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={(e) => e.key === 'Enter' && setEditing(false)} className="h-7 w-56 text-sm font-semibold" />
      ) : (
        <button onClick={() => setEditing(true)} className="group flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 hover:bg-muted/60">
          <span className="text-sm font-semibold">{name}</span>
          <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
        </button>
      )}
      <span className="text-[11px] text-muted-foreground">Saved a few seconds ago</span>
      <div className="flex-1" />
      <span className="hidden md:inline text-[11px] text-muted-foreground">1080 × 1350</span>
      <div className="flex items-center gap-1 rounded-lg border bg-background px-1.5 py-0.5">
        <Sun className="h-3 w-3 text-muted-foreground" />
        <button onClick={() => setZoom(Math.max(25, zoom - 10))} className="p-0.5"><Minus className="h-3 w-3" /></button>
        <span className="min-w-[38px] text-center text-[11px] font-semibold">{zoom}%</span>
        <button onClick={() => setZoom(Math.min(400, zoom + 10))} className="p-0.5"><Plus className="h-3 w-3" /></button>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </div>
    </div>
  );
};

/* ==================== Canvas Stage ==================== */
const CanvasStage: React.FC<{
  onCanvasReady: (c: FabricCanvas) => void;
  onSelection: (o: any) => void;
  zoom: number;
}> = ({ onCanvasReady, onSelection, zoom }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !ref.current) return;
    initialized.current = true;
    const c = new FabricCanvas(ref.current, {
      width: 560,
      height: 700,
      backgroundColor: '#fbe6dc',
    });
    // Seed with mockup-like Summer Glow Serum ad elements
    c.add(new Textbox('GLOW NATURALLY', { left: 40, top: 40, fontSize: 14, fontWeight: 'bold', fill: '#a8365a', fontFamily: 'Montserrat', width: 300, charSpacing: 200 }));
    c.add(new Textbox('Reveal Your', { left: 40, top: 80, fontSize: 48, fontWeight: 'bold', fill: '#1a1145', fontFamily: 'Playfair Display', width: 400 }));
    c.add(new Textbox('Natural Glow', { left: 40, top: 140, fontSize: 56, fontWeight: 'bold', fill: '#a8365a', fontFamily: 'Playfair Display', fontStyle: 'italic', width: 400 }));
    c.add(new Textbox('Our Summer Glow Serum\nhydrates, nourishes, and brings\nout your skin\'s natural radiance.', { left: 40, top: 240, fontSize: 14, fill: '#3d2e5a', fontFamily: 'Montserrat', width: 340, lineHeight: 1.5 }));
    c.add(new Rect({ left: 40, top: 500, width: 200, height: 46, fill: '#8b3a5a', rx: 4, ry: 4 }));
    c.add(new Textbox('SHOP NOW  →', { left: 70, top: 512, fontSize: 14, fontWeight: 'bold', fill: '#ffffff', fontFamily: 'Montserrat', width: 160 }));
    c.on('selection:created', (e: any) => onSelection(e.selected?.[0]));
    c.on('selection:updated', (e: any) => onSelection(e.selected?.[0]));
    c.on('selection:cleared', () => onSelection(null));
    onCanvasReady(c);
  }, [onCanvasReady, onSelection]);

  return (
    <div className="flex-1 overflow-auto bg-[hsl(248,48%,97%)]">
      <div className="min-h-full flex items-center justify-center p-8">
        <div
          className="relative rounded-lg bg-white shadow-[0_20px_60px_-15px_rgba(72,52,212,0.25)] border-2 border-primary/40"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
        >
          <canvas ref={ref} className="block" />
        </div>
      </div>
    </div>
  );
};

/* ==================== Floating Canvas Action Rail ==================== */
const CanvasActionRail: React.FC<{ canvas: FabricCanvas | null; selected: any }> = ({ canvas, selected }) => {
  const actions = [
    { icon: LayersIcon, label: 'Layers' },
    { icon: Copy, label: 'Duplicate', onClick: () => selected && canvas && selected.clone((c: any) => { c.set({ left: (selected.left || 0) + 20, top: (selected.top || 0) + 20 }); canvas.add(c); canvas.renderAll(); }) },
    { icon: MousePointer, label: 'Comment' },
    { icon: ImageIcon, label: 'Media' },
    { icon: Lock, label: 'Lock' },
    { icon: Trash2, label: 'Delete', onClick: () => selected && canvas && (canvas.remove(selected), canvas.renderAll()) },
  ];
  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 hidden md:flex flex-col gap-1 rounded-xl border bg-card shadow-sm p-1">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.label}
            onClick={a.onClick}
            title={a.label}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
};

/* ==================== Page Thumbnails Row ==================== */
const PageThumbs: React.FC = () => (
  <div className="flex h-24 shrink-0 items-center gap-2 border-t bg-card/40 px-4">
    <button className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"><ChevronDown className="h-3.5 w-3.5 -rotate-90" /></button>
    <div className="flex items-center gap-2">
      <div className="relative h-16 w-14 rounded-md border-2 border-primary bg-gradient-to-br from-rose-100 to-amber-100 overflow-hidden shadow-sm">
        <span className="absolute top-1 left-1 text-[9px] font-bold text-primary">1</span>
      </div>
      <button className="grid h-16 w-14 place-items-center rounded-md border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/40 transition">
        <Plus className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="text-[11px] font-medium text-muted-foreground">Add Page</span>
    </div>
    <div className="flex-1" />
  </div>
);

/* ==================== Right Panel — AI Creative Assistant + Layers/Pages ==================== */
const LAYERS = [
  { name: 'Logo', icon: Sparkles },
  { name: 'Headline', icon: TypeIcon },
  { name: 'Subheadline', icon: TypeIcon },
  { name: 'Feature List', icon: LayersIcon, expandable: true },
  { name: 'Product Image', icon: ImageIcon },
  { name: 'Flowers', icon: Star },
  { name: 'CTA Button', icon: SquareIcon },
  { name: 'Bottom Icons', icon: SquareIcon },
  { name: 'Background', icon: Palette },
];

const RightAIPanel: React.FC<{
  canvas: FabricCanvas | null;
  designId: string;
  scoreVersion: number;
  onClose?: () => void;
}> = ({ canvas, designId, scoreVersion, onClose }) => {
  const scores = React.useMemo(() => computeScores(canvas), [canvas, scoreVersion]);
  const [tab, setTab] = useState<'layers' | 'pages'>('layers');
  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-card border-l">
      {onClose && (
        <div className="flex items-center justify-end px-3 py-2 border-b lg:hidden">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      )}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          <DesignScorePanel canvas={canvas} version={scoreVersion} />
          <AISuggestionsList canvas={canvas} scores={scores} designId={designId} />

          {/* Layers / Pages */}
          <div className="rounded-2xl border bg-card shadow-sm">
            <div className="flex border-b">
              {(['layers', 'pages'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'relative flex-1 py-2.5 text-[12px] font-semibold capitalize',
                    tab === t ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {t}
                  {tab === t && <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-t" />}
                </button>
              ))}
            </div>
            <div className="p-2 space-y-0.5">
              {tab === 'layers' ? LAYERS.map((l, i) => {
                const Icon = l.icon;
                return (
                  <div key={i} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60">
                    {l.expandable ? <ChevronRight className="h-3 w-3 text-muted-foreground" /> : <span className="w-3" />}
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate text-[12px]">{l.name}</span>
                    <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                    <button className="opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  </div>
                );
              }) : (
                <div className="p-3 text-center">
                  <div className="mx-auto h-20 w-16 rounded border-2 border-primary bg-gradient-to-br from-rose-100 to-amber-100" />
                  <p className="mt-2 text-[11px] font-semibold">Page 1</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};

/* ==================== Sticky AI Suggestion Banner ==================== */
const AISuggestionBanner: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <div className="flex items-center gap-4 border-t bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 px-4 py-3">
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent">
      <Sparkles className="h-4 w-4 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[12px] font-semibold"><span className="text-primary">AI Suggestion:</span> This layout has a 24% higher CTR in Beauty campaigns.</p>
      <p className="text-[11px] text-muted-foreground">Would you like to create 3 variations of this design?</p>
    </div>
    <Button size="sm" className="h-9 gap-1.5 bg-primary hover:bg-primary/90">Generate Variations</Button>
    <Button size="sm" variant="ghost" className="h-9" onClick={onDismiss}>Not now</Button>
    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onDismiss}><X className="h-4 w-4" /></Button>
  </div>
);

/* ==================== Main Editor ==================== */
const EditorInner: React.FC = () => {
  const [projectName, setProjectName] = useState('Summer Glow Serum Ad');
  const [zoom, setZoom] = useState(100);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [scoreVersion, forceUpdate] = useState(0);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const designId = React.useMemo(() => crypto.randomUUID(), []);
  const isMobile = useIsMobile();

  React.useEffect(() => {
    if (!canvas) return;
    const bump = () => forceUpdate((n) => n + 1);
    canvas.on('object:added', bump);
    canvas.on('object:removed', bump);
    canvas.on('object:modified', bump);
    return () => {
      canvas.off('object:added', bump);
      canvas.off('object:removed', bump);
      canvas.off('object:modified', bump);
    };
  }, [canvas]);

  const addText = (text: string, size: number, weight: string) => {
    if (!canvas) return;
    const tb = new Textbox(text, { left: 60, top: 60, fontSize: size, fontWeight: weight, fill: '#1a1145', fontFamily: 'Montserrat', width: 320 });
    canvas.add(tb); canvas.setActiveObject(tb); canvas.renderAll();
    setSelected(tb); forceUpdate((n) => n + 1);
  };
  const addShape = (t: 'rectangle' | 'circle' | 'triangle' | 'star') => {
    if (!canvas) return;
    const s = t === 'circle'
      ? new FCircle({ left: 100, top: 100, radius: 60, fill: '#8b5cf6' })
      : new Rect({ left: 100, top: 100, width: 120, height: 120, fill: '#8b5cf6' });
    canvas.add(s); canvas.setActiveObject(s); canvas.renderAll();
    setSelected(s); forceUpdate((n) => n + 1);
  };

  const onExport = () => {
    if (!canvas) return;
    const url = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    const a = document.createElement('a'); a.href = url; a.download = `${projectName || 'design'}.png`; a.click();
    toast({ title: 'Exported', description: 'Your design has been downloaded.' });
  };

  const secondarySidebar = <ElementsUploadsSidebar onAddText={addText} onAddShape={addShape} />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Main AdVista sidebar */}
      <AppSidebar />

      {/* Editor column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <WorkspaceBar
          onExport={onExport}
          onToggleLeft={() => setLeftOpen(true)}
          onToggleRight={() => setRightOpen(true)}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Secondary Elements/Uploads panel */}
          <div className="hidden md:flex w-[280px] shrink-0 border-r">
            {secondarySidebar}
          </div>

          {/* Center canvas column */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <ProjectTitleRow name={projectName} setName={setProjectName} zoom={zoom} setZoom={setZoom} />
            <FormattingToolbar selected={selected} canvas={canvas} />
            <div className="relative flex flex-1 min-h-0 overflow-hidden">
              <CanvasActionRail canvas={canvas} selected={selected} />
              <CanvasStage
                zoom={zoom}
                onCanvasReady={(c) => setCanvas(c)}
                onSelection={(o) => { setSelected(o); forceUpdate((n) => n + 1); }}
              />
              <EmptyCanvasAIStart visible={!!canvas && (canvas.getObjects()?.length ?? 0) === 0} />
              {selected && (
                <div className="pointer-events-auto absolute bottom-4 right-4 z-20 animate-in fade-in slide-in-from-bottom-2">
                  <AIActionsMenu selected={selected} canvas={canvas} align="end" />
                </div>
              )}
            </div>
            <PageThumbs />
            {showBanner && <AISuggestionBanner onDismiss={() => setShowBanner(false)} />}
          </div>

          {/* Right AI panel */}
          <div className="hidden lg:flex w-[300px] shrink-0">
            <RightAIPanel canvas={canvas} designId={designId} scoreVersion={scoreVersion} />
          </div>
        </div>
      </div>

      {/* Mobile left sheet */}
      <Sheet open={leftOpen} onOpenChange={setLeftOpen}>
        <SheetContent side="left" className="w-[min(20rem,calc(100vw-2rem))] p-0">
          <div className="h-full min-h-0">{secondarySidebar}</div>
        </SheetContent>
      </Sheet>
      {/* Mobile right sheet */}
      <Sheet open={rightOpen} onOpenChange={setRightOpen}>
        <SheetContent side="right" className="w-[min(20rem,calc(100vw-2rem))] p-0">
          <RightAIPanel canvas={canvas} designId={designId} scoreVersion={scoreVersion} onClose={() => setRightOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
};

const VisualEditorPage: React.FC = () => (
  <VisualEditorProvider>
    <EditorInner />
  </VisualEditorProvider>
);

export default VisualEditorPage;

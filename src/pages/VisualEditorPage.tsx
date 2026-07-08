import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Canvas as FabricCanvas,
  Rect,
  Circle as FCircle,
  Triangle as FTriangle,
  Textbox,
  FabricImage,
} from 'fabric';
import { VisualEditorProvider } from '@/contexts/VisualEditorContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Sparkles, ChevronDown, ChevronRight, Search, Plus, Play, Download, Send,
  Bell, HelpCircle, Undo2, Redo2, Grid3x3, Maximize2, Minus, Menu, PanelRight,
  LayoutTemplate, Image as ImageIcon, Type as TypeIcon, Shapes, Palette, Upload,
  Layers as LayersIcon, FolderOpen, Settings as SettingsIcon, Moon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline,
  Lock, Unlock, Eye, EyeOff, Copy, Trash2, MoreHorizontal, Edit3,
  Square as SquareIcon, Circle as CircleIcon, Triangle as TriangleIcon, Star,
  Film, Music, Mic2, Wand2, Scissors, ArrowUpDown, Move, RotateCw, Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTemplates } from '@/hooks/useTemplates';
import { useMediaAssets, useUploadAssets } from '@/hooks/useMediaLibrary';
import { useBrandKits, useBrandColors, useBrandFonts } from '@/hooks/useBrandKit';
import { useAuth } from '@/hooks/useAuth';
import { DesignScorePanel, computeScores, DesignScores } from '@/components/visual-editor/DesignScorePanel';
import { AISuggestionsList } from '@/components/visual-editor/AISuggestionsList';
import { EmptyCanvasAIStart } from '@/components/visual-editor/EmptyCanvasAIStart';

/* =========================================================================
   CANVAS PRESETS
   ========================================================================= */
const CANVAS_PRESETS = [
  { id: 'ig-post', label: 'Instagram Post', w: 1080, h: 1080 },
  { id: 'ig-story', label: 'Instagram Story', w: 1080, h: 1920 },
  { id: 'fb-ad', label: 'Facebook Ad', w: 1200, h: 628 },
  { id: 'tiktok', label: 'TikTok Video', w: 1080, h: 1920 },
  { id: 'yt-thumb', label: 'YouTube Thumbnail', w: 1280, h: 720 },
  { id: 'gdn-med', label: 'Google Display 300x250', w: 300, h: 250 },
  { id: 'gdn-lb', label: 'Google Leaderboard', w: 728, h: 90 },
  { id: 'li-ad', label: 'LinkedIn Ad', w: 1200, h: 627 },
];

const RAIL_TABS = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'text', label: 'Text', icon: TypeIcon },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'brand', label: 'Brand Kit', icon: Palette },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
] as const;
type RailTabId = typeof RAIL_TABS[number]['id'];

/* =========================================================================
   TOP BAR (dark)
   ========================================================================= */
const TopBar: React.FC<{
  name: string;
  onNameChange: (v: string) => void;
  saveStatus: 'saved' | 'saving' | 'idle';
  zoom: number;
  onZoom: (z: number) => void;
  size: { w: number; h: number; label: string };
  onPreview: () => void;
  onExport: () => void;
  onFitScreen: () => void;
  onUndo: () => void;
  onRedo: () => void;
}> = ({ name, onNameChange, saveStatus, zoom, onZoom, size, onPreview, onExport, onFitScreen, onUndo, onRedo }) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  useEffect(() => setDraft(name), [name]);
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-[hsl(240_15%_10%)] px-3 text-white/90">
      <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => navigate('/dashboard')}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0">
          {editing ? (
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => { setEditing(false); onNameChange(draft.trim() || 'Untitled'); }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              className="h-7 w-[260px] rounded-md border-white/20 bg-white/5 text-[13px] font-semibold text-white"
            />
          ) : (
            <button onClick={() => setEditing(true)} className="group flex items-center gap-1.5 text-[13px] font-semibold text-white">
              <span className="truncate max-w-[280px]">{name}</span>
              <Edit3 className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
            </button>
          )}
          <p className="text-[10.5px] text-white/50">{size.label} • {size.w} × {size.h} px</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10.5px] font-semibold text-emerald-300">
          <span className={cn('h-1.5 w-1.5 rounded-full', saveStatus === 'saving' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400')} />
          {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
        </div>
      </div>
      <div className="hidden md:flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white" onClick={onUndo}><Undo2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white" onClick={onRedo}><Redo2 className="h-4 w-4" /></Button>
      </div>
      <div className="mx-2 hidden md:flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 px-1 py-0.5">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => onZoom(Math.max(0.1, zoom - 0.1))}>
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-12 text-center text-[12px] font-semibold tabular-nums">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => onZoom(Math.min(4, zoom + 0.1))}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white hidden md:inline-flex"><Grid3x3 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white hidden md:inline-flex" onClick={onFitScreen}><Maximize2 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-white/80 hover:bg-white/10 hover:text-white hidden sm:inline-flex" onClick={onPreview}>
        <Play className="h-3.5 w-3.5" /> Preview
      </Button>
      <Button size="sm" className="h-8 gap-1.5 bg-white text-[hsl(240_15%_10%)] hover:bg-white/90" onClick={onExport}>
        <Download className="h-3.5 w-3.5" /> Export
      </Button>
      <Button size="sm" className="h-8 gap-1.5 bg-gradient-to-r from-primary to-[hsl(271_88%_66%)] hover:opacity-90 text-white hidden sm:inline-flex">
        <Send className="h-3.5 w-3.5" /> Publish
      </Button>
      <div className="ml-1 flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"><HelpCircle className="h-4 w-4" /></Button>
        <button className="relative">
          <Bell className="h-4 w-4 text-white/70" />
          <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-rose-500 text-[8px] font-bold text-white">2</span>
        </button>
        <div className="ml-1 h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-primary" />
      </div>
    </header>
  );
};

/* =========================================================================
   LEFT ICON RAIL
   ========================================================================= */
const IconRail: React.FC<{ active: RailTabId; onSelect: (id: RailTabId) => void }> = ({ active, onSelect }) => (
  <aside className="hidden md:flex sticky top-0 h-full w-[92px] shrink-0 flex-col items-stretch border-r border-white/10 bg-[hsl(240_17%_9%)] text-white">
    <div className="flex flex-col items-center gap-1 border-b border-white/10 px-2 py-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-[hsl(271_88%_66%)] shadow">
        <Sparkles className="h-4 w-4" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">AdVista</p>
      <p className="text-[9px] text-white/40">Creative Studio</p>
    </div>
    <ScrollArea className="min-h-0 flex-1">
      <nav className="flex flex-col gap-1 px-2 py-3">
        {RAIL_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={cn(
                'group flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10.5px] font-semibold transition-colors',
                isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
              )}
            >
              <div className={cn('grid h-8 w-8 place-items-center rounded-lg', isActive ? 'bg-gradient-to-br from-primary to-[hsl(271_88%_66%)] text-white' : 'text-white/70 group-hover:text-white')}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>
    </ScrollArea>
    <div className="border-t border-white/10 p-2">
      <div className="mb-2 rounded-xl bg-gradient-to-br from-primary/20 to-[hsl(271_88%_66%)]/20 p-2 text-center">
        <Sparkles className="mx-auto mb-1 h-3.5 w-3.5 text-primary" />
        <p className="text-[9.5px] font-semibold">Upgrade to Pro</p>
        <button className="mt-1 w-full rounded-md bg-primary py-1 text-[10px] font-bold text-white hover:opacity-90">Upgrade</button>
      </div>
      <div className="flex items-center justify-around text-white/60">
        <button className="hover:text-white"><SettingsIcon className="h-3.5 w-3.5" /></button>
        <button className="hover:text-white"><Moon className="h-3.5 w-3.5" /></button>
        <button className="hover:text-white"><HelpCircle className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  </aside>
);

/* =========================================================================
   PANEL WRAPPER
   ========================================================================= */
const PanelShell: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <div className="flex h-full min-h-0 flex-col bg-[hsl(240_15%_12%)] text-white">
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {action}
    </div>
    <ScrollArea className="min-h-0 flex-1">
      <div className="p-4">{children}</div>
    </ScrollArea>
  </div>
);

const SectionHeader: React.FC<{ title: string; onSeeAll?: () => void }> = ({ title, onSeeAll }) => (
  <div className="mb-2 mt-4 flex items-center justify-between first:mt-0">
    <p className="text-[12px] font-semibold text-white/80">{title}</p>
    {onSeeAll && <button onClick={onSeeAll} className="text-[11px] font-medium text-primary hover:underline">See all</button>}
  </div>
);

/* =========================================================================
   TEMPLATES PANEL
   ========================================================================= */
const TemplatesPanel: React.FC<{ onInsert: (t: any) => void }> = ({ onInsert }) => {
  const [chip, setChip] = useState('All');
  const [q, setQ] = useState('');
  const { data: templates = [] } = useTemplates();
  const chips = ['All', 'Social Media', 'Ads', 'Stories', 'Video'];
  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [templates, q]);
  const featured = filtered.slice(0, 4);
  const igPosts = filtered.slice(0, 2);
  const igStories = filtered.slice(0, 3);

  return (
    <PanelShell title="Templates">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates" className="h-9 rounded-lg border-white/10 bg-white/5 pl-8 text-[12px] text-white placeholder:text-white/40" />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button key={c} onClick={() => setChip(c)} className={cn(
            'rounded-full px-3 py-1 text-[11px] font-semibold transition',
            chip === c ? 'bg-primary text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
          )}>{c}</button>
        ))}
      </div>

      <SectionHeader title="Recommended for you" onSeeAll={() => toast({ title: 'Recommended templates' })} />
      <div className="grid grid-cols-2 gap-2">
        {featured.length > 0 ? featured.map((t) => (
          <button key={t.id} onClick={() => onInsert(t)} className="group aspect-square overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] hover:border-primary/50 transition">
            <div className="grid h-full place-items-center px-2 text-center">
              <p className="text-[11px] font-bold text-white line-clamp-3">{t.name}</p>
            </div>
          </button>
        )) : Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl border border-white/10 bg-gradient-to-br from-fuchsia-500/20 to-primary/20" />
        ))}
      </div>

      <SectionHeader title="Instagram Post" onSeeAll={() => {}} />
      <div className="grid grid-cols-2 gap-2">
        {(igPosts.length > 0 ? igPosts : [1, 2]).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/20 to-rose-500/20" />
        ))}
      </div>

      <SectionHeader title="Instagram Story" onSeeAll={() => {}} />
      <div className="grid grid-cols-3 gap-2">
        {(igStories.length > 0 ? igStories : [1, 2, 3]).map((_, i) => (
          <div key={i} className="aspect-[9/16] rounded-xl border border-white/10 bg-gradient-to-br from-sky-500/20 to-emerald-500/20" />
        ))}
      </div>
    </PanelShell>
  );
};

/* =========================================================================
   MEDIA PANEL
   ========================================================================= */
const MediaPanel: React.FC<{ onInsert: (url: string, type: string) => void }> = ({ onInsert }) => {
  const { data: assets = [] } = useMediaAssets();
  const [type, setType] = useState<string>('all');
  const filtered = assets.filter((a) => type === 'all' || a.type === type);
  return (
    <PanelShell title="Media">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {['all', 'image', 'video', 'audio'].map((t) => (
          <button key={t} onClick={() => setType(t)} className={cn(
            'rounded-full px-3 py-1 text-[11px] font-semibold capitalize',
            type === t ? 'bg-primary text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
          )}>{t}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 p-6 text-center">
          <ImageIcon className="mx-auto mb-2 h-6 w-6 text-white/40" />
          <p className="text-[12px] text-white/60">No media yet. Upload from the Uploads tab or the Media Library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => a.file_url && onInsert(a.file_url, a.type)}
              className="group aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:border-primary/50"
            >
              {a.type === 'image' && a.file_url ? (
                <img src={a.file_url} alt={a.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-white/60">
                  <Film className="h-6 w-6" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </PanelShell>
  );
};

/* =========================================================================
   TEXT PANEL
   ========================================================================= */
const TextPanel: React.FC<{ onAddText: (text: string, size: number, weight: string) => void }> = ({ onAddText }) => {
  const presets = [
    { l: 'Add a heading', s: 48, w: 'bold' },
    { l: 'Add a subheading', s: 24, w: '600' },
    { l: 'Add body text', s: 14, w: 'normal' },
    { l: 'Shop Now →', s: 18, w: '600' },
  ];
  return (
    <PanelShell title="Text">
      <Button className="mb-3 h-10 w-full gap-2 bg-primary hover:opacity-90 text-white" onClick={() => onAddText('Add your text', 24, 'normal')}>
        <Plus className="h-4 w-4" /> Add a text box
      </Button>
      <SectionHeader title="Default styles" />
      <div className="space-y-2">
        {presets.map((p) => (
          <button
            key={p.l}
            onClick={() => onAddText(p.l, p.s, p.w)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:border-primary/40 hover:bg-white/10"
          >
            <span style={{ fontSize: Math.min(p.s / 2, 22), fontWeight: p.w as any }} className="text-white">
              {p.l}
            </span>
          </button>
        ))}
      </div>
      <SectionHeader title="Font pairs" />
      <div className="grid grid-cols-2 gap-2">
        {['Montserrat', 'Playfair', 'Inter', 'Poppins'].map((f) => (
          <div key={f} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center text-[12px] font-semibold text-white/80">{f}</div>
        ))}
      </div>
    </PanelShell>
  );
};

/* =========================================================================
   ELEMENTS PANEL
   ========================================================================= */
const ElementsPanel: React.FC<{ onAddShape: (t: 'rectangle' | 'circle' | 'triangle') => void }> = ({ onAddShape }) => (
  <PanelShell title="Elements">
    <SectionHeader title="Shapes" />
    <div className="grid grid-cols-4 gap-2">
      {[
        { i: SquareIcon, t: 'rectangle' as const },
        { i: CircleIcon, t: 'circle' as const },
        { i: TriangleIcon, t: 'triangle' as const },
        { i: Star, t: 'rectangle' as const },
      ].map(({ i: Icon, t }, k) => (
        <button key={k} onClick={() => onAddShape(t)} className="aspect-square grid place-items-center rounded-xl border border-white/10 bg-white/5 text-white hover:border-primary/40 hover:bg-white/10">
          <Icon className="h-6 w-6" />
        </button>
      ))}
    </div>
    <SectionHeader title="Lines & Arrows" />
    <div className="grid grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((k) => (
        <div key={k} className="aspect-square grid place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70">
          <div className="h-0.5 w-8 rounded-full bg-white/70" />
        </div>
      ))}
    </div>
    <SectionHeader title="Buttons & Badges" />
    <div className="space-y-2">
      <div className="rounded-full bg-primary px-4 py-2 text-center text-[12px] font-bold text-white">Shop Now</div>
      <div className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-center text-[12px] font-semibold text-white">Learn More</div>
      <Badge className="bg-accent text-accent-foreground">-50% OFF</Badge>
    </div>
    <SectionHeader title="Backgrounds" />
    <div className="grid grid-cols-3 gap-2">
      {[
        'from-fuchsia-500 to-primary',
        'from-amber-400 to-rose-500',
        'from-cyan-400 to-blue-500',
        'from-emerald-400 to-teal-500',
        'from-slate-700 to-slate-900',
        'from-orange-400 to-red-500',
      ].map((bg, i) => (
        <div key={i} className={cn('aspect-square rounded-xl bg-gradient-to-br', bg)} />
      ))}
    </div>
  </PanelShell>
);

/* =========================================================================
   BRAND KIT PANEL
   ========================================================================= */
const BrandKitPanel: React.FC<{ onApply: (kit: any) => void }> = ({ onApply }) => {
  const { data: kits = [] } = useBrandKits();
  const primary = kits[0];
  const { data: colors = [] } = useBrandColors(primary?.id);
  const { data: fonts = [] } = useBrandFonts(primary?.id);
  return (
    <PanelShell title="Brand Kit">
      {primary ? (
        <>
          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold">{primary.name}</p>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-0">Active</Badge>
            </div>
            <Button onClick={() => onApply(primary)} className="mt-3 h-9 w-full gap-2 bg-primary hover:opacity-90 text-white">
              <Sparkles className="h-4 w-4" /> Apply Brand Kit
            </Button>
          </div>
          <SectionHeader title="Colors" />
          <div className="grid grid-cols-6 gap-2">
            {[primary.primary_color, primary.secondary_color, primary.accent_color, ...colors.map((c) => c.hex)].filter(Boolean).map((c, i) => (
              <div key={i} className="aspect-square rounded-lg border border-white/10" style={{ backgroundColor: c }} />
            ))}
          </div>
          <SectionHeader title="Fonts" />
          <div className="space-y-2">
            {(fonts.length > 0 ? fonts : [{ id: 'a', name: 'Montserrat', role: 'Heading' }, { id: 'b', name: 'Inter', role: 'Body' }] as any).map((f: any) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div>
                  <p className="text-[13px] font-bold text-white">{f.name}</p>
                  <p className="text-[10.5px] text-white/50">{f.role}</p>
                </div>
                <TypeIcon className="h-4 w-4 text-white/40" />
              </div>
            ))}
          </div>
          <SectionHeader title="Logos" />
          {primary.logo_url ? (
            <div className="rounded-xl border border-white/10 bg-white p-3">
              <img src={primary.logo_url} alt="logo" className="mx-auto h-20 object-contain" />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-[12px] text-white/50">No logo uploaded</div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-white/15 p-6 text-center">
          <Palette className="mx-auto mb-2 h-6 w-6 text-white/40" />
          <p className="text-[12px] text-white/60">Create a brand kit to apply colors, fonts and logos in one click.</p>
        </div>
      )}
    </PanelShell>
  );
};

/* =========================================================================
   UPLOADS PANEL
   ========================================================================= */
const UploadsPanel: React.FC<{ onInsert: (url: string, type: string) => void }> = ({ onInsert }) => {
  const { data: assets = [] } = useMediaAssets();
  const upload = useUploadAssets();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploads = assets.filter((a) => a.source === 'upload').slice(0, 12);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    upload.mutate({ files: Array.from(files) });
  };

  return (
    <PanelShell title="Uploads">
      <input ref={inputRef} type="file" multiple accept="image/*,video/*,audio/*,.pdf,.svg" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <button
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        className="mb-3 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/5 px-4 py-8 hover:border-primary/40 hover:bg-white/10"
      >
        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/20 text-primary">
          <Upload className="h-5 w-5" />
        </div>
        <p className="text-[12.5px] font-semibold text-white">Upload files</p>
        <p className="text-[10.5px] text-white/50">PNG · JPG · SVG · MP4 · GIF · PDF</p>
      </button>
      {upload.isPending && <p className="mb-2 text-[11px] text-primary">Uploading…</p>}
      <SectionHeader title="Recent uploads" />
      {uploads.length === 0 ? (
        <p className="text-[11px] text-white/50">No uploads yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {uploads.map((a) => (
            <button key={a.id} onClick={() => a.file_url && onInsert(a.file_url, a.type)} className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5 hover:border-primary/50">
              {a.type === 'image' && a.file_url ? (
                <img src={a.file_url} alt={a.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-white/60"><Film className="h-4 w-4" /></div>
              )}
            </button>
          ))}
        </div>
      )}
    </PanelShell>
  );
};

/* =========================================================================
   LAYERS PANEL
   ========================================================================= */
const LayersPanel: React.FC<{ canvas: FabricCanvas | null; version: number }> = ({ canvas, version }) => {
  const objs = (canvas?.getObjects() || []) as any[];
  const [, force] = useState(0);
  const refresh = () => { canvas?.renderAll(); force((v) => v + 1); };
  return (
    <PanelShell title="Layers">
      {objs.length === 0 ? (
        <p className="text-[12px] text-white/50">No layers yet. Add elements to the canvas.</p>
      ) : (
        <div className="space-y-1.5">
          {[...objs].reverse().map((o, i) => {
            const idx = objs.length - 1 - i;
            const label = o.type === 'textbox' || o.type === 'text'
              ? (o.text || 'Text').slice(0, 24)
              : o.type === 'image' ? 'Image' : o.type;
            const active = canvas?.getActiveObject() === o;
            return (
              <div
                key={idx}
                className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-2 transition',
                  active ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5 hover:bg-white/10')}
              >
                <button onClick={() => { canvas?.setActiveObject(o); refresh(); }} className="flex min-w-0 flex-1 items-center gap-2 text-left text-white">
                  {o.type === 'textbox' || o.type === 'text' ? <TypeIcon className="h-3.5 w-3.5 shrink-0" /> :
                    o.type === 'image' ? <ImageIcon className="h-3.5 w-3.5 shrink-0" /> :
                      <SquareIcon className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate text-[12px]">{label}</span>
                </button>
                <button onClick={() => { o.visible = !o.visible; refresh(); }} className="text-white/60 hover:text-white">
                  {o.visible === false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => { o.selectable = !o.selectable; o.evented = o.selectable; refresh(); }} className="text-white/60 hover:text-white">
                  {o.selectable === false ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => { canvas?.remove(o); refresh(); }} className="text-white/60 hover:text-rose-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
};

/* =========================================================================
   PROJECTS PANEL (stub — reads user_canvas_drafts as recent designs)
   ========================================================================= */
const ProjectsPanel: React.FC = () => {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any).from('user_canvas_drafts').select('*').eq('user_id', user.id).limit(12);
      setDrafts(data || []);
    })();
  }, [user]);
  return (
    <PanelShell title="Projects">
      <div className="mb-3 flex gap-1.5">
        {['Recent', 'Drafts', 'Campaigns'].map((c, i) => (
          <button key={c} className={cn('rounded-full px-3 py-1 text-[11px] font-semibold', i === 0 ? 'bg-primary text-white' : 'bg-white/5 text-white/70')}>{c}</button>
        ))}
      </div>
      {drafts.length === 0 ? (
        <p className="text-[12px] text-white/50">Your saved projects will appear here.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {drafts.map((d) => (
            <div key={d.id} className="aspect-video rounded-xl border border-white/10 bg-white/5 p-2 text-[10px] text-white/70">
              <p className="truncate">Draft {new Date(d.last_saved_at || d.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  );
};

/* =========================================================================
   PROPERTIES PANEL (right, dark)
   ========================================================================= */
const PropertiesPanel: React.FC<{
  canvas: FabricCanvas | null;
  selected: any;
  version: number;
  onClose: () => void;
}> = ({ canvas, selected, version, onClose }) => {
  const [, force] = useState(0);
  const refresh = () => { canvas?.renderAll(); force((v) => v + 1); };

  if (!selected) {
    // Show design intelligence when nothing selected
    const scores = computeScores(canvas);
    return (
      <aside className="hidden lg:flex h-full w-[320px] shrink-0 flex-col border-l border-white/10 bg-[hsl(240_15%_12%)] text-white">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-[15px] font-bold">Design Intelligence</h2>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 p-3">
            <DesignScorePanel canvas={canvas} version={version} />
            <AISuggestionsList canvas={canvas} scores={scores} designId="default" />
          </div>
        </ScrollArea>
      </aside>
    );
  }

  const isText = selected.type === 'textbox' || selected.type === 'text';
  const isImage = selected.type === 'image';
  const isShape = ['rect', 'circle', 'triangle'].includes(selected.type);
  const title = isText ? 'Text' : isImage ? 'Image' : isShape ? 'Shape' : 'Layer';

  return (
    <aside className="hidden lg:flex h-full w-[320px] shrink-0 flex-col border-l border-white/10 bg-[hsl(240_15%_12%)] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-[15px] font-bold">{title}</h2>
        <button onClick={onClose} className="text-white/60 hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
      </div>
      <Tabs defaultValue="design" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-3 mt-3 grid h-9 grid-cols-3 rounded-lg bg-white/5 p-0.5">
          <TabsTrigger value="design" className="h-7 rounded text-[11px] data-[state=active]:bg-primary data-[state=active]:text-white">Design</TabsTrigger>
          <TabsTrigger value="animation" className="h-7 rounded text-[11px] data-[state=active]:bg-primary data-[state=active]:text-white">Animation</TabsTrigger>
          <TabsTrigger value="position" className="h-7 rounded text-[11px] data-[state=active]:bg-primary data-[state=active]:text-white">Position</TabsTrigger>
        </TabsList>
        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="design" className="m-0 space-y-4 p-4">
            {isText && (
              <>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-white/70">Font</p>
                  <Select value={selected.fontFamily || 'Inter'} onValueChange={(v) => { selected.set('fontFamily', v); refresh(); }}>
                    <SelectTrigger className="h-9 border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Inter', 'Montserrat', 'Poppins', 'Playfair Display', 'Roboto', 'Lora'].map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold text-white/70">Weight</p>
                    <Select value={String(selected.fontWeight || 'normal')} onValueChange={(v) => { selected.set('fontWeight', v); refresh(); }}>
                      <SelectTrigger className="h-9 border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['normal', '500', '600', 'bold', '900'].map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold text-white/70">Size</p>
                    <Input type="number" value={selected.fontSize || 24} onChange={(e) => { selected.set('fontSize', Number(e.target.value) || 16); refresh(); }} className="h-9 border-white/10 bg-white/5 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                  {[AlignLeft, AlignCenter, AlignRight, AlignJustify].map((Icon, i) => {
                    const val = ['left', 'center', 'right', 'justify'][i];
                    const active = (selected.textAlign || 'left') === val;
                    return (
                      <button key={i} onClick={() => { selected.set('textAlign', val); refresh(); }}
                        className={cn('flex-1 grid place-items-center rounded py-1.5', active ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10')}>
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    );
                  })}
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-white/70">Style</p>
                  <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                    <button onClick={() => { selected.set('fontWeight', selected.fontWeight === 'bold' ? 'normal' : 'bold'); refresh(); }}
                      className={cn('flex-1 grid place-items-center rounded py-1.5', selected.fontWeight === 'bold' ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10')}><Bold className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { selected.set('fontStyle', selected.fontStyle === 'italic' ? 'normal' : 'italic'); refresh(); }}
                      className={cn('flex-1 grid place-items-center rounded py-1.5', selected.fontStyle === 'italic' ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10')}><Italic className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { selected.set('underline', !selected.underline); refresh(); }}
                      className={cn('flex-1 grid place-items-center rounded py-1.5', selected.underline ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10')}><Underline className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-white/70">Color</p>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
                    <input type="color" value={selected.fill || '#ffffff'} onChange={(e) => { selected.set('fill', e.target.value); refresh(); }} className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent" />
                    <span className="flex-1 text-[12px] uppercase text-white/80">{selected.fill || '#FFFFFF'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold text-white/70">Line Height</p>
                    <Input type="number" step={0.1} value={selected.lineHeight ?? 1.2} onChange={(e) => { selected.set('lineHeight', Number(e.target.value)); refresh(); }} className="h-9 border-white/10 bg-white/5 text-white" />
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold text-white/70">Letter Spacing</p>
                    <Input type="number" value={selected.charSpacing ?? 0} onChange={(e) => { selected.set('charSpacing', Number(e.target.value)); refresh(); }} className="h-9 border-white/10 bg-white/5 text-white" />
                  </div>
                </div>
              </>
            )}
            {isShape && (
              <>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-white/70">Fill</p>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
                    <input type="color" value={selected.fill || '#3B82F6'} onChange={(e) => { selected.set('fill', e.target.value); refresh(); }} className="h-8 w-8 cursor-pointer rounded" />
                    <span className="text-[12px] uppercase text-white/80">{selected.fill}</span>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-white/70">Border</p>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
                    <input type="color" value={selected.stroke || '#000000'} onChange={(e) => { selected.set('stroke', e.target.value); refresh(); }} className="h-8 w-8 cursor-pointer rounded" />
                    <Input type="number" value={selected.strokeWidth || 0} onChange={(e) => { selected.set('strokeWidth', Number(e.target.value)); refresh(); }} className="h-9 border-white/10 bg-white/5 text-white" />
                  </div>
                </div>
                {selected.type === 'rect' && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold text-white/70">Corner Radius: {selected.rx || 0}px</p>
                    <Slider value={[selected.rx || 0]} min={0} max={100} step={1} onValueChange={([v]) => { selected.set({ rx: v, ry: v }); refresh(); }} />
                  </div>
                )}
              </>
            )}
            {isImage && (
              <>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-white/70">Border Radius</p>
                  <Slider value={[0]} min={0} max={100} onValueChange={() => { }} />
                </div>
                <Button variant="outline" className="w-full gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"><Scissors className="h-3.5 w-3.5" /> Remove Background</Button>
                <Button variant="outline" className="w-full gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"><Wand2 className="h-3.5 w-3.5" /> Replace Image</Button>
              </>
            )}
            {/* Effects — common */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="mb-2 text-[11px] font-semibold text-white/70">Effects</p>
              <div className="space-y-2 text-[12px]">
                <div className="flex items-center justify-between"><span>Shadow</span><Switch /></div>
                <div className="flex items-center justify-between"><span>Outline</span><Switch /></div>
                <div className="flex items-center justify-between"><span>Glow</span><Switch /></div>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-white/70">Opacity: {Math.round((selected.opacity ?? 1) * 100)}%</p>
              <Slider value={[(selected.opacity ?? 1) * 100]} min={0} max={100} step={1} onValueChange={([v]) => { selected.set('opacity', v / 100); refresh(); }} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 gap-1.5 border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => {
                selected.clone().then((c: any) => { c.set({ left: (selected.left || 0) + 20, top: (selected.top || 0) + 20 }); canvas?.add(c); canvas?.setActiveObject(c); refresh(); });
              }}><Copy className="h-3.5 w-3.5" /> Duplicate</Button>
              <Button variant="outline" className="flex-1 gap-1.5 border-white/10 bg-white/5 text-rose-300 hover:bg-rose-500/10" onClick={() => { canvas?.remove(selected); refresh(); }}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="animation" className="m-0 space-y-3 p-4 text-white">
            <p className="text-[12px] text-white/60">Choose an entrance animation</p>
            <div className="grid grid-cols-3 gap-2">
              {['None', 'Fade', 'Rise', 'Slide', 'Pop', 'Bounce'].map((a) => (
                <button key={a} className="rounded-xl border border-white/10 bg-white/5 py-4 text-[11px] font-semibold hover:border-primary/40">{a}</button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="position" className="m-0 space-y-3 p-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-white/70">X</p>
                <Input type="number" value={Math.round(selected.left || 0)} onChange={(e) => { selected.set('left', Number(e.target.value)); refresh(); }} className="h-9 border-white/10 bg-white/5 text-white" />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-white/70">Y</p>
                <Input type="number" value={Math.round(selected.top || 0)} onChange={(e) => { selected.set('top', Number(e.target.value)); refresh(); }} className="h-9 border-white/10 bg-white/5 text-white" />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-white/70">Width</p>
                <Input type="number" value={Math.round((selected.width || 0) * (selected.scaleX || 1))} readOnly className="h-9 border-white/10 bg-white/5 text-white/70" />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-white/70">Height</p>
                <Input type="number" value={Math.round((selected.height || 0) * (selected.scaleY || 1))} readOnly className="h-9 border-white/10 bg-white/5 text-white/70" />
              </div>
              <div className="col-span-2">
                <p className="mb-1.5 text-[11px] font-semibold text-white/70">Rotation: {Math.round(selected.angle || 0)}°</p>
                <Slider value={[selected.angle || 0]} min={-180} max={180} step={1} onValueChange={([v]) => { selected.set('angle', v); refresh(); }} />
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
};

/* =========================================================================
   TIMELINE (video mode)
   ========================================================================= */
const Timeline: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  const tracks = [
    { icon: TypeIcon, label: 'Text', color: 'bg-primary/60' },
    { icon: ImageIcon, label: 'Image', color: 'bg-emerald-500/60' },
    { icon: SquareIcon, label: 'Shape', color: 'bg-amber-500/60' },
    { icon: Film, label: 'Video', color: 'bg-fuchsia-500/60' },
    { icon: Music, label: 'Audio', color: 'bg-cyan-500/60' },
  ];
  return (
    <div className="shrink-0 border-t border-white/10 bg-[hsl(240_15%_10%)] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <p className="text-[12px] font-semibold">Timeline <span className="text-white/40">(Video Project)</span></p>
        <div className="flex items-center gap-3 text-[11px] text-white/60">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/10"><Play className="h-3.5 w-3.5" /></Button>
          <span className="tabular-nums">00:03:12 / 00:15:00</span>
        </div>
      </div>
      <ScrollArea className="max-h-[180px]">
        <div className="min-w-[720px] p-3">
          {tracks.map((t) => (
            <div key={t.label} className="mb-1.5 flex items-center gap-2">
              <div className="flex w-24 shrink-0 items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
                <t.icon className="h-3.5 w-3.5 text-white/70" />
                <span className="text-[11px] font-semibold">{t.label}</span>
              </div>
              <div className="relative h-7 flex-1 rounded-md bg-white/5">
                <div className={cn('absolute left-2 top-1 bottom-1 rounded', t.color)} style={{ width: `${30 + Math.random() * 50}%` }} />
              </div>
            </div>
          ))}
          <button className="mt-2 flex items-center gap-1.5 rounded-md border border-dashed border-white/15 px-3 py-1.5 text-[11px] text-white/60 hover:bg-white/5">
            <Plus className="h-3 w-3" /> Add Track
          </button>
        </div>
      </ScrollArea>
    </div>
  );
};

/* =========================================================================
   CANVAS WORKSPACE
   ========================================================================= */
const CanvasWorkspace: React.FC<{
  onReady: (canvas: FabricCanvas) => void;
  size: { w: number; h: number };
  zoom: number;
  selected: any;
  isEmpty: boolean;
}> = ({ onReady, size, zoom, selected, isEmpty }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fcRef = useRef<FabricCanvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current || fcRef.current) return;
    const c = new FabricCanvas(canvasRef.current, {
      width: size.w,
      height: size.h,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    });
    fcRef.current = c;
    onReady(c);
  }, []);

  useEffect(() => {
    if (!fcRef.current) return;
    fcRef.current.setDimensions({ width: size.w, height: size.h });
    fcRef.current.renderAll();
  }, [size.w, size.h]);

  useEffect(() => {
    if (!fcRef.current) return;
    fcRef.current.setZoom(zoom);
    fcRef.current.setDimensions({ width: size.w * zoom, height: size.h * zoom });
    fcRef.current.renderAll();
  }, [zoom, size.w, size.h]);

  return (
    <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-auto bg-[hsl(240_20%_15%)] p-8">
      {/* soft radial backdrop like Canva */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 50% 40%, hsl(280 60% 25% / 0.35), transparent 55%)',
      }} />
      <div className="relative mx-auto" style={{ width: size.w * zoom }}>
        {/* Ruler top */}
        <div className="mb-1 flex h-5 items-end justify-between px-1 text-[9px] text-white/40 border-b border-white/10">
          {[0, 200, 400, 600, 800, 1000, 1200].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
        {/* Context toolbar */}
        <div className="mb-2 flex items-center gap-1 rounded-lg border border-white/10 bg-[hsl(240_15%_12%)] px-2 py-1.5 text-white shadow-lg w-fit mx-auto">
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-white hover:bg-white/10"><Wand2 className="h-3.5 w-3.5" /> Animate</Button>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-white hover:bg-white/10"><Move className="h-3.5 w-3.5" /> Position</Button>
          <span className="mx-1 h-4 w-px bg-white/15" />
          <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/10"><AlignLeft className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/10"><AlignCenter className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/10"><AlignRight className="h-3.5 w-3.5" /></Button>
          <span className="mx-1 h-4 w-px bg-white/15" />
          <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/10"><Lock className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/10"><Unlock className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="relative rounded-lg shadow-2xl overflow-hidden ring-1 ring-black/40">
          <canvas ref={canvasRef} />
          {isEmpty && <EmptyCanvasAIStart visible={true} />}
          {selected && (
            <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 z-10">
              <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-white/10 bg-[hsl(240_15%_12%)] px-1 py-1 text-white shadow-lg">
                <button className="grid h-7 w-7 place-items-center rounded hover:bg-white/10"><Edit3 className="h-3.5 w-3.5" /></button>
                <button className="grid h-7 w-7 place-items-center rounded hover:bg-white/10"><Copy className="h-3.5 w-3.5" /></button>
                <button className="grid h-7 w-7 place-items-center rounded hover:bg-white/10"><Trash2 className="h-3.5 w-3.5" /></button>
                <button className="grid h-7 w-7 place-items-center rounded hover:bg-white/10"><MoreHorizontal className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 flex justify-center">
          <button className="flex items-center gap-2 rounded-full border border-white/10 bg-[hsl(240_15%_12%)] px-4 py-2 text-[12px] font-semibold text-white hover:bg-white/10">
            <Plus className="h-3.5 w-3.5" /> Add Page
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   MAIN PAGE
   ========================================================================= */
const VisualEditorInner: React.FC = () => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<RailTabId>('templates');
  const [name, setName] = useState('Summer Glow Serum Ad');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [preset, setPreset] = useState(CANVAS_PRESETS[0]);
  const [zoom, setZoom] = useState(0.4);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [version, setVersion] = useState(0);
  const [mobileLeft, setMobileLeft] = useState(false);
  const [mobileRight, setMobileRight] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  // wire up selection + change events
  useEffect(() => {
    if (!canvas) return;
    const onSel = () => setSelected(canvas.getActiveObject() || null);
    const onCleared = () => setSelected(null);
    const onChange = () => setVersion((v) => v + 1);
    canvas.on('selection:created', onSel);
    canvas.on('selection:updated', onSel);
    canvas.on('selection:cleared', onCleared);
    canvas.on('object:added', onChange);
    canvas.on('object:removed', onChange);
    canvas.on('object:modified', () => { setSaveStatus('saving'); onChange(); setTimeout(() => setSaveStatus('saved'), 800); });
    return () => { canvas.off(); };
  }, [canvas]);

  // Element factories
  const addText = useCallback((text: string, size = 24, weight = 'normal') => {
    if (!canvas) return;
    const tb = new Textbox(text, {
      left: preset.w / 2 - 150, top: preset.h / 2 - size / 2, width: 300,
      fontSize: size, fontFamily: 'Inter', fontWeight: weight, fill: '#111827', textAlign: 'center',
    });
    canvas.add(tb); canvas.setActiveObject(tb); canvas.renderAll();
  }, [canvas, preset]);

  const addShape = useCallback((t: 'rectangle' | 'circle' | 'triangle') => {
    if (!canvas) return;
    let s: any;
    if (t === 'rectangle') s = new Rect({ left: 100, top: 100, width: 200, height: 120, fill: '#7C3AED', rx: 12, ry: 12 });
    else if (t === 'circle') s = new FCircle({ left: 100, top: 100, radius: 80, fill: '#F59E0B' });
    else s = new FTriangle({ left: 100, top: 100, width: 160, height: 140, fill: '#10B981' });
    canvas.add(s); canvas.setActiveObject(s); canvas.renderAll();
  }, [canvas]);

  const addImageFromUrl = useCallback(async (url: string, type: string) => {
    if (!canvas) return;
    if (type === 'image') {
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      img.scaleToWidth(Math.min(preset.w * 0.6, 400));
      img.set({ left: preset.w / 2 - img.getScaledWidth() / 2, top: preset.h / 2 - img.getScaledHeight() / 2 });
      canvas.add(img); canvas.setActiveObject(img); canvas.renderAll();
    } else if (type === 'video') {
      setShowTimeline(true);
      toast({ title: 'Video added to timeline' });
    }
  }, [canvas, preset]);

  const applyBrand = useCallback((kit: any) => {
    if (!canvas) return;
    canvas.getObjects().forEach((o: any) => {
      if (o.type === 'textbox' || o.type === 'text') {
        o.set({ fill: kit.primary_color || '#7C3AED' });
      } else if (o.type === 'rect' || o.type === 'circle' || o.type === 'triangle') {
        o.set({ fill: kit.accent_color || '#F59E0B' });
      }
    });
    canvas.renderAll();
    toast({ title: 'Brand kit applied' });
  }, [canvas]);

  const insertTemplate = useCallback((t: any) => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    addText(t.name || 'Your headline', 48, 'bold');
    toast({ title: `Loaded ${t.name}` });
  }, [canvas, addText]);

  const handleExport = async () => {
    if (!canvas) return;
    setExportOpen(true);
  };

  const doDownload = (fmt: 'png' | 'jpeg') => {
    if (!canvas) return;
    const url = canvas.toDataURL({ format: fmt, quality: 1, multiplier: 2 });
    const a = document.createElement('a');
    a.href = url; a.download = `${name}.${fmt}`; a.click();
    toast({ title: 'Downloaded' });
    setExportOpen(false);
  };

  // Auto-fit on preset change
  useEffect(() => {
    const target = 640;
    setZoom(Math.min(1, target / preset.h));
  }, [preset.id]);

  const panel = (() => {
    switch (tab) {
      case 'templates': return <TemplatesPanel onInsert={insertTemplate} />;
      case 'media': return <MediaPanel onInsert={addImageFromUrl} />;
      case 'text': return <TextPanel onAddText={addText} />;
      case 'elements': return <ElementsPanel onAddShape={addShape} />;
      case 'brand': return <BrandKitPanel onApply={applyBrand} />;
      case 'uploads': return <UploadsPanel onInsert={addImageFromUrl} />;
      case 'layers': return <LayersPanel canvas={canvas} version={version} />;
      case 'projects': return <ProjectsPanel />;
    }
  })();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[hsl(240_20%_8%)]">
      <TopBar
        name={name} onNameChange={setName}
        saveStatus={saveStatus} zoom={zoom} onZoom={setZoom}
        size={{ w: preset.w, h: preset.h, label: preset.label }}
        onPreview={() => setPreviewOpen(true)}
        onExport={handleExport}
        onFitScreen={() => setZoom(0.4)}
        onUndo={() => toast({ title: 'Undo' })}
        onRedo={() => toast({ title: 'Redo' })}
      />
      <div className="flex min-h-0 flex-1">
        <IconRail active={tab} onSelect={setTab} />
        {/* Contextual panel */}
        <div className="hidden md:block w-[320px] shrink-0 border-r border-white/10">{panel}</div>

        {/* Mobile left */}
        <Sheet open={mobileLeft} onOpenChange={setMobileLeft}>
          <SheetContent side="left" className="w-[320px] p-0 bg-[hsl(240_15%_12%)] border-white/10">{panel}</SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Canvas size selector strip */}
          <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 bg-[hsl(240_17%_11%)] px-3 text-white/80">
            <Button variant="ghost" size="sm" className="md:hidden h-8 gap-1.5 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setMobileLeft(true)}><Menu className="h-3.5 w-3.5" /> Panels</Button>
            <Select value={preset.id} onValueChange={(v) => { const p = CANVAS_PRESETS.find(x => x.id === v); if (p) setPreset(p); }}>
              <SelectTrigger className="h-8 w-[220px] border-white/10 bg-white/5 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>{CANVAS_PRESETS.map(p => <SelectItem key={p.id} value={p.id}>{p.label} • {p.w}×{p.h}</SelectItem>)}</SelectContent>
            </Select>
            <div className="ml-2 flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
              <button onClick={() => setShowTimeline(false)} className={cn('rounded px-3 py-1 text-[11px] font-semibold', !showTimeline ? 'bg-primary text-white' : 'text-white/60')}>Image</button>
              <button onClick={() => setShowTimeline(true)} className={cn('rounded px-3 py-1 text-[11px] font-semibold', showTimeline ? 'bg-primary text-white' : 'text-white/60')}>Video</button>
            </div>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" className="lg:hidden h-8 gap-1.5 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setMobileRight(true)}><PanelRight className="h-3.5 w-3.5" /></Button>
          </div>

          <CanvasWorkspace
            onReady={setCanvas}
            size={{ w: preset.w, h: preset.h }}
            zoom={zoom}
            selected={selected}
            isEmpty={(canvas?.getObjects().length ?? 0) === 0}
          />
          <Timeline visible={showTimeline} />
        </div>

        <PropertiesPanel canvas={canvas} selected={selected} version={version} onClose={() => canvas?.discardActiveObject().renderAll()} />

        {/* Mobile right */}
        <Sheet open={mobileRight} onOpenChange={setMobileRight}>
          <SheetContent side="right" className="w-[320px] p-0 bg-[hsl(240_15%_12%)] border-white/10">
            <div className="lg:hidden h-full">
              <PropertiesPanel canvas={canvas} selected={selected} version={version} onClose={() => setMobileRight(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Export</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-[12px] text-muted-foreground">Choose a format</p>
            <div className="grid grid-cols-3 gap-2">
              {(['png', 'jpeg'] as const).map((f) => (
                <Button key={f} variant="outline" className="h-14 flex-col gap-0.5" onClick={() => doDownload(f)}>
                  <span className="text-[13px] font-bold uppercase">{f}</span>
                  <span className="text-[10px] text-muted-foreground">High quality</span>
                </Button>
              ))}
              {['svg', 'pdf', 'mp4', 'gif', 'webp'].map((f) => (
                <Button key={f} variant="outline" className="h-14 flex-col gap-0.5" onClick={() => toast({ title: `${f.toUpperCase()} export coming soon` })}>
                  <span className="text-[13px] font-bold uppercase">{f}</span>
                  <span className="text-[10px] text-muted-foreground">Soon</span>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Live Preview</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            {['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'YouTube', 'Google Ads'].map((p) => (
              <div key={p} className="rounded-xl border p-3">
                <p className="mb-2 text-[11px] font-semibold text-muted-foreground uppercase">{p}</p>
                <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-accent/20" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const VisualEditorPage: React.FC = () => (
  <VisualEditorProvider>
    <VisualEditorInner />
  </VisualEditorProvider>
);

export default VisualEditorPage;

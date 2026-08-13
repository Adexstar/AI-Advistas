import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VisualEditorProvider, useVisualEditor } from '@/contexts/VisualEditorContext';
import { Canvas as FabricCanvas, Rect, Circle as FCircle, Textbox, Shadow, FabricImage } from 'fabric';
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
import { useNavigate } from 'react-router-dom';
import { useBrandKits, useBrandColors, useBrandFonts } from '@/hooks/useBrandKit';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { toast } from '@/hooks/use-toast';
import {
  Layout, Image as ImageIcon, Type, Shapes, Sparkles, Upload, Layers as LayersIcon,
  FolderOpen, Settings, Moon, HelpCircle, Bell, ChevronLeft, Edit3, Check,
  Undo2, Redo2, Play, Download, Send, Grid3x3, Maximize2, Minus, Plus,
  Wand2, MoveUp, MoveDown, AlignVerticalJustifyCenter, Lock, Unlock,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline,
  Copy, Trash2, MoreHorizontal, Search, Filter, Video, Music, Square as SquareIcon, Link,
  Circle as CircleIcon, MousePointer, Volume2, X, Menu, ChevronDown, PanelRight,
  Palette, Sun, Zap, Eye, EyeOff, Pause, ChevronRight, RefreshCw, GripVertical, Pipette, Box,
  ChevronUp, Scissors,
} from 'lucide-react';
import { AIActionsMenu } from '@/components/visual-editor/ai/AIActionsMenu';
import { AIQuickActionsMenu } from '@/components/visual-editor/ai/AIQuickActionsMenu';
import { consumePendingEditorTemplate, peekPendingEditorTemplate } from '@/lib/templateEditorSession';
import { TemplateEngine } from '@/services/templates/TemplateEngine';
import { loadTemplateJSONIntoCanvas, retryFailedImages, type ImageLayerStatus } from '@/services/templates/loadIntoCanvas';
import { supabase } from '@/integrations/supabase/client';
import { useAIContext } from '@/contexts/AIContext';
import {
  TemplatesPanel as StudioTemplatesPanel,
  MediaPanel as StudioMediaPanel,
  UploadsPanel as StudioUploadsPanel,
  ElementsPanel as StudioElementsPanel,
  BackgroundPanel as StudioBackgroundPanel,
  AIStudioPanel as StudioAIPanel,
  type StudioTemplate,
} from '@/components/visual-editor/panels/StudioPanels';
import {
  ARTBOARD_PRESETS, alignObject, deleteObject, duplicateObject, isLocked, moveLayer,
  reorderLayer, setLocked, setVisible,
} from '@/components/visual-editor/canvasActions';

/* ---------- Constants ---------- */
const LEFT_TABS = [
  { id: 'templates', label: 'Templates', icon: Layout },
  { id: 'background', label: 'Background', icon: Palette },
  { id: 'ai-studio', label: 'AI Studio', icon: Wand2 },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'brand', label: 'Brand Kit', icon: Sparkles },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
] as const;

const TEMPLATE_CATEGORIES = ['All', 'Social Media', 'Ads', 'Stories', 'Video'];

const RECOMMENDED = [
  { id: 1, title: 'SUMMER SALE', bg: 'from-purple-600 via-fuchsia-500 to-pink-500' },
  { id: 2, title: 'NEW ARRIVAL', bg: 'from-slate-100 to-slate-300', dark: true },
  { id: 3, title: 'Exclusive Collection', bg: 'from-amber-800 via-orange-700 to-red-800' },
  { id: 4, title: 'Big Sale 70% OFF', bg: 'from-orange-500 via-red-500 to-pink-600' },
];
const INSTA_POST = [
  { id: 5, title: 'Minimal Furniture', bg: 'from-slate-700 via-slate-800 to-slate-900' },
  { id: 6, title: 'FLASH SALE', bg: 'from-yellow-400 via-lime-400 to-green-500' },
];
const INSTA_STORY = [
  { id: 7, title: 'New Collection', bg: 'from-neutral-200 to-neutral-400', dark: true },
  { id: 8, title: 'WEEKEND OFFER 50%', bg: 'from-pink-500 via-fuchsia-600 to-purple-700' },
  { id: 9, title: 'SPECIAL DISCOUNT 40%', bg: 'from-cyan-500 via-blue-600 to-indigo-700' },
];

/* ---------- Left Icon Rail ---------- */
const IconRail: React.FC<{ active: string; onChange: (id: string) => void }> = ({ active, onChange }) => (
  <aside className="hidden md:flex h-full w-[56px] shrink-0 flex-col items-stretch bg-[hsl(245,45%,10%)] text-slate-200 border-r border-white/5">
    <div className="flex items-center justify-center py-3 border-b border-white/5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-lg">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
    </div>
    <div className="pt-1 pb-1 text-[8px] font-semibold uppercase tracking-wider text-white/40 text-center leading-tight">
      AV<br /><span className="text-white/30 font-normal normal-case">Studio</span>
    </div>
    <nav className="flex-1 py-2 space-y-0.5 px-1 overflow-y-auto">
      {LEFT_TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={[
              'group flex w-full flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition-all',
              isActive
                ? 'bg-primary/90 text-white shadow-lg shadow-primary/30'
                : 'text-white/60 hover:bg-white/5 hover:text-white',
            ].join(' ')}
          >
            <Icon className="h-[16px] w-[16px]" />
            <span className="text-[9px] font-medium leading-none">{t.label}</span>
          </button>
        );
      })}
    </nav>
    <div className="mx-1 mb-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-white/10 p-1.5 text-center">
      <div className="mx-auto mb-1 flex h-5 w-5 items-center justify-center rounded-lg bg-accent/90 text-[hsl(236,31%,13%)]">
        <Zap className="h-3 w-3" />
      </div>
      <p className="text-[8px] font-semibold text-white leading-tight">Pro</p>
      <Button size="sm" className="mt-1 h-5 w-full rounded-lg bg-primary hover:bg-primary/90 text-[8px] px-1">Upgrade</Button>
    </div>
    <div className="flex items-center justify-around border-t border-white/5 py-1.5 text-white/50">
      <button className="rounded-lg p-1 hover:bg-white/5 hover:text-white"><Settings className="h-3.5 w-3.5" /></button>
      <button className="rounded-lg p-1 hover:bg-white/5 hover:text-white"><Moon className="h-3.5 w-3.5" /></button>
      <button className="rounded-lg p-1 hover:bg-white/5 hover:text-white"><HelpCircle className="h-3.5 w-3.5" /></button>
    </div>
  </aside>
);

/* ---------- Top Toolbar ---------- */
const TopToolbar: React.FC<{
  projectName: string;
  setProjectName: (s: string) => void;
  zoom: number;
  setZoom: (n: number) => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  isMobile: boolean;
  showGrid: boolean;
  onToggleGrid: () => void;
  onFit: () => void;
  onPreview: () => void;
  onPublish: () => void;
  artboardLabel: string;
}> = ({ projectName, setProjectName, zoom, setZoom, onExport, onUndo, onRedo, canUndo, canRedo, onToggleLeft, onToggleRight, isMobile, showGrid, onToggleGrid, onFit, onPreview, onPublish, artboardLabel }) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  if (isMobile) {
    return (
      <header className="flex h-[52px] shrink-0 items-center gap-2 border-b bg-card/95 backdrop-blur px-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onToggleLeft}>
          <Menu className="h-4 w-4" />
        </Button>
        {editing ? (
          <Input autoFocus value={projectName} onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => setEditing(false)} onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            className="h-8 flex-1 text-sm font-semibold" />
        ) : (
          <button onClick={() => setEditing(true)}
            className="group flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-muted/70 flex-1 min-w-0">
            <span className="truncate text-sm font-semibold text-foreground">{projectName}</span>
            <Edit3 className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
          </button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onUndo} disabled={!canUndo}><Undo2 className={`h-4 w-4 ${canUndo ? '' : 'opacity-30'}`} /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onRedo} disabled={!canRedo}><Redo2 className={`h-4 w-4 ${canRedo ? '' : 'opacity-30'}`} /></Button>
        <Button size="icon" className="h-8 w-8 shrink-0 bg-primary hover:bg-primary/90" onClick={onExport}>
          <Download className="h-4 w-4" />
        </Button>
      </header>
    );
  }

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-2 border-b bg-card/95 backdrop-blur px-2 sm:px-4">
      <Button variant="ghost" size="icon" className="hidden md:inline-flex h-9 w-9" onClick={() => navigate('/dashboard')}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex min-w-0 items-center gap-2">
        {editing ? (
          <Input
            autoFocus
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            className="h-8 w-40 sm:w-56 text-sm font-semibold"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="group flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-muted/70"
          >
            <span className="truncate text-sm font-semibold text-foreground max-w-[140px] sm:max-w-[220px]">{projectName}</span>
            <Edit3 className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
          </button>
        )}
        <span className="hidden lg:inline text-[11px] text-muted-foreground">{artboardLabel}</span>
      </div>

      <Badge variant="secondary" className="hidden sm:inline-flex gap-1 rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
        <Check className="h-3 w-3" /> Saved
      </Badge>

      <div className="ml-1 hidden md:flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onUndo} disabled={!canUndo}><Undo2 className={`h-4 w-4 ${canUndo ? '' : 'opacity-30'}`} /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRedo} disabled={!canRedo}><Redo2 className={`h-4 w-4 ${canRedo ? '' : 'opacity-30'}`} /></Button>
      </div>

      <div className="flex-1" />

      <div className="hidden md:flex items-center gap-1 rounded-lg border bg-background px-1 py-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.max(25, zoom - 10))}>
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-[42px] text-center text-xs font-medium">{zoom}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.min(400, zoom + 10))}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Button variant={showGrid ? 'secondary' : 'ghost'} size="icon" className="hidden lg:inline-flex h-9 w-9" title="Grid" onClick={onToggleGrid}><Grid3x3 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="hidden lg:inline-flex h-9 w-9" title="Fit to screen" onClick={onFit}><Maximize2 className="h-4 w-4" /></Button>

      <AIQuickActionsMenu />
      <Button variant="outline" size="sm" className="h-9 gap-1.5 hidden sm:inline-flex" onClick={onPreview}>
        <Play className="h-3.5 w-3.5" /> Preview
      </Button>
      <Button size="sm" className="h-9 gap-1.5 bg-primary hover:bg-primary/90" onClick={onExport}>
        <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
      </Button>
      <Button size="sm" variant="secondary" className="h-9 gap-1.5 hidden sm:inline-flex" onClick={onPublish}>
        <Send className="h-3.5 w-3.5" /> Publish
      </Button>

      <Button variant="ghost" size="icon" className="hidden md:inline-flex h-9 w-9 relative">
        <HelpCircle className="h-4 w-4" />
      </Button>
      <button className="hidden md:inline-flex relative h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
        <Bell className="h-4 w-4" />
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">2</span>
      </button>
      <div className="hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-[11px] font-semibold text-white">U</div>

      <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={onToggleRight}>
        <PanelRight className="h-4 w-4" />
      </Button>
    </header>
  );
};

/* ---------- Templates Panel ---------- */
const TemplateThumb: React.FC<{ item: { id: number; title: string; bg: string; dark?: boolean }; ratio?: string }> = ({ item, ratio = 'aspect-square' }) => (
  <button className={`group relative ${ratio} w-full overflow-hidden rounded-lg border border-border/60 shadow-sm transition-transform hover:scale-[1.02]`}>
    <div className={`absolute inset-0 bg-gradient-to-br ${item.bg}`} />
    <div className="absolute inset-0 p-2 flex flex-col justify-end">
      <span className={`text-[9px] font-bold leading-tight drop-shadow ${item.dark ? 'text-slate-900' : 'text-white'}`}>
        {item.title}
      </span>
    </div>
  </button>
);

const TemplatesPanel: React.FC = () => {
  const [cat, setCat] = useState('All');
  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="px-3 py-2 border-b">
        <h2 className="text-sm font-semibold text-foreground">Templates</h2>
      </div>
      <div className="px-3 pt-2 pb-1 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search" className="pl-7 h-8 rounded-lg bg-muted/60 border-transparent text-xs" />
        </div>
        <div className="flex flex-wrap gap-1">
          {TEMPLATE_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={[
                'rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors',
                cat === c ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80',
              ].join(' ')}
            >
              {c}
            </button>
          ))}
        </div>
        <ScrollArea className="flex-1 min-h-0 px-3 py-2 space-y-4">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-foreground">Recommended</h3>
              <button className="text-[10px] text-primary hover:underline">See all</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5">
              {RECOMMENDED.map((t) => <TemplateThumb key={t.id} item={t} />)}
            </div>
          </section>
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-foreground">Instagram Post</h3>
              <button className="text-[10px] text-primary hover:underline">See all</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5">
              {INSTA_POST.map((t) => <TemplateThumb key={t.id} item={t} />)}
            </div>
          </section>
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-foreground">Instagram Story</h3>
              <button className="text-[10px] text-primary hover:underline">See all</button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
              {INSTA_STORY.map((t) => <TemplateThumb key={t.id} item={t} ratio="aspect-[9/16]" />)}
            </div>
          </section>
        </ScrollArea>
      </div>
    </div>
  );
};

/* ---------- Other Left Panels ---------- */
const SimplePanel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex h-full min-h-0 flex-col bg-card">
    <div className="p-4 pb-3 border-b">
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
    <ScrollArea className="flex-1 min-h-0"><div className="p-4">{children}</div></ScrollArea>
  </div>
);

/* ---------- Background Panel ---------- */
const BackgroundPanel: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const solidColors = [
    ['#000000','#555555','#888888','#BBBBBB','#DDDDDD','#FFFFFF'],
    ['#FF0000','#FF6B6B','#FF69B4','#FFB6C1','#E6E6FA','#800080'],
    ['#008080','#00CED1','#87CEEB','#0000FF','#4B0082','#000080'],
    ['#FFA500','#FFD700','#FFFF00','#00FF00','#008000','#006400'],
  ];
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#2D2D2D]">
      <div className="px-4 py-3 border-b border-[#3D3D3D]">
        <h2 className="text-base font-bold text-white">Background</h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888888]" />
          <input placeholder="Search backgrounds" className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-[#3D3D3D] border border-[#555555] text-[#888888] placeholder:text-[#888888] outline-none" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#666666] shrink-0 flex items-center justify-center bg-white/10">
            <X className="h-3 w-3 text-[#888888]" />
          </div>
          {['#CCCCCC','#555555','#1A1A1A','#8B0000','#FF69B4','#800080'].map((c) => (
            <button key={c} onClick={() => setSelectedColor(c)}
              className="w-8 h-8 rounded-full shrink-0 border border-white/10 hover:scale-105 transition-transform"
              style={{ backgroundColor: c }} />
          ))}
          <button className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[#888888]">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm font-semibold text-white mt-4 mb-2">Colours in this design</p>
        <div className="flex gap-1.5">
          <button className="w-8 h-8 rounded-full bg-[#3D3D3D] border-2 border-dashed border-[#666666] flex items-center justify-center">
            <Plus className="h-3 w-3 text-[#888888]" />
          </button>
          <button className="w-8 h-8 rounded-full bg-[#3D3D3D] border border-[#555555] flex items-center justify-center">
            <Pipette className="h-3.5 w-3.5 text-[#888888]" />
          </button>
          {['#FFFFFF','#8B4513','#000000'].map((c) => (
            <button key={c} className="w-8 h-8 rounded-full border border-white/10" style={{ backgroundColor: c }} />
          ))}
        </div>
        <p className="text-sm font-semibold text-white mt-4 mb-2">Default solid colours</p>
        {solidColors.map((row, ri) => (
          <div key={ri} className="grid grid-cols-6 gap-1.5 mb-1.5">
            {row.map((c) => (
              <button key={c} onClick={() => setSelectedColor(c)}
                className="aspect-square rounded-lg hover:ring-2 hover:ring-white hover:scale-105 transition-all"
                style={{ backgroundColor: c }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- Text Panel ---------- */
const TextPanel: React.FC<{ onAdd: (text: string, size: number, weight: string) => void }> = ({ onAdd }) => {
  const [search, setSearch] = useState('');
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#2D2D2D]">
      <div className="px-4 py-3 border-b border-[#3D3D3D]">
        <h2 className="text-base font-bold text-white">Text</h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888888]" />
          <input placeholder="Search fonts and combinations"
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-[#3D3D3D] border border-[#555555] text-[#888888] placeholder:text-[#888888] outline-none" />
        </div>
        <button onClick={() => onAdd('Add a heading', 36, 'bold')}
          className="w-full h-11 rounded-lg bg-[#6C63FF] text-white text-sm font-semibold flex items-center justify-center gap-2 mb-2 hover:bg-[#5B52E0]">
          <Type className="h-4 w-4" /> Add a text box
        </button>
        <button className="w-full h-11 rounded-lg bg-[#2D2D2D] border border-[#555555] text-white text-sm flex items-center justify-center gap-2 mb-4 hover:border-[#6C63FF]">
          <Sparkles className="h-4 w-4" /> AI Copy
        </button>
        <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">Default text styles</p>
        <button onClick={() => onAdd('Add a heading', 36, 'bold')}
          className="w-full h-[52px] rounded-lg bg-[#2D2D2D] flex items-center px-4 mb-1 hover:bg-[#3D3D3D] hover:border hover:border-[#555555]">
          <span className="text-2xl font-extrabold text-white">Add a heading</span>
        </button>
        <button onClick={() => onAdd('Add a subheading', 24, '600')}
          className="w-full h-11 rounded-lg bg-[#2D2D2D] flex items-center px-4 mb-1 hover:bg-[#3D3D3D] hover:border hover:border-[#555555]">
          <span className="text-lg font-semibold text-white">Add a subheading</span>
        </button>
        <button onClick={() => onAdd('Add a little bit of body text', 16, 'normal')}
          className="w-full h-10 rounded-lg bg-[#2D2D2D] flex items-center px-4 hover:bg-[#3D3D3D] hover:border hover:border-[#555555]">
          <span className="text-sm text-white">Add a little bit of body text</span>
        </button>
        <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mt-5 mb-2">Font combinations</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Coffee Break', style: 'text-green-400 italic text-lg' },
            { name: 'FIRE away', style: 'text-orange-400 font-bold text-lg' },
            { name: 'PIXEL DREAMS', style: 'text-purple-400 font-bold text-lg' },
            { name: 'Subscribe', style: 'text-blue-400 text-lg' },
          ].map((f) => (
            <button key={f.name}
              className="h-[100px] rounded-lg bg-[#2D2D2D] flex items-center justify-center hover:bg-[#3D3D3D]">
              <span className={f.style}>{f.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- Elements Panel ---------- */
const ElementsPanel: React.FC<{ onAdd: (t: 'rectangle' | 'circle') => void }> = ({ onAdd }) => {
  const sections = [
    { label: 'Lines & Shapes', items: [1,2,3,4,5,6] },
    { label: 'Graphics', items: [1,2,3,4,5,6] },
    { label: 'Stickers', items: [1,2,3,4,5] },
    { label: 'Charts', items: [1,2,3] },
    { label: 'Frames', items: [1,2,3,4] },
    { label: 'Grids', items: [1,2] },
  ];
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#2D2D2D]">
      <div className="px-4 py-3 border-b border-[#3D3D3D]">
        <h2 className="text-base font-bold text-white">Elements</h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888888]" />
          <input placeholder="Search elements"
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-[#3D3D3D] border border-[#555555] text-[#888888] placeholder:text-[#888888] outline-none" />
        </div>
        <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">Shapes</p>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4">
          {[SquareIcon, CircleIcon].map((Icon, i) => (
            <button key={i} className="w-10 h-10 rounded-lg bg-[#3D3D3D] flex items-center justify-center hover:bg-[#555555] shrink-0"
              onClick={() => onAdd(i === 0 ? 'rectangle' : 'circle')}>
              <Icon className="h-5 w-5 text-white" />
            </button>
          ))}
        </div>
        {sections.map((s) => (
          <div key={s.label} className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[#CCCCCC]">{s.label}</p>
              <span className="text-xs text-[#6C63FF]">See all →</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {s.items.map((_, i) => (
                <div key={i} className="w-[72px] h-[72px] rounded-lg bg-[#2D2D2D] shrink-0 hover:bg-[#3D3D3D] hover:border hover:border-[#555555] flex items-center justify-center cursor-pointer">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-[#555555] to-[#3D3D3D]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BrandKitPanel: React.FC = () => {
  const { data: kits } = useBrandKits();
  const active = kits?.find((k) => k.is_active) || kits?.[0];
  const { data: colors } = useBrandColors(active?.id);
  const { data: fonts } = useBrandFonts(active?.id);
  return (
    <SimplePanel title="Brand Kit">
      {!active ? (
        <p className="text-xs text-muted-foreground">No active brand kit. Create one from Brand Kit page.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold">Logo</p>
            <div className="aspect-video rounded-xl border bg-muted/40 flex items-center justify-center overflow-hidden">
              {active.logo_url ? <img src={active.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-muted-foreground">No logo</span>}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold">Colors</p>
            <div className="grid grid-cols-6 gap-2">
              {[active.primary_color, active.secondary_color, active.accent_color, ...(colors?.map((c) => c.hex) || [])].filter(Boolean).map((c, i) => (
                <div key={i} className="aspect-square rounded-lg border" style={{ background: c }} title={c} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold">Fonts</p>
            <div className="space-y-1.5">
              {fonts?.length ? fonts.map((f) => (
                <div key={f.id} className="rounded-lg border px-3 py-2 text-xs">{f.name}</div>
              )) : <p className="text-xs text-muted-foreground">No fonts.</p>}
            </div>
          </div>
          <Button className="w-full h-9 gap-1.5"><Wand2 className="h-3.5 w-3.5" /> Apply Brand</Button>
        </div>
      )}
    </SimplePanel>
  );
};

const LayersPanel: React.FC<{
  canvas: FabricCanvas | null;
  version: number;
  selected: any;
  onSelect: (o: any) => void;
  onChanged: () => void;
}> = ({ canvas, version, selected, onSelect, onChanged }) => {
  const objs = canvas?.getObjects() || [];
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const typeIcon = (type: string) => {
    if (type === 'textbox' || type === 'i-text') return <Type className="h-3.5 w-3.5" />;
    if (type === 'image' || type === 'video') return <ImageIcon className="h-3.5 w-3.5" />;
    return <Shapes className="h-3.5 w-3.5" />;
  };

  return (
    <SimplePanel title="Layers">
      {objs.length === 0 ? (
        <p className="text-xs text-muted-foreground">Layers will appear here as you add elements.</p>
      ) : (
        <div className="space-y-1">
          {[...objs].reverse().map((o: any, i) => {
            const realIdx = objs.length - 1 - i;
            const locked = isLocked(o);
            const hidden = o.visible === false;
            const isActive = selected === o;
            return (
              <div key={realIdx}
                onClick={() => {
                  if (!canvas) return;
                  canvas.setActiveObject(o);
                  canvas.requestRenderAll();
                  onSelect(o);
                }}
                className={`group flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 transition-all
                  ${dragIdx === i ? 'opacity-50 scale-[1.02] shadow-md' : ''}
                  ${hidden ? 'opacity-40' : ''}
                  ${isActive ? 'border-primary ring-1 ring-primary/40' : ''}
                `}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx === null || dragIdx === i) { setDragIdx(null); return; }
                  const from = objs.length - 1 - dragIdx;
                  const moved = objs[from];
                  reorderLayer(canvas, moved, realIdx);
                  setDragIdx(null);
                  onChanged();
                }}
                onDragEnd={() => setDragIdx(null)}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab active:cursor-grabbing shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="shrink-0 text-muted-foreground">{typeIcon(o.type)}</span>
                <span className="flex-1 truncate text-xs">{o.type === 'textbox' ? o.text?.slice(0, 24) || 'Text' : o.type}</span>
                <button onClick={(e) => { e.stopPropagation(); setVisible(canvas, o, hidden); onChanged(); }}
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted shrink-0">
                  {hidden ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setLocked(canvas, o, !locked); onChanged(); }}
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted shrink-0">
                  {locked ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : <Unlock className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteObject(canvas, o); onSelect(null); onChanged(); }}
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 shrink-0">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </SimplePanel>
  );
};

/* ---------- Canvas Sub-toolbar ---------- */
const CanvasSubToolbar: React.FC<{
  canvas: FabricCanvas | null;
  selected: any;
  onChanged: () => void;
  preset: string;
  onPresetChange: (v: string) => void;
  onOpenAnimate: () => void;
  onOpenPosition: () => void;
}> = ({ canvas, selected, onChanged, preset, onPresetChange, onOpenAnimate, onOpenPosition }) => {
  const act = (fn: () => void) => { if (!selected) { toast({ title: 'Select a layer first' }); return; } fn(); onChanged(); };
  const locked = isLocked(selected);
  return (
    <div className="hidden md:flex h-11 items-center gap-1 border-b bg-card/60 px-3 overflow-x-auto">
      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={onOpenAnimate}><Play className="h-3.5 w-3.5" /> Animate</Button>
      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={onOpenPosition}>Position</Button>
      <Separator orientation="vertical" className="h-5 mx-1" />
      <Button variant="ghost" size="icon" className="h-8 w-8" title="Center on canvas"
        onClick={() => act(() => { alignObject(canvas, selected, 'center-h'); alignObject(canvas, selected, 'center-v'); })}>
        <AlignVerticalJustifyCenter className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" title="Bring forward"
        onClick={() => act(() => moveLayer(canvas, selected, 'up'))}><MoveUp className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" title="Send backward"
        onClick={() => act(() => moveLayer(canvas, selected, 'down'))}><MoveDown className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className={`h-8 w-8 ${locked ? 'text-amber-500' : ''}`} title="Lock layer"
        onClick={() => act(() => setLocked(canvas, selected, true))}><Lock className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" title="Unlock layer"
        onClick={() => act(() => setLocked(canvas, selected, false))}><Unlock className="h-4 w-4" /></Button>
      <div className="flex-1" />
      <Select value={preset} onValueChange={onPresetChange}>
        <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(ARTBOARD_PRESETS).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

/* ---------- Canvas Stage ---------- */
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;

const fitZoom = (isMobile: boolean, containerWidth: number, containerHeight: number, w: number, h: number): number => {
  const pad = isMobile ? 32 : 48;
  const availW = Math.max(40, containerWidth - pad);
  const availH = Math.max(40, containerHeight - pad);
  return Math.min(availW / w, availH / h, 1) * 100;
};


  const CanvasStage: React.FC<{
  onCanvasReady: (c: FabricCanvas) => void;
  onSelection: (o: any) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  seedDefault: boolean;
  onCanvasWrapperRef?: (el: HTMLDivElement | null) => void;
  isMobile: boolean;
  artboard: { width: number; height: number };
  showGrid: boolean;
  fitToken: number;
  imageStatuses?: ImageLayerStatus[];
  onRetryImages?: () => void;
  retryingImages?: boolean;
}> = ({ onCanvasReady, onSelection, zoom, onZoomChange, seedDefault, onCanvasWrapperRef, isMobile, artboard, showGrid, fitToken, imageStatuses = [], onRetryImages, retryingImages }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [loading, setLoading] = useState(true);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const canvasRef = useRef<FabricCanvas | null>(null);

  useEffect(() => {
    onCanvasWrapperRef?.(wrapperRef.current);
  }, [onCanvasWrapperRef]);

  // Auto-fit canvas to viewport on mount, on artboard change, on "Fit" requests
  // and whenever the viewport itself resizes (rotation, panel toggles, mobile).
  const applyFit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    const z = fitZoom(isMobile, rect.width, rect.height, artboard.width, artboard.height);
    onZoomChange(Math.max(5, Math.round(z)));
  }, [isMobile, artboard.width, artboard.height, onZoomChange]);

  useEffect(() => {
    applyFit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artboard.width, artboard.height, fitToken, isMobile]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => applyFit());
    ro.observe(el);
    window.addEventListener('resize', applyFit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', applyFit);
    };
  }, [applyFit]);


  // Keep the Fabric surface in sync with the selected artboard preset
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.setDimensions({ width: artboard.width, height: artboard.height });
    c.requestRenderAll();
  }, [artboard.width, artboard.height]);

  useEffect(() => {
    if (initialized.current || !ref.current) return;
    initialized.current = true;
    const c = new FabricCanvas(ref.current, {
      width: artboard.width,
      height: artboard.height,
      backgroundColor: '#ffffff',
    });
    canvasRef.current = c;

    c.on('object:added', (e: any) => {
      if (e.target) {
        e.target.set({
          cornerSize: 10,
          cornerColor: 'white',
          cornerStrokeColor: '#6B21A8',
          cornerStyle: 'rect',
          borderColor: '#6B21A8',
          borderScaleFactor: 1.5,
          transparentCorners: false,
          padding: 2,
        });
      }
    });

    if (seedDefault) {
      // Empty canvas — welcome overlay shown in renderCanvas instead
    }
    c.on('selection:created', (e: any) => onSelection(e.selected?.[0]));
    c.on('selection:updated', (e: any) => onSelection(e.selected?.[0]));
    c.on('selection:cleared', () => onSelection(null));
    onCanvasReady(c);
    setTimeout(() => setLoading(false), 150);
  }, [onCanvasReady, onSelection, seedDefault]);

  // -- Gesture handlers --
  const pinchDist = useRef(0);
  const lastTap = useRef(0);
  const MIN_ZOOM = 10;
  const MAX_ZOOM = 400;
  const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

  // Native, non-passive wheel listener: React's onWheel is passive so
  // preventDefault() would be ignored and the page would scroll behind.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return; // plain scroll stays scroll
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      onZoomChange(Math.round(clampZoom(zoomRef.current * Math.exp(-dy * 0.0015))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onZoomChange]);


  const handleDoubleTap = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      const c = canvasRef.current;
      if (!c) return;
      const obj = c.findTarget(e as any);
      if (obj && (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text')) {
        c.setActiveObject(obj);
        (obj as any).enterEditing();
      }
    }
    lastTap.current = now;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
    handleDoubleTap(e);
  }, [handleDoubleTap]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    const delta = dist - pinchDist.current;
    pinchDist.current = dist;
    onZoomChange(Math.round(clampZoom(zoomRef.current + delta * 0.5)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onZoomChange]);

  const pendingImages = imageStatuses.filter((s) => s.status === 'loading');
  const failedImages = imageStatuses.filter((s) => s.status === 'failed');

  return (
    <div ref={containerRef} className="canvas-viewport relative flex-1 min-w-0 flex items-center justify-center overflow-hidden select-none p-4 sm:p-6"
      style={{ backgroundColor: '#1A1A1A', boxSizing: 'border-box' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >

      {/* Loading skeleton */}
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3" style={{ backgroundColor: '#1A1A1A' }}>
          <div className="h-10 w-10 animate-pulse rounded-xl" style={{ backgroundColor: '#2D2D2D' }} />
          <div className="h-3 w-32 animate-pulse rounded-full" style={{ backgroundColor: '#2D2D2D' }} />
          <div className="h-2 w-24 animate-pulse rounded-full" style={{ backgroundColor: '#2D2D2D' }} />
        </div>
      )}
      <div
        ref={wrapperRef}
        className="canvas-card relative bg-white shrink-0 overflow-hidden"
        style={{
          width: artboard.width,
          height: artboard.height,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.4)',
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'center center',
        }}
      >

        <canvas ref={ref} className="block" />
        {showGrid && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(108,99,255,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(108,99,255,0.25) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
        )}
      </div>

      {/* Per-layer image loading / failure state */}
      {(pendingImages.length > 0 || failedImages.length > 0) && (
        <div className="absolute left-3 top-3 z-30 max-w-[240px] rounded-xl border border-white/10 bg-black/70 p-2 text-[11px] text-white backdrop-blur">
          {pendingImages.length > 0 && (
            <div className="flex items-center gap-2 px-1 py-0.5 text-white/80">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Loading {pendingImages.length} image{pendingImages.length > 1 ? 's' : ''}…
            </div>
          )}
          {failedImages.length > 0 && (
            <div className="space-y-1">
              <div className="px-1 py-0.5 font-medium text-amber-300">
                {failedImages.length} image{failedImages.length > 1 ? 's' : ''} failed to load
              </div>
              <ul className="max-h-24 space-y-0.5 overflow-auto px-1 text-white/60">
                {failedImages.slice(0, 4).map((s) => (
                  <li key={s.id} className="truncate">• {s.name} ({s.attempts} tries)</li>
                ))}
              </ul>
              <Button size="sm" variant="secondary" className="h-6 w-full text-[11px]" disabled={retryingImages} onClick={onRetryImages}>
                <RefreshCw className={`mr-1 h-3 w-3 ${retryingImages ? 'animate-spin' : ''}`} />
                {retryingImages ? 'Retrying…' : 'Retry images'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Zoom controls with one-click fit-to-screen */}
      <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1 rounded-full border border-white/10 bg-black/70 px-1.5 py-1 text-white backdrop-blur">
        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/10" onClick={() => onZoomChange(Math.round(clampZoom(zoom / 1.2)))} aria-label="Zoom out">
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <button className="min-w-[44px] text-center text-[11px] font-medium hover:text-primary" onClick={() => onZoomChange(100)} title="Reset to 100%">
          {Math.round(zoom)}%
        </button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/10" onClick={() => onZoomChange(Math.round(clampZoom(zoom * 1.2)))} aria-label="Zoom in">
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px] text-white hover:bg-white/10" onClick={applyFit} aria-label="Fit to screen">
          <Maximize2 className="h-3 w-3" /> Fit
        </Button>
      </div>
    </div>
  );
};


/* ---------- Timeline ---------- */
const TL_LABEL_W = 110;

const trackMetaFor = (obj: any) => {
  const t = obj?.type;
  if (t === 'textbox' || t === 'text' || t === 'i-text')
    return { icon: Type, color: '#1B7A6B', label: (obj.text || 'Text').toString().slice(0, 24) || 'Text' };
  if (t === 'image') return { icon: ImageIcon, color: '#2563A8', label: obj.name || 'Image' };
  if (t === 'video') return { icon: Video, color: '#8B5CF6', label: obj.name || 'Video' };
  if (t === 'audio') return { icon: Music, color: '#B45309', label: obj.name || 'Audio' };
  if (t === 'group') return { icon: LayersIcon, color: '#4B5563', label: obj.name || 'Group' };
  return { icon: Shapes, color: '#B45309', label: obj.name || (t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Shape') };
};

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const dec = Math.floor((s % 1) * 10);
  return `${m}:${sec.toString().padStart(2, '0')}.${dec}`;
};

const Timeline: React.FC<{
  canvas: FabricCanvas | null;
  selected: any;
  onSelect: (obj: any) => void;
  version: number;
}> = ({ canvas, selected, onSelect, version }) => {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [scale, setScale] = useState(50); // timeline zoom
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  const objects: any[] = canvas ? (canvas.getObjects() as any[]) : [];

  const tracks = useMemo(() => {
    return objects.map((obj, i) => {
      const meta = trackMetaFor(obj);
      const start = typeof obj.animStart === 'number' ? obj.animStart : 0;
      const dur = typeof obj.animDuration === 'number' ? obj.animDuration : 5;
      return { obj, id: obj.id || `obj-${i}`, ...meta, start, duration: dur };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, version]);

  const total = Math.max(10, ...tracks.map((t) => t.start + t.duration));

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    lastTsRef.current = performance.now();
    const loop = (ts: number) => {
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((prev) => {
        const next = prev + dt;
        if (next >= total) { setPlaying(false); return total; }
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, total]);

  const pxPerSec = 0.4 + (scale / 100) * 1.6; // multiplier over base width
  const trackWidth = `${100 * pxPerSec}%`;

  const ticks = useMemo(() => {
    const step = total > 60 ? 10 : total > 30 ? 5 : total > 15 ? 2 : 1;
    const out: number[] = [];
    for (let s = 0; s <= total; s += step) out.push(s);
    return out;
  }, [total]);

  const seekFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setTime(ratio * total);
  };

  const selectObj = (obj: any) => {
    if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    onSelect(obj);
  };

  return (
    <div className="border-t" style={{ backgroundColor: '#1A1A1A', borderTopColor: '#2D2D2D' }}>
      <div className="flex h-9 items-center gap-3 px-3 border-b" style={{ borderColor: '#2D2D2D' }}>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-6 w-6 text-white" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <span className="text-xs text-white font-mono">{fmtTime(time)}</span>
          <span className="text-xs font-mono" style={{ color: '#666666' }}>/ {fmtTime(total)}</span>
        </div>
        <span className="text-[11px]" style={{ color: '#666666' }}>
          {tracks.length} {tracks.length === 1 ? 'layer' : 'layers'}
        </span>
        <div className="flex-1" />
        <span className="text-[10px]" style={{ color: '#666666' }}>Zoom</span>
        <Slider value={[scale]} onValueChange={(v) => setScale(v[0])} max={100} className="w-24" />
      </div>

      {/* Ruler */}
      <div className="flex border-b" style={{ borderColor: '#2D2D2D' }}>
        <div className="shrink-0 border-r" style={{ width: TL_LABEL_W, borderColor: '#2D2D2D' }} />
        <div className="relative flex-1 overflow-hidden">
          <div className="relative h-7 cursor-pointer" style={{ width: trackWidth }} onClick={seekFromEvent}>
            {ticks.map((s) => (
              <span
                key={s}
                className="absolute bottom-1 text-[10px] -translate-x-1/2"
                style={{ left: `${(s / total) * 100}%`, color: '#666666' }}
              >
                {s}s
              </span>
            ))}
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{ left: `${(time / total) * 100}%`, backgroundColor: '#EF4444' }}
            />
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="max-h-[100px] overflow-auto">
        {tracks.length === 0 && (
          <div className="px-3 py-4 text-xs" style={{ color: '#666666' }}>
            No layers yet — add text, images or shapes to the canvas to see them here.
          </div>
        )}
        {tracks.map((tr) => {
          const Icon = tr.icon;
          const isSel = selected === tr.obj;
          return (
            <div key={tr.id} className="flex items-stretch border-b h-9" style={{ borderColor: '#222222' }}>
              <button
                onClick={() => selectObj(tr.obj)}
                className="shrink-0 flex items-center gap-1.5 px-3 border-r text-xs text-left truncate"
                style={{
                  width: TL_LABEL_W,
                  color: isSel ? '#FFFFFF' : '#CCCCCC',
                  borderColor: '#2D2D2D',
                  backgroundColor: isSel ? '#242424' : 'transparent',
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: '#888888' }} />
                <span className="truncate">{tr.label}</span>
              </button>
              <div className="relative flex-1 overflow-hidden">
                <div className="relative h-full" style={{ width: trackWidth }}>
                  <button
                    onClick={() => selectObj(tr.obj)}
                    className="absolute top-1 bottom-1 rounded-md flex items-center px-2 text-[10px] font-medium text-white shadow-sm overflow-hidden"
                    style={{
                      left: `${(tr.start / total) * 100}%`,
                      width: `${(tr.duration / total) * 100}%`,
                      backgroundColor: tr.color,
                      outline: isSel ? '1px solid rgba(255,255,255,0.6)' : 'none',
                    }}
                  >
                    <span className="truncate">{tr.label}</span>
                  </button>
                  <div
                    className="absolute top-0 bottom-0 w-px pointer-events-none"
                    style={{ left: `${(time / total) * 100}%`, backgroundColor: 'rgba(239,68,68,0.7)' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-2 px-3 py-2">
          <button className="flex items-center gap-1.5 border border-dashed rounded-md px-3 py-1.5 text-xs hover:text-white hover:border-white/30" style={{ borderColor: '#444444', color: '#888888' }}>
            <Plus className="h-3 w-3" /> Add media/blank
          </button>
          <span className="text-xs" style={{ color: '#666666' }}>or drag and drop media</span>
          <div className="flex-1" />
          <button className="flex items-center gap-1.5 text-xs hover:text-white" style={{ color: '#888888' }}>
            <Music className="h-3.5 w-3.5" /> Add audio
          </button>
        </div>
      </div>
    </div>

  );
};

/* ---------- Contextual Toolbar Configs ---------- */
type ToolItem = { id: string; label: string; icon: React.FC<{ className?: string }> };

const CREATE_TOOLS: ToolItem[] = [
  { id: 'templates', label: 'Templates', icon: Layout },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'brand', label: 'Brand', icon: Sparkles },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'ai-studio', label: 'AI Studio', icon: Wand2 },
  { id: 'background', label: 'Bg', icon: Palette },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
];

const TEXT_TOOLS: ToolItem[] = [
  { id: 'edit-text', label: 'Edit', icon: Edit3 },
  { id: 'font', label: 'Font', icon: Type },
  { id: 'text-style', label: 'Styles', icon: Bold },
  { id: 'font-size', label: 'Size', icon: Plus },
  { id: 'colour', label: 'Colour', icon: Palette },
  { id: 'spacing', label: 'Spacing', icon: AlignLeft },
  { id: 'effects', label: 'Effects', icon: Zap },
  { id: 'animate', label: 'Animate', icon: Play },
  { id: 'position', label: 'Position', icon: MoveUp },
  { id: 'opacity', label: 'Opacity', icon: Eye },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

const IMAGE_TOOLS: ToolItem[] = [
  { id: 'replace', label: 'Replace', icon: RefreshCw },
  { id: 'crop', label: 'Crop', icon: Maximize2 },
  { id: 'filters', label: 'Filters', icon: Palette },
  { id: 'adjust', label: 'Adjust', icon: Sun },
  { id: 'effects', label: 'Effects', icon: Zap },
  { id: 'bg-remove', label: 'Bg Remove', icon: Wand2 },
  { id: 'ai-enhance', label: 'AI Enhance', icon: Sparkles },
  { id: 'opacity', label: 'Opacity', icon: Eye },
  { id: 'animate', label: 'Animate', icon: Play },
  { id: 'position', label: 'Position', icon: MoveUp },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

const SHAPE_TOOLS: ToolItem[] = [
  { id: 'fill', label: 'Fill', icon: Palette },
  { id: 'border', label: 'Border', icon: SquareIcon },
  { id: 'radius', label: 'Radius', icon: Box },
  { id: 'shadow', label: 'Shadow', icon: Moon },
  { id: 'opacity', label: 'Opacity', icon: Eye },
  { id: 'animate', label: 'Animate', icon: Play },
  { id: 'position', label: 'Position', icon: MoveUp },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
];

const VIDEO_TOOLS: ToolItem[] = [
  { id: 'trim', label: 'Trim', icon: Scissors },
  { id: 'split', label: 'Split', icon: Scissors },
  { id: 'speed', label: 'Speed', icon: Zap },
  { id: 'volume', label: 'Volume', icon: Volume2 },
  { id: 'captions', label: 'Captions', icon: Type },
  { id: 'filters', label: 'Filters', icon: Palette },
  { id: 'transitions', label: 'Trans', icon: ChevronRight },
  { id: 'animate', label: 'Animate', icon: Play },
  { id: 'position', label: 'Position', icon: MoveUp },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
];

const MULTI_TOOLS: ToolItem[] = [
  { id: 'group', label: 'Group', icon: LayersIcon },
  { id: 'align', label: 'Align', icon: AlignVerticalJustifyCenter },
  { id: 'distribute', label: 'Distribute', icon: Grid3x3 },
  { id: 'duplicate', label: 'Dup', icon: Copy },
  { id: 'lock', label: 'Lock', icon: Lock },
  { id: 'opacity', label: 'Opacity', icon: Eye },
  { id: 'position', label: 'Position', icon: MoveUp },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
];

const getToolsForSelection = (selected: any): ToolItem[] => {
  if (!selected) return CREATE_TOOLS;
  const type = selected.type;
  if (type === 'textbox' || type === 'text' || type === 'i-text') return TEXT_TOOLS;
  if (type === 'image' || type === 'video') return IMAGE_TOOLS;
  if (type === 'rect' || type === 'circle' || type === 'ellipse' || type === 'triangle' || type === 'polygon') return SHAPE_TOOLS;
  return CREATE_TOOLS;
};

const AI_ACTIONS: Record<string, { id: string; label: string }[]> = {
  text: [
    { id: 'rewrite', label: 'Rewrite Text' },
    { id: 'shorten', label: 'Shorten' },
    { id: 'expand', label: 'Expand' },
    { id: 'improve-cta', label: 'Improve CTA' },
    { id: 'translate', label: 'Translate' },
    { id: 'brand-tone', label: 'Brand Tone' },
    { id: 'variants', label: 'Generate Variants' },
  ],
  image: [
    { id: 'remove-bg', label: 'Remove Background' },
    { id: 'replace', label: 'Replace Object' },
    { id: 'extend', label: 'Extend Image' },
    { id: 'upscale', label: 'Upscale' },
    { id: 'relight', label: 'Relight' },
    { id: 'recolor', label: 'Recolor' },
    { id: 'generate-similar', label: 'Generate Similar' },
  ],
  video: [
    { id: 'captions', label: 'Generate Captions' },
    { id: 'remove-silence', label: 'Remove Silence' },
    { id: 'highlights', label: 'Auto Highlights' },
    { id: 'ai-voice', label: 'AI Voice' },
    { id: 'b-roll', label: 'Generate B-roll' },
    { id: 'improve-audio', label: 'Improve Audio' },
  ],
  default: [
    { id: 'create', label: 'Generate Design' },
    { id: 'replace-image', label: 'Replace Image' },
    { id: 'write-copy', label: 'Write Copy' },
    { id: 'remove-bg', label: 'Remove Background' },
    { id: 'resize', label: 'Resize' },
    { id: 'improve-layout', label: 'Improve Layout' },
    { id: 'brand-this', label: 'Brand This' },
    { id: 'animate', label: 'Animate' },
  ],
};

const getAiActions = (selected: any) => {
  if (!selected) return AI_ACTIONS.default;
  const type = selected.type;
  if (type === 'textbox' || type === 'text' || type === 'i-text') return AI_ACTIONS.text;
  if (type === 'image') return AI_ACTIONS.image;
  if (type === 'video') return AI_ACTIONS.video;
  return AI_ACTIONS.default;
};

/* ---------- Contextual Toolbar (mobile) ---------- */
const ContextualToolbar: React.FC<{
  tools: ToolItem[];
  active: string | null;
  onToolTap: (id: string) => void;
}> = ({ tools, active, onToolTap }) => (
  <nav className="flex items-center gap-0.5 overflow-x-auto px-2 py-1.5 border-t bg-card/95 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {tools.map((t) => {
      const Icon = t.icon;
      const isActive = active === t.id;
      return (
        <button key={t.id} onClick={() => onToolTap(t.id)}
          className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 transition-colors ${
            isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
          }`}>
          <Icon className="h-5 w-5" />
          <span className="text-[8px] font-medium whitespace-nowrap">{t.label}</span>
        </button>
      );
    })}
  </nav>
);

/* ---------- Contextual Tool Sheet Panels ---------- */
const FontToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const update = (prop: string, val: any) => { if (!selected || !canvas) return; selected.set(prop, val); canvas.renderAll(); };
  const fonts = ['Poppins','Inter','Roboto','Montserrat','Lato','Playfair Display','Bebas Neue'];
  return (
    <div className="space-y-3">
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search fonts" className="pl-8 h-9 rounded-xl bg-muted/60 border-transparent text-xs" /></div>
      <p className="text-xs font-semibold text-muted-foreground">Brand Fonts</p>
      <div className="flex flex-wrap gap-2">{['Poppins','Inter'].map(f => <button key={f} onClick={() => update('fontFamily', f)} className={`rounded-lg border px-3 py-2 text-xs ${selected?.fontFamily === f ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}>{f}</button>)}</div>
      <p className="text-xs font-semibold text-muted-foreground">All Fonts</p>
      <div className="grid grid-cols-2 gap-2">
        {fonts.map(f => <button key={f} onClick={() => update('fontFamily', f)} className={`rounded-lg border px-3 py-2 text-xs text-left ${selected?.fontFamily === f ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`} style={{ fontFamily: f }}>{f}</button>)}
      </div>
    </div>
  );
};

const ColorToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const update = (prop: string, val: any) => { if (!selected || !canvas) return; selected.set(prop, val); canvas.renderAll(); };
  const colors = ['#FF0000','#FF6B6B','#FF69B4','#800080','#008080','#0000FF','#FFA500','#FFD700','#00FF00','#008000','#000000','#555555','#888888','#BBBBBB','#DDDDDD','#FFFFFF'];
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground">Brand Colours</p>
      <div className="flex gap-2">{['#6C63FF','#FF6B6B','#00C9A7'].map(c => <button key={c} onClick={() => update('fill', c)} className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: c }} />)}</div>
      <p className="text-xs font-semibold text-muted-foreground">Recent</p>
      <div className="flex gap-2">{['#FFC107','#8b5cf6','#ffffff'].map(c => <button key={c} onClick={() => update('fill', c)} className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: c }} />)}</div>
      <p className="text-xs font-semibold text-muted-foreground">Palette</p>
      <div className="grid grid-cols-8 gap-1.5">{colors.map(c => <button key={c} onClick={() => update('fill', c)} className="aspect-square rounded-lg border border-border" style={{ backgroundColor: c }} />)}</div>
      <div className="flex items-center gap-2 rounded-xl border px-3 py-2"><input type="color" value={selected?.fill || '#000000'} onChange={(e) => update('fill', e.target.value)} className="h-6 w-6 rounded cursor-pointer border" /><span className="text-xs font-mono uppercase">{selected?.fill || '#000000'}</span></div>
    </div>
  );
};

const AnimateToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = () => {
  const animations = ['None','Fade','Rise','Typewriter','Pop','Bounce','Slide'];
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground">Entrance</p>
      <div className="grid grid-cols-4 gap-2">{animations.map(a => <button key={a} className={`rounded-xl border px-3 py-4 text-xs font-medium text-center ${a === 'None' ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}>{a}</button>)}</div>
      <div className="grid grid-cols-2 gap-3">
        <div><p className="mb-1 text-xs text-muted-foreground">Duration</p><div className="flex items-center gap-2"><Slider value={[50]} max={100} className="flex-1" /><span className="text-xs w-10 text-right">0.5s</span></div></div>
        <div><p className="mb-1 text-xs text-muted-foreground">Delay</p><div className="flex items-center gap-2"><Slider value={[0]} max={100} className="flex-1" /><span className="text-xs w-10 text-right">0s</span></div></div>
      </div>
    </div>
  );
};

const EffectsToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const update = (prop: string, val: any) => { if (!selected || !canvas) return; selected.set(prop, val); canvas.renderAll(); };
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {[{ l: 'Shadow', key: 'shadow' }, { l: 'Outline', key: 'outline' }, { l: 'Glow', key: 'glow' }].map(e => (
          <div key={e.key} className="flex items-center justify-between rounded-lg border px-3 py-2"><span className="text-xs font-medium">{e.l}</span><Switch defaultChecked={e.key === 'shadow'} /></div>
        ))}
      </div>
      <div><p className="mb-2 text-xs text-muted-foreground">Opacity</p><div className="flex items-center gap-3"><Slider value={[Math.round((selected?.opacity ?? 1) * 100)]} onValueChange={([v]) => update('opacity', v / 100)} max={100} /><span className="text-xs w-10 text-right">{Math.round((selected?.opacity ?? 1) * 100)}%</span></div></div>
    </div>
  );
};

const PositionToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const update = (prop: string, val: any) => { if (!selected || !canvas) return; selected.set(prop, val); canvas.renderAll(); };
  return (
    <div className="grid grid-cols-2 gap-3">
      <div><p className="mb-1 text-xs text-muted-foreground">X</p><Input type="number" className="h-9" value={Math.round(selected?.left || 0)} onChange={(e) => update('left', parseInt(e.target.value))} /></div>
      <div><p className="mb-1 text-xs text-muted-foreground">Y</p><Input type="number" className="h-9" value={Math.round(selected?.top || 0)} onChange={(e) => update('top', parseInt(e.target.value))} /></div>
      <div><p className="mb-1 text-xs text-muted-foreground">Rotation</p><Input type="number" className="h-9" value={Math.round(selected?.angle || 0)} onChange={(e) => update('angle', parseInt(e.target.value))} /></div>
      <div><p className="mb-1 text-xs text-muted-foreground">Scale</p><Input type="number" step={0.1} className="h-9" value={selected?.scaleX || 1} onChange={(e) => { update('scaleX', parseFloat(e.target.value)); update('scaleY', parseFloat(e.target.value)); }} /></div>
    </div>
  );
};

const SpacingToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const update = (prop: string, val: any) => { if (!selected || !canvas) return; selected.set(prop, val); canvas.renderAll(); };
  return (
    <div className="space-y-3">
      <div><p className="mb-1 text-xs text-muted-foreground">Line Height</p><Input type="number" step={0.1} className="h-9" value={selected?.lineHeight || 1.2} onChange={(e) => update('lineHeight', parseFloat(e.target.value))} /></div>
      <div><p className="mb-1 text-xs text-muted-foreground">Letter Spacing</p><div className="flex items-center gap-2"><Slider value={[0]} max={100} className="flex-1" /><span className="text-xs w-10 text-right">0%</span></div></div>
      <div><p className="mb-1 text-xs text-muted-foreground">Padding</p><Input type="number" className="h-9" defaultValue={0} /></div>
    </div>
  );
};

const FillToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = (props) => <ColorToolPanel {...props} />;

const TextEditToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const update = (prop: string, val: any) => { if (!selected || !canvas) return; selected.set(prop, val); canvas.renderAll(); };
  return (
    <div className="space-y-3">
      <div><p className="mb-1 text-xs text-muted-foreground">Text</p><textarea className="w-full rounded-xl border bg-background px-3 py-2 text-sm resize-none h-20" value={selected?.text || ''} onChange={(e) => update('text', e.target.value)} /></div>
      <div className="grid grid-cols-4 gap-1">
        {[
          { icon: Bold, key: 'fontWeight', toggle: { on: 'bold', off: 'normal' } },
          { icon: Italic, key: 'fontStyle', toggle: { on: 'italic', off: 'normal' } },
          { icon: Underline, key: 'underline', toggle: { on: true, off: false } },
        ].map(({ icon: Icon, key, toggle }) => (
          <button key={key} onClick={() => update(key, selected?.[key] === toggle.on ? toggle.off : toggle.on)}
            className={`flex h-9 items-center justify-center rounded-lg border ${selected?.[key] === toggle.on ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
            <Icon className="h-4 w-4" />
          </button>
        ))}
        {[
          { icon: AlignLeft, key: 'textAlign', val: 'left' },
          { icon: AlignCenter, key: 'textAlign', val: 'center' },
          { icon: AlignRight, key: 'textAlign', val: 'right' },
        ].map(({ icon: Icon, key, val }) => (
          <button key={val} onClick={() => update(key, val)}
            className={`flex h-9 items-center justify-center rounded-lg border ${selected?.textAlign === val ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
};

const TextStyleToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const update = (prop: string, val: any) => { if (!selected || !canvas) return; selected.set(prop, val); canvas.renderAll(); };
  return (
    <div className="space-y-2">
      {[
        { label: 'Heading', size: 36, weight: 'bold' },
        { label: 'Subheading', size: 24, weight: '600' },
        { label: 'Body', size: 16, weight: 'normal' },
        { label: 'Small', size: 12, weight: 'normal' },
      ].map(s => (
        <button key={s.label} onClick={() => { update('fontSize', s.size); update('fontWeight', s.weight); }}
          className="w-full rounded-lg border px-4 py-3 text-left hover:bg-muted transition">
          <span className="text-xs font-semibold">{s.label}</span>
          <span className="text-[10px] text-muted-foreground ml-2">{s.size}px · {s.weight}</span>
        </button>
      ))}
    </div>
  );
};

const OpacityToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const update = (prop: string, val: any) => { if (!selected || !canvas) return; selected.set(prop, val); canvas.renderAll(); };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3"><Slider value={[Math.round((selected?.opacity ?? 1) * 100)]} onValueChange={([v]) => update('opacity', v / 100)} max={100} className="flex-1" /><span className="text-lg font-semibold min-w-[48px] text-right">{Math.round((selected?.opacity ?? 1) * 100)}%</span></div>
      <div className="grid grid-cols-4 gap-2">
        {[0,25,50,75,100].map(v => <button key={v} onClick={() => update('opacity', v/100)} className={`rounded-lg border py-2 text-xs text-center ${Math.round((selected?.opacity ?? 1) * 100) === v ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}>{v}%</button>)}
      </div>
    </div>
  );
};

const renderToolSheet = (toolId: string, selected: any, canvas: FabricCanvas | null): React.ReactNode => {
  const props = { selected, canvas };
  switch (toolId) {
    case 'font': return <FontToolPanel {...props} />;
    case 'colour': case 'fill': return <ColorToolPanel {...props} />;
    case 'animate': return <AnimateToolPanel {...props} />;
    case 'effects': return <EffectsToolPanel {...props} />;
    case 'position': return <PositionToolPanel {...props} />;
    case 'spacing': return <SpacingToolPanel {...props} />;
    case 'edit-text': return <TextEditToolPanel {...props} />;
    case 'text-style': return <TextStyleToolPanel {...props} />;
    case 'font-size': return <FontToolPanel {...props} />;
    case 'opacity': return <OpacityToolPanel {...props} />;
    case 'border': return <FillToolPanel {...props} />;
    default: return <p className="text-xs text-muted-foreground">Select an option above.</p>;
  }
};

/* ---------- Bottom Sheet (mobile, slide-up) ---------- */
const MobileBottomSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  label: string;
}> = ({ open, onClose, children, label }) => {
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  useEffect(() => {
    if (open) { setVisible(true); return; }
    const timer = setTimeout(() => setVisible(false), 300);
    return () => clearTimeout(timer);
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY.current - e.changedTouches[0].clientY < -80) onClose();
  };

  if (!visible && !open) return null;

  return (
    <div
      ref={panelRef}
      className={`border-t bg-card shadow-2xl overflow-y-auto transition-all duration-300 ease-out ${
        open ? 'translate-y-0 max-h-[45vh]' : 'translate-y-full max-h-0'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag handle */}
      <div className="flex items-center justify-center py-2 sticky top-0 bg-card z-10">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>
      {/* Header with close */}
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Content */}
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );
};

/* ---------- Right Properties Panel ---------- */
const RightPanel: React.FC<{
  selected: any;
  canvas: FabricCanvas | null;
  onClose?: () => void;
}> = ({ selected, canvas, onClose }) => {
  const [, bump] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const type = String(selected?.type ?? '').toLowerCase();
  const isText = type === 'textbox' || type === 'text' || type === 'i-text';
  const isImage = type === 'image';
  const isShape = type === 'rect' || type === 'circle' || type === 'triangle' || type === 'ellipse';

  const update = (prop: string, val: any) => {
    if (!selected || !canvas) return;
    selected.set(prop, val);
    selected.setCoords?.();
    canvas.requestRenderAll();
    bump((n) => n + 1);
  };

  const updateMany = (props: Record<string, any>) => {
    if (!selected || !canvas) return;
    selected.set(props);
    selected.setCoords?.();
    canvas.requestRenderAll();
    bump((n) => n + 1);
  };

  const setEffect = (kind: 'shadow' | 'outline' | 'glow', on: boolean) => {
    if (!selected || !canvas) return;
    if (kind === 'outline') {
      updateMany(on ? { stroke: '#000000', strokeWidth: 2 } : { strokeWidth: 0 });
      return;
    }
    if (!on) { update('shadow', null); return; }
    update('shadow', new Shadow(
      kind === 'glow'
        ? { color: (selected.fill as string) || '#ffffff', blur: 24, offsetX: 0, offsetY: 0 }
        : { color: 'rgba(0,0,0,0.35)', blur: 12, offsetX: 0, offsetY: 6 },
    ));
  };

  const replaceImage = async (file: File) => {
    if (!canvas || !selected) return;
    const url = URL.createObjectURL(file);
    try {
      const img: any = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      const targetW = (selected.width || 0) * (selected.scaleX || 1);
      const targetH = (selected.height || 0) * (selected.scaleY || 1);
      img.set({
        left: selected.left, top: selected.top, angle: selected.angle,
        originX: selected.originX, originY: selected.originY,
        scaleX: targetW ? targetW / (img.width || 1) : 1,
        scaleY: targetH ? targetH / (img.height || 1) : 1,
        name: selected.name,
      });
      const idx = canvas.getObjects().indexOf(selected);
      canvas.remove(selected);
      canvas.add(img);
      if (idx >= 0) (canvas as any).moveObjectTo?.(img, idx);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    } catch {
      toast({ title: 'Could not load image', description: 'Try a different file.', variant: 'destructive' });
    }
  };

  const width = Math.round((selected?.width || 0) * (selected?.scaleX || 1));
  const height = Math.round((selected?.height || 0) * (selected?.scaleY || 1));
  const setWidth = (w: number) => update('scaleX', (w || 1) / (selected.width || 1));
  const setHeight = (h: number) => update('scaleY', (h || 1) / (selected.height || 1));

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-card border-l">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-base font-semibold">{isText ? 'Text' : isImage ? 'Image' : selected ? 'Properties' : 'Design'}</h2>
        {onClose && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>}
      </div>

      {!selected ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <MousePointer className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium">No selection</p>
          <p className="mt-1 text-xs text-muted-foreground">Select an element on the canvas to edit its properties.</p>
        </div>
      ) : (
        <Tabs defaultValue="design" className="flex flex-1 min-h-0 flex-col">
          <TabsList className="mx-4 mt-3 grid grid-cols-3 rounded-xl bg-muted/60">
            <TabsTrigger value="design" className="text-xs">Design</TabsTrigger>
            <TabsTrigger value="animation" className="text-xs">Animation</TabsTrigger>
            <TabsTrigger value="position" className="text-xs">Position</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 min-h-0">
            <TabsContent value="design" className="p-4 space-y-5 mt-2">
              {isText && (
                <>
                  <div>
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Content</p>
                    <textarea
                      className="w-full rounded-lg border bg-background p-2 text-xs"
                      rows={3}
                      value={selected.text ?? ''}
                      onChange={(e) => update('text', e.target.value)}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Font</p>
                    <Select value={selected.fontFamily || 'Poppins'} onValueChange={(v) => update('fontFamily', v)}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Poppins','Inter','Roboto','Montserrat','Lato','Playfair Display','Bebas Neue'].map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">Weight</p>
                      <Select value={String(selected.fontWeight || 'normal')} onValueChange={(v) => update('fontWeight', v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['normal','500','600','bold','900'].map((w) => <SelectItem key={w} value={w}>{w[0].toUpperCase()+w.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">Size</p>
                      <Input type="number" className="h-9" value={Math.round(selected.fontSize || 16)} onChange={(e) => update('fontSize', parseInt(e.target.value) || 16)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <button onClick={() => update('fontWeight', selected.fontWeight === 'bold' ? 'normal' : 'bold')} className={`flex h-9 w-full items-center justify-center rounded-lg border ${selected.fontWeight === 'bold' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Bold className="h-4 w-4" /></button>
                    <button onClick={() => update('fontStyle', selected.fontStyle === 'italic' ? 'normal' : 'italic')} className={`flex h-9 w-full items-center justify-center rounded-lg border ${selected.fontStyle === 'italic' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Italic className="h-4 w-4" /></button>
                    <button onClick={() => update('underline', !selected.underline)} className={`flex h-9 w-full items-center justify-center rounded-lg border ${selected.underline ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Underline className="h-4 w-4" /></button>
                    <button onClick={() => update('linethrough', !selected.linethrough)} className={`flex h-9 w-full items-center justify-center rounded-lg border ${selected.linethrough ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Scissors className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { icon: AlignLeft, v: 'left' },
                      { icon: AlignCenter, v: 'center' },
                      { icon: AlignRight, v: 'right' },
                      { icon: AlignJustify, v: 'justify' },
                    ].map(({ icon: Icon, v }) => (
                      <button
                        key={v}
                        onClick={() => update('textAlign', v)}
                        className={`flex h-9 items-center justify-center rounded-lg border ${selected.textAlign === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Spacing</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="mb-1 text-[10px] text-muted-foreground">Line Height</p>
                        <Input type="number" step={0.1} className="h-9" value={selected.lineHeight ?? 1.2} onChange={(e) => update('lineHeight', parseFloat(e.target.value) || 1)} />
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] text-muted-foreground">Letter Spacing</p>
                        <Input type="number" step={10} className="h-9" value={Math.round(selected.charSpacing ?? 0)} onChange={(e) => update('charSpacing', parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {isImage && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Image</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceImage(f); e.target.value = ''; }}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" className="col-span-3 gap-1.5" onClick={() => fileRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5" /> Replace image
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => update('flipX', !selected.flipX)}>Flip X</Button>
                    <Button variant="outline" size="sm" onClick={() => update('flipY', !selected.flipY)}>Flip Y</Button>
                    <Button variant="outline" size="sm" onClick={() => updateMany({ angle: ((selected.angle || 0) + 90) % 360 })}>Rotate</Button>
                  </div>
                </div>
              )}

              {(isShape || isText) && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Color</p>
                  <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
                    <input type="color" value={typeof selected.fill === 'string' ? selected.fill : '#ffffff'} onChange={(e) => update('fill', e.target.value)} className="h-6 w-6 rounded cursor-pointer border" />
                    <Input value={typeof selected.fill === 'string' ? selected.fill : ''} onChange={(e) => update('fill', e.target.value)} className="h-7 border-0 shadow-none px-2 text-xs font-mono uppercase" />
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Border</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-lg border px-2 py-1.5">
                    <input type="color" value={typeof selected.stroke === 'string' ? selected.stroke : '#000000'} onChange={(e) => update('stroke', e.target.value)} className="h-5 w-5 rounded cursor-pointer border" />
                    <span className="text-[10px] text-muted-foreground">Stroke</span>
                  </div>
                  <div>
                    <Input type="number" min={0} className="h-9" value={Math.round(selected.strokeWidth ?? 0)} onChange={(e) => update('strokeWidth', parseInt(e.target.value) || 0)} />
                  </div>
                  {type === 'rect' && (
                    <div className="col-span-2">
                      <p className="mb-1 text-[10px] text-muted-foreground">Corner radius</p>
                      <Slider value={[Math.round(selected.rx ?? 0)]} max={120} onValueChange={([v]) => updateMany({ rx: v, ry: v })} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Effects</p>
                <div className="space-y-2">
                  {([
                    { l: 'Shadow', k: 'shadow' as const, on: !!selected.shadow && (selected.shadow.blur ?? 0) <= 16 },
                    { l: 'Outline', k: 'outline' as const, on: (selected.strokeWidth ?? 0) > 0 },
                    { l: 'Glow', k: 'glow' as const, on: !!selected.shadow && (selected.shadow.blur ?? 0) > 16 },
                  ]).map((e) => (
                    <div key={e.l} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" /> {e.l}
                      </div>
                      <Switch checked={e.on} onCheckedChange={(v) => setEffect(e.k, v)} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Opacity</p>
                <div className="flex items-center gap-3">
                  <Slider value={[Math.round((selected.opacity ?? 1) * 100)]} onValueChange={([v]) => update('opacity', v / 100)} max={100} />
                  <span className="min-w-[38px] text-right text-xs font-medium">{Math.round((selected.opacity ?? 1) * 100)}%</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="animation" className="p-4 mt-2 space-y-3">
              <p className="text-xs text-muted-foreground">Choose an entrance and exit animation for this element.</p>
              <div className="grid grid-cols-2 gap-2">
                {['Fade','Slide','Zoom','Bounce','Pop','Blur'].map((a) => (
                  <button key={a} className="rounded-xl border bg-background px-3 py-6 text-xs font-medium hover:bg-muted">{a}</button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="position" className="p-4 mt-2 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="mb-1 text-[10px] text-muted-foreground">X</p><Input type="number" className="h-9" value={Math.round(selected.left || 0)} onChange={(e) => update('left', parseInt(e.target.value) || 0)} /></div>
                <div><p className="mb-1 text-[10px] text-muted-foreground">Y</p><Input type="number" className="h-9" value={Math.round(selected.top || 0)} onChange={(e) => update('top', parseInt(e.target.value) || 0)} /></div>
                <div><p className="mb-1 text-[10px] text-muted-foreground">Width</p><Input type="number" className="h-9" value={width} onChange={(e) => setWidth(parseInt(e.target.value) || 1)} /></div>
                <div><p className="mb-1 text-[10px] text-muted-foreground">Height</p><Input type="number" className="h-9" value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 1)} /></div>
                <div><p className="mb-1 text-[10px] text-muted-foreground">Rotation</p><Input type="number" className="h-9" value={Math.round(selected.angle || 0)} onChange={(e) => update('angle', parseInt(e.target.value) || 0)} /></div>
                <div><p className="mb-1 text-[10px] text-muted-foreground">Scale</p><Input type="number" step={0.1} className="h-9" value={Number(selected.scaleX || 1).toFixed(2)} onChange={(e) => updateMany({ scaleX: parseFloat(e.target.value) || 1, scaleY: parseFloat(e.target.value) || 1 })} /></div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Align to artboard</p>
                <div className="grid grid-cols-6 gap-1">
                  {([
                    { icon: AlignLeft, v: 'left' as const },
                    { icon: AlignCenter, v: 'center-h' as const },
                    { icon: AlignRight, v: 'right' as const },
                    { icon: ChevronUp, v: 'top' as const },
                    { icon: AlignVerticalJustifyCenter, v: 'center-v' as const },
                    { icon: ChevronDown, v: 'bottom' as const },
                  ]).map(({ icon: Icon, v }) => (
                    <button key={v} onClick={() => { alignObject(canvas, selected, v); bump((n) => n + 1); }} className="flex h-9 items-center justify-center rounded-lg border hover:bg-muted">
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Layer</p>
                <div className="grid grid-cols-4 gap-1">
                  <button onClick={() => moveLayer(canvas, selected, 'front')} className="h-9 rounded-lg border text-[10px] hover:bg-muted">Front</button>
                  <button onClick={() => moveLayer(canvas, selected, 'up')} className="h-9 rounded-lg border text-[10px] hover:bg-muted">Up</button>
                  <button onClick={() => moveLayer(canvas, selected, 'down')} className="h-9 rounded-lg border text-[10px] hover:bg-muted">Down</button>
                  <button onClick={() => moveLayer(canvas, selected, 'back')} className="h-9 rounded-lg border text-[10px] hover:bg-muted">Back</button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-medium">
                  {isLocked(selected) ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />} Lock position
                </div>
                <Switch checked={isLocked(selected)} onCheckedChange={(v) => { setLocked(canvas, selected, v); bump((n) => n + 1); }} />
              </div>
            </TabsContent>
          </ScrollArea>

          <div className="mt-auto border-t p-3 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => {
              if (!canvas || !selected) return;
              selected.clone((c: any) => { c.set({ left: (selected.left || 0) + 20, top: (selected.top || 0) + 20 }); canvas.add(c); canvas.renderAll(); });
            }}>
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-destructive hover:text-destructive" onClick={() => {
              if (!canvas || !selected) return;
              canvas.remove(selected); canvas.renderAll();
            }}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>

          {/* AI Assistant — contextual, human-first (opens on demand only) */}
          <div className="border-t p-3 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">AI Creative Assistant</span>
              </div>
              <AIActionsMenu selected={selected} canvas={canvas} align="end" />
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Every suggestion is previewed with confidence, reasoning and estimated lift before anything is applied.
            </p>
          </div>
        </Tabs>
      )}
    </aside>
  );
};

/* ---------- Main Editor ---------- */
const EditorInner: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'templates';
    const saved = window.localStorage.getItem('advista.editor.activeTab');
    return saved && LEFT_TABS.some((t) => t.id === saved) ? saved : 'templates';
  });
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Summer Sale Campaign');
  const [zoom, setZoom] = useState(100);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [tick, forceUpdate] = useState(0);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [toolbarPos, setToolbarPos] = useState<{ left: number; top: number } | null>(null);
  const [canvasWrapperEl, setCanvasWrapperEl] = useState<HTMLDivElement | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [fitToken, setFitToken] = useState(0);
  const [imageStatuses, setImageStatuses] = useState<ImageLayerStatus[]>([]);
  const [retryingImages, setRetryingImages] = useState(false);

  const upsertImageStatus = useCallback((s: ImageLayerStatus) => {
    setImageStatuses((prev) => {
      const i = prev.findIndex((p) => p.id === s.id);
      if (i === -1) return [...prev, s];
      const next = [...prev];
      next[i] = s;
      return next;
    });
  }, []);

  const [preset, setPreset] = useState('mobile');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [pageIdx, setPageIdx] = useState(0);
  const artboard = ARTBOARD_PRESETS[preset] ?? ARTBOARD_PRESETS.mobile;
  const isMobile = useIsMobile();
  const isVideo = false; // TODO: detect from canvas content
  const currentTools = getToolsForSelection(selected);
  const aiActions = getAiActions(selected);
  const selectionType = !selected ? null : (selected.type === 'textbox' || selected.type === 'text' || selected.type === 'i-text' ? 'text' : selected.type === 'image' ? 'image' : selected.type === 'video' ? 'video' : 'other');

  // ---- Undo / Redo history ----
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const historyRef = useRef(history);
  const historyIdxRef = useRef(historyIdx);
  const isRestoringRef = useRef(false);
  historyRef.current = history;
  historyIdxRef.current = historyIdx;

  const saveSnapshot = useCallback((c: FabricCanvas) => {
    if (isRestoringRef.current) return;
    const json = JSON.stringify((c as any).toJSON(['id']));
    if (historyRef.current[historyIdxRef.current] === json) return;
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIdxRef.current + 1);
      const next = [...trimmed, json];
      return next.length > 50 ? next.slice(next.length - 50) : next;
    });
    setHistoryIdx(prev => Math.min(prev + 1, 49));
  }, []);

  const restore = useCallback(async (c: FabricCanvas, idx: number) => {
    isRestoringRef.current = true;
    try {
      const json = JSON.parse(historyRef.current[idx]);
      await c.loadFromJSON(json);
      c.discardActiveObject();
      c.requestRenderAll();
      setSelected(null);
      setHistoryIdx(idx);
      forceUpdate(n => n + 1);
    } finally {
      // let Fabric finish emitting object:added events before re-arming history
      setTimeout(() => { isRestoringRef.current = false; }, 0);
    }
  }, []);

  const onUndo = useCallback(() => {
    if (!canvas || historyIdxRef.current <= 0) return;
    restore(canvas, historyIdxRef.current - 1);
  }, [canvas, restore]);

  const onRedo = useCallback(() => {
    if (!canvas || historyIdxRef.current >= historyRef.current.length - 1) return;
    restore(canvas, historyIdxRef.current + 1);
  }, [canvas, restore]);

  const canUndo = historyIdx > 0;
  const canRedo = historyIdx < history.length - 1;

  // Wire canvas events for history
  useEffect(() => {
    if (!canvas) return;
    const save = () => { saveSnapshot(canvas); forceUpdate(n => n + 1); };
    canvas.on('object:added', save);
    canvas.on('object:modified', save);
    canvas.on('object:removed', save);
    // Save initial state
    setTimeout(() => saveSnapshot(canvas), 100);
    return () => {
      canvas.off('object:added', save);
      canvas.off('object:modified', save);
      canvas.off('object:removed', save);
    };
  }, [canvas, saveSnapshot]);

  const markChanged = useCallback(() => {
    if (canvas) saveSnapshot(canvas);
    forceUpdate(n => n + 1);
  }, [canvas, saveSnapshot]);

  // ---- Auto-save canvas to localStorage ----
  const autoSaveData = useMemo(() => {
    if (!canvas) return null;
    try { return { json: (canvas as any).toJSON(['id']), name: projectName, zoom }; }
    catch { return null; }
  }, [canvas, historyIdx, projectName, zoom]);

  const handleAutoSave = useCallback((data: any) => {
    if (!data?.json) return;
    localStorage.setItem(`editor_recovery_${projectName}`, JSON.stringify(data));
  }, [projectName]);

  const { restoreFromAutoSave, clearAutoSave } = useAutoSave(autoSaveData, handleAutoSave, {
    delay: 3000,
    enabled: !!canvas,
    key: `editor-${projectName}`,
  });

  // ---- Keyboard shortcuts for canvas operations ----
  const nudge = useCallback((dx: number, dy: number) => {
    if (!selected || !canvas) return;
    selected.set('left', (selected.left || 0) + dx);
    selected.set('top', (selected.top || 0) + dy);
    canvas.renderAll();
    forceUpdate(n => n + 1);
  }, [selected, canvas]);

  const deleteSelected = useCallback(() => {
    if (!selected || !canvas) return;
    deleteObject(canvas, selected);
    setSelected(null);
    forceUpdate(n => n + 1);
  }, [selected, canvas]);

  const duplicateSelected = useCallback(async () => {
    if (!selected || !canvas) return;
    const clone = await duplicateObject(canvas, selected);
    if (clone) setSelected(clone);
    forceUpdate(n => n + 1);
  }, [selected, canvas]);

  const clipboardRef = useRef<any>(null);

  const copySelected = useCallback(async () => {
    if (!selected) return;
    clipboardRef.current = await selected.clone();
    toast({ title: 'Copied', description: 'Press Ctrl/Cmd + V to paste.' });
  }, [selected]);

  const pasteClipboard = useCallback(async () => {
    if (!canvas || !clipboardRef.current) return;
    const clone: any = await clipboardRef.current.clone();
    clone.set({ left: (clone.left || 0) + 20, top: (clone.top || 0) + 20 });
    canvas.add(clone);
    canvas.setActiveObject(clone);
    canvas.requestRenderAll();
    setSelected(clone);
    forceUpdate(n => n + 1);
  }, [canvas]);

  useKeyboardShortcuts({
    enabled: !!canvas,
    shortcuts: [
      { key: 'Delete', action: deleteSelected, description: 'Delete selected object', category: 'Canvas' },
      { key: 'Backspace', action: deleteSelected, description: 'Delete selected object', category: 'Canvas' },
      { key: 'z', ctrlKey: true, metaKey: true, action: onUndo, description: 'Undo', category: 'Canvas' },
      { key: 'z', ctrlKey: true, metaKey: true, shiftKey: true, action: onRedo, description: 'Redo', category: 'Canvas' },
      { key: 'c', ctrlKey: true, metaKey: true, action: copySelected, description: 'Copy', category: 'Canvas' },
      { key: 'v', ctrlKey: true, metaKey: true, action: pasteClipboard, description: 'Paste', category: 'Canvas' },
      { key: 'd', ctrlKey: true, metaKey: true, action: duplicateSelected, description: 'Duplicate', category: 'Canvas' },
      { key: 'ArrowUp', action: () => nudge(0, -1), description: 'Nudge up', category: 'Canvas' },
      { key: 'ArrowDown', action: () => nudge(0, 1), description: 'Nudge down', category: 'Canvas' },
      { key: 'ArrowLeft', action: () => nudge(-1, 0), description: 'Nudge left', category: 'Canvas' },
      { key: 'ArrowRight', action: () => nudge(1, 0), description: 'Nudge right', category: 'Canvas' },
    ],
  });

  // Detect a pending template BEFORE the canvas mounts so we skip default seeds.
  const pendingRef = useRef(peekPendingEditorTemplate());
  const [hasPending] = useState(() => !!pendingRef.current);
  const { effectiveContext, brand } = useAIContext();
  const { data: brandKits } = useBrandKits();

  const loadTemplateRecord = useCallback(
    async (template: any) => {
      if (!canvas || !template) return;
      try {
        const activeKit = brandKits?.find((k) => k.is_active) || brandKits?.[0];
        const inst = await TemplateEngine.instantiate(template, {
          brand: brand
            ? {
                id: brand.id,
                name: brand.name,
                logo_url: activeKit?.logo_url ?? undefined,
                colors: [activeKit?.primary_color, activeKit?.secondary_color, activeKit?.accent_color].filter(Boolean) as string[],
                voice: (brand as any).voice ?? undefined,
                locked: false,
              }
            : null,
          category: effectiveContext?.active_category ?? template.category ?? null,
          goal: (effectiveContext as any)?.active_goal ?? template.objective ?? null,
          platform: template.platform ?? null,
          productName: template.name,
        });
        const json = inst.json as any;

        // Resilient load — unresolved {{image}} placeholders become editable
        // placeholder layers instead of blowing up the whole document.
        setImageStatuses([]);
        const result = await loadTemplateJSONIntoCanvas(canvas, json, {
          fallbackImageSrc: template.preview_url || template.thumbnail_url || template.image_url || undefined,
          onImageStatus: upsertImageStatus,
        });


        if (json?.background) canvas.backgroundColor = json.background as string;

        // Fit the template artboard into the editor canvas so everything is visible.
        const tw = Number(template.width) || json?.width || canvas.getWidth();
        const th = Number(template.height) || json?.height || canvas.getHeight();
        const fit = Math.min(canvas.getWidth() / tw, canvas.getHeight() / th);
        const offsetX = (canvas.getWidth() - tw * fit) / 2;
        const offsetY = (canvas.getHeight() - th * fit) / 2;

        const srcObjects: any[] = Array.isArray(json?.objects) ? json.objects : [];

        canvas.getObjects().forEach((obj: any, i) => {
          const src = srcObjects[i] ?? {};
          if (fit !== 1) {
            obj.set({
              left: (obj.left || 0) * fit + offsetX,
              top: (obj.top || 0) * fit + offsetY,
              scaleX: (obj.scaleX || 1) * fit,
              scaleY: (obj.scaleY || 1) * fit,
            });
          }
          // Everything stays fully editable — templates are a starting point, not a lock.
          obj.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
            lockMovementX: false,
            lockMovementY: false,
            lockScalingX: false,
            lockScalingY: false,
            lockRotation: false,
            hoverCursor: 'move',
          });
          // Keep AdVista metadata on the live object so panels/AI can target layers.
          obj.name = src.name ?? obj.name;
          obj.variableKey = src.variableKey;
          obj.brandReplaceable = src.brandReplaceable;
          obj.aiReplaceable = src.aiReplaceable;
          if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
            obj.editable = true; // double-click to edit copy live
            // Keep copy inside the artboard: never let a text layer run off-canvas.
            const maxW = Math.max(40, canvas.getWidth() - (obj.left || 0) - 8);
            if (obj.type === 'textbox') {
              const current = (obj.width || 0) * (obj.scaleX || 1);
              if (current > maxW) obj.set({ width: maxW / (obj.scaleX || 1), splitByGrapheme: true });
            } else if ((obj.width || 0) * (obj.scaleX || 1) > maxW) {
              obj.set({ scaleX: maxW / (obj.width || maxW), scaleY: maxW / (obj.width || maxW) });
            }
          }
          obj.setCoords();
        });


        canvas.discardActiveObject();
        canvas.requestRenderAll();
        saveSnapshot(canvas);
        setProjectName(template.name);
        forceUpdate((n) => n + 1);
        toast({
          title: 'Template loaded',
          description: `${result.loaded} editable layers${result.skipped ? ` • ${result.skipped} skipped` : ''} • ${Object.keys(inst.resolvedVariables).length} placeholders resolved${inst.appliedBrand ? ' • Brand applied' : ''}.`,
        });

      } catch (err) {
        console.error('[VisualEditor] instantiate failed', err);
        toast({ title: 'Could not load template', description: 'Falling back to a blank canvas.', variant: 'destructive' });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canvas, brandKits, brand, effectiveContext, saveSnapshot],
  );

  // On canvas ready → load a pending template (session handoff) or ?template=<id>.
  useEffect(() => {
    if (!canvas) return;
    const pending = consumePendingEditorTemplate();
    if (pending?.template) {
      loadTemplateRecord(pending.template);
      return;
    }
    const templateId = new URLSearchParams(window.location.search).get('template');
    if (!templateId) return;
    (async () => {
      const { data, error } = await supabase.from('templates').select('*').eq('id', templateId).maybeSingle();
      if (error || !data) {
        toast({ title: 'Template not found', description: 'Starting from a blank canvas instead.', variant: 'destructive' });
        return;
      }
      loadTemplateRecord(data);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);

  const activeKit = brandKits?.find((k) => k.is_active) || brandKits?.[0];
  const brandPalette = [activeKit?.primary_color, activeKit?.secondary_color, activeKit?.accent_color].filter(Boolean) as string[];


  const addText = (text: string, size: number, weight: string) => {
    if (!canvas) return;
    const tb = new Textbox(text, { left: 60, top: 60, fontSize: size, fontWeight: weight, fill: '#ffffff', fontFamily: 'Poppins', width: 320 });
    canvas.add(tb); canvas.setActiveObject(tb); canvas.renderAll();
    setSelected(tb); forceUpdate((n) => n + 1);
  };
  const addShape = (t: 'rectangle' | 'circle') => {
    if (!canvas) return;
    const s = t === 'rectangle'
      ? new Rect({ left: 100, top: 100, width: 120, height: 120, fill: '#8b5cf6' })
      : new FCircle({ left: 100, top: 100, radius: 60, fill: '#FFC107' });
    canvas.add(s); canvas.setActiveObject(s); canvas.renderAll();
    setSelected(s); forceUpdate((n) => n + 1);
  };

  const onExport = () => {
    if (!canvas) return;
    const url = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    const a = document.createElement('a'); a.href = url; a.download = `${projectName || 'design'}.png`; a.click();
    toast({ title: 'Exported', description: 'Your design has been downloaded.' });
  };

  // Compute floating toolbar position relative to selected object
  useEffect(() => {
    if (!selected || !canvasWrapperEl || !canvas) {
      setToolbarPos(null);
      return;
    }
    const scale = zoom / 100;
    const wrapperRect = canvasWrapperEl.getBoundingClientRect();
    const containerEl = canvasWrapperEl.closest('.editor-canvas-area');
    if (!containerEl) return;
    const containerRect = containerEl.getBoundingClientRect();

    const objCenterX = (selected.left || 0) + ((selected.width || 0) * (selected.scaleX || 1)) / 2;
    const objTop = selected.top || 0;

    const screenX = wrapperRect.left + objCenterX * scale;
    const screenY = wrapperRect.top + objTop * scale;

    setToolbarPos({
      left: screenX - containerRect.left,
      top: Math.max(8, screenY - containerRect.top - 48),
    });
  }, [selected, canvasWrapperEl, canvas, zoom]);

  // Persist the open panel so a refresh restores the same tab.
  useEffect(() => {
    try { window.localStorage.setItem('advista.editor.activeTab', activeTab); } catch { /* ignore */ }
  }, [activeTab]);

  const selectTab = useCallback((id: string) => {
    setActiveTab(id);
    setActiveTool(null);
  }, []);

  // ---- Preview / Publish / Pages ----
  const openPreview = useCallback(() => {
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setPreviewUrl(canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 }));
  }, [canvas]);

  const onPublish = useCallback(() => {
    if (!canvas) return;
    try {
      localStorage.setItem(
        'advista.editor.publishDraft',
        JSON.stringify({ name: projectName, json: (canvas as any).toJSON(['id']), preview: canvas.toDataURL({ format: 'png', multiplier: 1 }) }),
      );
    } catch { /* preview may exceed quota — publishing still proceeds */ }
    toast({ title: 'Design ready to publish', description: 'Pick a campaign to attach this creative to.' });
    navigate('/campaigns');
  }, [canvas, projectName, navigate]);

  const addPage = useCallback(() => {
    if (!canvas) return;
    const snapshot = (canvas as any).toJSON(['id']);
    setPages((prev) => {
      const next = [...prev];
      next[pageIdx] = snapshot;
      next.push(null);
      setPageIdx(next.length - 1);
      return next;
    });
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.requestRenderAll();
    setSelected(null);
    forceUpdate((n) => n + 1);
  }, [canvas, pageIdx]);

  const goToPage = useCallback(async (idx: number) => {
    if (!canvas || idx === pageIdx) return;
    const snapshot = (canvas as any).toJSON(['id']);
    const next = [...pages];
    next[pageIdx] = snapshot;
    setPages(next);
    const target = next[idx];
    if (target) await canvas.loadFromJSON(target);
    else { canvas.clear(); canvas.backgroundColor = '#ffffff'; }
    canvas.requestRenderAll();
    setPageIdx(idx);
    setSelected(null);
    forceUpdate((n) => n + 1);
  }, [canvas, pages, pageIdx]);

  const renderLeftPanel = () => {
    switch (activeTab) {
      case 'templates': return <StudioTemplatesPanel onUse={(t: StudioTemplate) => loadTemplateRecord(t)} />;
      case 'background': return <StudioBackgroundPanel canvas={canvas} onChanged={() => forceUpdate((n) => n + 1)} brandColors={brandPalette} selected={selected} />;
      case 'ai-studio': return <StudioAIPanel canvas={canvas} onChanged={() => forceUpdate((n) => n + 1)} platform={(effectiveContext as any)?.active_platform ?? null} category={effectiveContext?.active_category ?? null} selected={selected} />;
      case 'text': return <TextPanel onAdd={addText} />;
      case 'elements': return <StudioElementsPanel canvas={canvas} onChanged={() => forceUpdate((n) => n + 1)} brandColors={brandPalette} selected={selected} />;
      case 'brand': return <BrandKitPanel />;
      case 'layers': return <LayersPanel canvas={canvas} version={tick} selected={selected} onSelect={setSelected} onChanged={markChanged} />;
      case 'media': return <StudioMediaPanel canvas={canvas} onChanged={() => forceUpdate((n) => n + 1)} selected={selected} />;
      case 'uploads': return <StudioUploadsPanel canvas={canvas} onChanged={() => forceUpdate((n) => n + 1)} selected={selected} />;
      case 'projects': return <SimplePanel title="Projects"><p className="text-xs text-muted-foreground">Your recent projects.</p></SimplePanel>;

      default: return null;
    }
  };

  const isEmpty = canvas ? canvas.getObjects().length === 0 : true;

  const renderCanvas = () => (
    <>
      <CanvasStage
        zoom={zoom}
        onZoomChange={setZoom}
        seedDefault={!hasPending}
        onCanvasReady={(c) => { setCanvas(c); setCanvasReady(true); }}
        onSelection={(o) => { setSelected(o); forceUpdate((n) => n + 1); }}
        onCanvasWrapperRef={(el) => setCanvasWrapperEl(el)}
        isMobile={isMobile}
        artboard={artboard}
        showGrid={showGrid}
        fitToken={fitToken}
      />

      {/* Onboarding overlay when canvas is empty */}
      {isEmpty && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none" style={{ backgroundColor: 'rgba(26,26,26,0.85)' }}>
          <div className="pointer-events-auto max-w-xs text-center px-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Start creating</h3>
            <p className="text-xs text-gray-400 mb-5">Tap a tool below to add text, images, shapes, or upload your own media.</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Text', icon: Type, action: () => addText('New Text', 32, 'bold'), color: 'from-blue-500 to-blue-600' },
                { label: 'Shape', icon: Shapes, action: () => addShape('rectangle'), color: 'from-purple-500 to-purple-600' },
                { label: 'Upload', icon: Upload, action: () => { setActiveTab('uploads'); setSheetExpanded(true); }, color: 'from-emerald-500 to-emerald-600' },
              ].map(({ label, icon: Icon, action, color }) => (
                <button key={label} onClick={action}
                  className="flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 transition hover:scale-105"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-300">{label}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-gray-500">Tip: Tap a template to start from a pre-made design</p>
          </div>
        </div>
      )}

      {/* Floating Toolbar — simplified, contextual above object */}
      {selected && toolbarPos && (
        <div className="absolute z-30 pointer-events-auto animate-in fade-in"
          style={{ left: toolbarPos.left, top: toolbarPos.top, transform: 'translateX(-50%)' }}>
          <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-full shadow-lg" style={{ backgroundColor: '#2D2D2D', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
            <button title="AI suggestions for this layer"
              onClick={() => { setActiveTab('ai-studio'); setSheetExpanded(true); }}
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/10 text-white">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold">AI</span>
            </button>
            <div className="w-px h-4 mx-0.5" style={{ backgroundColor: '#444444' }} />
            <button title="Edit layer"
              onClick={() => {
                if (selectionType === 'text') { canvas?.setActiveObject(selected); (selected as any).enterEditing?.(); canvas?.requestRenderAll(); }
                else if (selectionType === 'image') { setActiveTab('media'); setSheetExpanded(true); }
                else { setActiveTab('elements'); setSheetExpanded(true); }
              }}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 text-white"><Edit3 className="h-3.5 w-3.5" /></button>
            <button title="Duplicate" onClick={duplicateSelected}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 text-white"><Copy className="h-3.5 w-3.5" /></button>
            <button title="Delete" onClick={deleteSelected}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 text-white"><Trash2 className="h-3.5 w-3.5" /></button>
            <button title={isLocked(selected) ? 'Unlock layer' : 'Lock layer'}
              onClick={() => { setLocked(canvas, selected, !isLocked(selected)); markChanged(); }}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 text-white">
              {isLocked(selected) ? <Lock className="h-3.5 w-3.5 text-amber-400" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
            <button title="Bring forward" onClick={() => { moveLayer(canvas, selected, 'up'); markChanged(); }}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 text-white"><MoveUp className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}

      {/* Bottom bar — pages */}
      <div className="flex items-center justify-center gap-2 py-2" style={{ backgroundColor: isMobile ? 'transparent' : '#1A1A1A', borderTop: isMobile ? 'none' : '1px solid #2D2D2D' }}>
        {pages.length > 1 && pages.map((_, i) => (
          <button key={i} onClick={() => goToPage(i)}
            className="h-9 min-w-9 rounded-lg px-3 text-xs"
            style={{
              backgroundColor: i === pageIdx ? '#6C63FF' : '#2D2D2D',
              border: '1px solid #444444',
              color: i === pageIdx ? '#FFFFFF' : '#CCCCCC',
            }}>
            {i + 1}
          </button>
        ))}
        <button onClick={addPage} className="flex items-center gap-2 h-9 rounded-lg px-4 text-xs" style={{ backgroundColor: '#2D2D2D', border: '1px solid #444444', color: '#CCCCCC' }}>
          <Plus className="h-3.5 w-3.5" /> Add page
        </button>
      </div>
    </>
  );

  return (
    <div className="visual-editor flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Editor Top Bar */}
      <div className="editor-top-bar flex-shrink-0">
        <TopToolbar
          projectName={projectName}
          setProjectName={setProjectName}
          zoom={zoom}
          setZoom={setZoom}
          onExport={onExport}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onToggleLeft={() => isMobile ? navigate('/dashboard') : setLeftOpen(true)}
          onToggleRight={() => setRightOpen(true)}
          isMobile={isMobile}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid((g) => !g)}
          onFit={() => setFitToken((t) => t + 1)}
          onPreview={openPreview}
          onPublish={onPublish}
          artboardLabel={`${artboard.label} · ${artboard.width}×${artboard.height} px`}
        />
      </div>

      {/* Desktop only: Editor Second Bar */}
      <div className="editor-second-bar flex-shrink-0">
        <CanvasSubToolbar
          canvas={canvas}
          selected={selected}
          onChanged={markChanged}
          preset={preset}
          onPresetChange={setPreset}
          onOpenAnimate={() => { setActiveTab('ai-studio'); setActiveTool('animate'); }}
          onOpenPosition={() => { setActiveTab('layers'); setActiveTool('position'); }}
        />
      </div>

      {/* Mobile layout: Top Bar → Canvas → Bottom Sheet → Contextual Toolbar */}
      {isMobile ? (
        <>
          {/* Canvas — takes remaining space */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="editor-canvas-area relative flex flex-1 min-w-0 flex-col overflow-hidden">
              {renderCanvas()}
            </div>
          </div>

          {/* Slide-Up Panel — contextual tool sheet or creation panel */}
          <MobileBottomSheet open={sheetExpanded} onClose={() => { setSheetExpanded(false); setActiveTool(null); }}
            label={activeTool ? (currentTools.find(t => t.id === activeTool)?.label || activeTool) : (LEFT_TABS.find(t => t.id === activeTab)?.label || 'Create')}>
            {/* AI prompt bar — contextual based on selection */}
            <div className="flex items-center gap-2 mb-3 overflow-x-auto [scrollbar-width:none]">
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Ask AI</span>
              </div>
              {aiActions.slice(0, 4).map(a => (
                <button key={a.id} className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition shrink-0">
                  {a.label}
                </button>
              ))}
            </div>
            <div className="h-0.5 bg-border mb-3" />
            {/* Tool sheet content or creation panels */}
            {activeTool && selected ? renderToolSheet(activeTool, selected, canvas) : renderLeftPanel()}
          </MobileBottomSheet>

          {/* Contextual Toolbar — auto-switches based on selection */}
          <ContextualToolbar
            tools={currentTools}
            active={selected ? activeTool : activeTab}
            onToolTap={(id) => {
              const isCreateTool = !selected || CREATE_TOOLS.some((t) => t.id === id);
              if (isCreateTool) {
                setActiveTab(id);
                setActiveTool(null);
              } else {
                setActiveTool(id);
              }
              setSheetExpanded(true);
            }}
          />
        </>
      ) : (
        /* Desktop layout */
        <>
          {/* Editor Main */}
          <div className="editor-main flex flex-1 overflow-hidden min-h-0">
            {/* Left: Icon Rail + Panel */}
            <div className="editor-left-panel flex h-full overflow-hidden">
              <IconRail active={activeTab} onChange={selectTab} />
              <div className="editor-panel-content hidden md:flex h-full w-[264px] shrink-0 flex-col overflow-hidden border-r">
                <div key={activeTab} className="flex h-full min-h-0 flex-col">
                  {renderLeftPanel()}
                </div>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="editor-canvas-area relative flex flex-1 min-w-0 flex-col overflow-hidden">
              {renderCanvas()}
            </div>

            {/* Desktop right panel — contextual */}
            {selected && (
              <div className="editor-right-panel hidden lg:flex w-[240px] shrink-0 border-l overflow-y-auto">
                <RightPanel selected={selected} canvas={canvas} onClose={() => setRightOpen(false)} />
              </div>
            )}
          </div>

          {/* Timeline — only for video */}
          {(isVideo || (canvas?.getObjects()?.length ?? 0) > 0) && (
            <div className={`editor-timeline flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${timelineOpen ? 'max-h-[240px]' : 'max-h-0'}`}>
              <Timeline canvas={canvas} selected={selected} onSelect={setSelected} version={tick} />
            </div>
          )}
        </>
      )}

      {/* Desktop left sheet (hidden on mobile — hamburger goes to dashboard) */}
      <Sheet open={leftOpen && !isMobile} onOpenChange={setLeftOpen}>
        <SheetContent side="left" className="w-[min(20rem,calc(100vw-2rem))] p-0 flex flex-col">
          <div className="flex items-center gap-1 border-b bg-[hsl(245,45%,10%)] p-2 overflow-x-auto">
            {LEFT_TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => selectTab(t.id)}
                  className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-2.5 py-2 text-white ${isActive ? 'bg-primary' : 'hover:bg-white/10'}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-[9px]">{t.label}</span>
                </button>
              );
            })}
          </div>
          <div key={activeTab} className="flex-1 min-h-0 overflow-hidden">{renderLeftPanel()}</div>
        </SheetContent>
      </Sheet>

      {/* Preview — a read-only render of the current page */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setPreviewUrl(null)}>
          <div className="flex max-h-full flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img src={previewUrl} alt={`${projectName} preview`} className="max-h-[75vh] max-w-full rounded-lg shadow-2xl" />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={onExport}><Download className="mr-1.5 h-3.5 w-3.5" /> Export PNG</Button>
              <Button size="sm" variant="outline" onClick={() => setPreviewUrl(null)}><X className="mr-1.5 h-3.5 w-3.5" /> Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VisualEditorPage: React.FC = () => (
  <VisualEditorProvider>
    <EditorInner />
  </VisualEditorProvider>
);

export default VisualEditorPage;

import React, { useEffect, useRef, useState } from 'react';
import { VisualEditorProvider, useVisualEditor } from '@/contexts/VisualEditorContext';
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
import { useNavigate } from 'react-router-dom';
import { useBrandKits, useBrandColors, useBrandFonts } from '@/hooks/useBrandKit';
import { toast } from '@/hooks/use-toast';
import {
  Layout, Image as ImageIcon, Type, Shapes, Sparkles, Upload, Layers as LayersIcon,
  FolderOpen, Settings, Moon, HelpCircle, Bell, ChevronLeft, Edit3, Check,
  Undo2, Redo2, Play, Download, Send, Grid3x3, Maximize2, Minus, Plus,
  Wand2, MoveUp, MoveDown, AlignVerticalJustifyCenter, Lock, Unlock,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline,
  Copy, Trash2, MoreHorizontal, Search, Filter, Video, Music, Monitor, Square as SquareIcon, Link,
  Circle as CircleIcon, MousePointer, Volume2, X, Menu, ChevronDown, PanelRight,
  Palette, Sun, Zap, Eye, EyeOff, Pause, ChevronRight, RefreshCw, GripVertical, Pipette, Box,
  ChevronUp,
} from 'lucide-react';
import { AIActionsMenu } from '@/components/visual-editor/ai/AIActionsMenu';
import { AIQuickActionsMenu } from '@/components/visual-editor/ai/AIQuickActionsMenu';
import { consumePendingEditorTemplate, peekPendingEditorTemplate } from '@/lib/templateEditorSession';
import { TemplateEngine } from '@/services/templates/TemplateEngine';
import { useAIContext } from '@/contexts/AIContext';

/* ---------- Constants ---------- */
const LEFT_TABS = [
  { id: 'templates', label: 'Templates', icon: Layout },
  { id: 'background', label: 'Background', icon: Palette },
  { id: 'ai-studio', label: 'AI Studio', icon: Wand2 },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'brand', label: 'Brand Kit', icon: Sparkles },
  { id: 'uploads', label: 'Uploads', icon: Upload },
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
  onToggleLeft: () => void;
  onToggleRight: () => void;
}> = ({ projectName, setProjectName, zoom, setZoom, onExport, onToggleLeft, onToggleRight }) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-2 border-b bg-card/95 backdrop-blur px-2 sm:px-4">
      <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={onToggleLeft}>
        <Menu className="h-4 w-4" />
      </Button>
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
        <span className="hidden lg:inline text-[11px] text-muted-foreground">Instagram Post · 1080×1080 px</span>
      </div>

      <Badge variant="secondary" className="hidden sm:inline-flex gap-1 rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
        <Check className="h-3 w-3" /> Saved
      </Badge>

      <div className="ml-1 hidden md:flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8"><Undo2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8"><Redo2 className="h-4 w-4" /></Button>
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

      <Button variant="ghost" size="icon" className="hidden lg:inline-flex h-9 w-9" title="Grid"><Grid3x3 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="hidden lg:inline-flex h-9 w-9" title="Fit"><Maximize2 className="h-4 w-4" /></Button>

      <AIQuickActionsMenu />
      <Button variant="outline" size="sm" className="h-9 gap-1.5 hidden sm:inline-flex">
        <Play className="h-3.5 w-3.5" /> Preview
      </Button>
      <Button size="sm" className="h-9 gap-1.5 bg-primary hover:bg-primary/90" onClick={onExport}>
        <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
      </Button>
      <Button size="sm" variant="secondary" className="h-9 gap-1.5 hidden sm:inline-flex">
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
  <button className={`group relative ${ratio} w-full overflow-hidden rounded-xl border border-border/60 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md`}>
    <div className={`absolute inset-0 bg-gradient-to-br ${item.bg}`} />
    <div className="absolute inset-0 p-3 flex flex-col justify-end">
      <span className={`text-[11px] font-bold leading-tight drop-shadow ${item.dark ? 'text-slate-900' : 'text-white'}`}>
        {item.title}
      </span>
    </div>
  </button>
);

const TemplatesPanel: React.FC = () => {
  const [cat, setCat] = useState('All');
  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="p-4 pb-3 border-b">
        <h2 className="text-base font-semibold text-foreground">Templates</h2>
      </div>
      <div className="p-4 pb-2 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search templates" className="pl-8 h-9 rounded-xl bg-muted/60 border-transparent text-xs" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={[
                'rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
                cat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
              ].join(' ')}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 pt-2 space-y-5">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground">Recommended for you</h3>
              <button className="text-[11px] text-primary hover:underline">See all</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {RECOMMENDED.map((t) => <TemplateThumb key={t.id} item={t} />)}
            </div>
          </section>
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground">Instagram Post</h3>
              <button className="text-[11px] text-primary hover:underline">See all</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {INSTA_POST.map((t) => <TemplateThumb key={t.id} item={t} />)}
            </div>
          </section>
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground">Instagram Story</h3>
              <button className="text-[11px] text-primary hover:underline">See all</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {INSTA_STORY.map((t) => <TemplateThumb key={t.id} item={t} ratio="aspect-[9/16]" />)}
            </div>
          </section>
        </div>
      </ScrollArea>
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

/* ---------- AI Studio Panel ---------- */
const AIStudioPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('images');
  const [prompt, setPrompt] = useState('');
  const tabs = [
    { id: 'images', label: 'Images' },
    { id: 'graphics', label: 'Graphics' },
    { id: 'videos', label: 'Videos' },
    { id: '3d', label: '3D' },
  ];
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#2D2D2D]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3D3D3D]">
        <h2 className="text-base font-bold text-white">AI Studio</h2>
        <HelpCircle className="h-4 w-4 text-[#888888]" />
      </div>
      <div className="flex border-b border-[#3D3D3D]">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 py-2 text-sm ${activeTab === t.id ? 'text-white font-semibold border-b-2 border-[#6C63FF]' : 'text-[#888888]'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <p className="text-sm font-semibold text-white mb-2">Describe what you want to create</p>
        <div className="relative mb-4">
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter 5+ words to describe..."
            className="w-full h-24 rounded-lg p-3 text-sm bg-[#3D3D3D] border border-[#555555] text-[#888888] placeholder:text-[#888888] outline-none resize-none" />
          <button className="absolute bottom-2 left-2 flex items-center gap-1 h-7 px-3 rounded-full bg-[#2D2D2D] border border-[#555555] text-xs text-[#CCCCCC]">
            💡 Inspire me
          </button>
        </div>
        {activeTab === 'images' && (
          <>
            <div className="flex gap-2 mb-4">
              <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#555555] text-xs text-white">🖼 Styles</button>
              <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#555555] text-xs text-white">⊡ Square</button>
            </div>
            <p className="text-xs font-semibold text-white mb-2">Created by AI Studio</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {[1,2,3].map((i) => (
                <div key={i} className="h-20 flex-1 min-w-[80px] rounded-lg bg-gradient-to-br from-purple-600 to-pink-500" />
              ))}
            </div>
          </>
        )}
        {activeTab === 'videos' && (
          <div className="p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D]">
            <p className="text-xs font-semibold text-white mb-1">🚩 This is experimental new technology</p>
            <p className="text-xs text-[#888888]">Scenes with people or animals may not look quite right.</p>
          </div>
        )}
        {activeTab === '3d' && (
          <div className="p-3 rounded-lg bg-[#2D2D2D] border border-[#3D3D3D]">
            <p className="text-xs font-semibold text-white mb-1">🚩 This is experimental new technology</p>
            <p className="text-xs text-[#888888]">Some objects may not look quite right.</p>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-[#3D3D3D]">
        <button className={`w-full h-11 rounded-lg text-sm font-semibold ${prompt.length > 5 ? 'bg-[#6C63FF] text-white' : 'bg-[#2D2D2D] text-[#888888]'}`}>
          Generate {activeTab === 'images' ? 'images' : activeTab === 'graphics' ? 'graphics' : activeTab === 'videos' ? 'video' : '3D'}
        </button>
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

const LayersPanel: React.FC<{ canvas: FabricCanvas | null; version: number }> = ({ canvas, version }) => {
  const objs = canvas?.getObjects() || [];
  return (
    <SimplePanel title="Layers">
      {objs.length === 0 ? (
        <p className="text-xs text-muted-foreground">Layers will appear here as you add elements.</p>
      ) : (
        <div className="space-y-1.5">
          {[...objs].reverse().map((o: any, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
              <LayersIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1 truncate text-xs">{o.type === 'textbox' ? o.text?.slice(0, 20) : o.type}</span>
              <button onClick={() => { canvas?.remove(o); canvas?.renderAll(); }}><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
            </div>
          ))}
        </div>
      )}
    </SimplePanel>
  );
};

/* ---------- Canvas Sub-toolbar ---------- */
const CanvasSubToolbar: React.FC = () => (
  <div className="flex h-11 items-center gap-1 border-b bg-card/60 px-3 overflow-x-auto">
    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs"><Play className="h-3.5 w-3.5" /> Animate</Button>
    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">Position</Button>
    <Separator orientation="vertical" className="h-5 mx-1" />
    <Button variant="ghost" size="icon" className="h-8 w-8"><AlignVerticalJustifyCenter className="h-4 w-4" /></Button>
    <Button variant="ghost" size="icon" className="h-8 w-8"><MoveUp className="h-4 w-4" /></Button>
    <Button variant="ghost" size="icon" className="h-8 w-8"><MoveDown className="h-4 w-4" /></Button>
    <Button variant="ghost" size="icon" className="h-8 w-8"><Lock className="h-4 w-4" /></Button>
    <Button variant="ghost" size="icon" className="h-8 w-8"><Unlock className="h-4 w-4" /></Button>
    <div className="flex-1" />
    <Select defaultValue="desktop">
      <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="desktop">Desktop</SelectItem>
        <SelectItem value="mobile">Mobile</SelectItem>
        <SelectItem value="instagram">Instagram</SelectItem>
        <SelectItem value="facebook">Facebook</SelectItem>
        <SelectItem value="tiktok">TikTok</SelectItem>
        <SelectItem value="linkedin">LinkedIn</SelectItem>
        <SelectItem value="youtube">YouTube</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

/* ---------- Canvas Stage ---------- */
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;

const CanvasStage: React.FC<{
  onCanvasReady: (c: FabricCanvas) => void;
  onSelection: (o: any) => void;
  zoom: number;
  seedDefault: boolean;
}> = ({ onCanvasReady, onSelection, zoom, seedDefault }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !ref.current) return;
    initialized.current = true;
    const c = new FabricCanvas(ref.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff',
    });

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
      c.add(new Textbox('SUMMER', { left: 20, top: 120, fontSize: 72, fontWeight: 'bold', fill: '#1a1145', fontFamily: 'Poppins', width: 320 }));
      c.add(new Textbox('SALE', { left: 20, top: 200, fontSize: 96, fontWeight: 'bold', fill: '#FFC107', fontFamily: 'Poppins', width: 320 }));
      c.add(new Rect({ left: 20, top: 340, width: 240, height: 52, fill: '#8b5cf6', rx: 26, ry: 26 }));
      c.add(new Textbox('UP TO 50% OFF', { left: 40, top: 356, fontSize: 18, fontWeight: 'bold', fill: '#ffffff', width: 200 }));
    }
    c.on('selection:created', (e: any) => onSelection(e.selected?.[0]));
    c.on('selection:updated', (e: any) => onSelection(e.selected?.[0]));
    c.on('selection:cleared', () => onSelection(null));
    onCanvasReady(c);
  }, [onCanvasReady, onSelection, seedDefault]);

  return (
    <div className="flex-1 flex items-center justify-center overflow-auto" style={{ backgroundColor: '#1A1A1A' }}>
      <div
        className="relative bg-white"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.4)',
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'center center',
        }}
      >
        <canvas ref={ref} className="block" />
      </div>
    </div>
  );
};

/* ---------- Timeline ---------- */
const Timeline: React.FC = () => {
  const [playing, setPlaying] = useState(false);
  const tracks = [
    { label: 'Text', icon: Type, clips: [{ start: 0, duration: 40, label: 'SUMMER SALE' }] },
    { label: 'Image', icon: ImageIcon, clips: [{ start: 5, duration: 70, label: '' }] },
    { label: 'Shape', icon: Shapes, clips: [{ start: 10, duration: 30, label: 'Rectangle' }] },
    { label: 'Video', icon: Video, clips: [{ start: 25, duration: 60, label: '' }] },
    { label: 'Audio', icon: Music, clips: [{ start: 0, duration: 95, label: 'Background.mp3' }] },
  ];
  return (
    <div className="border-t" style={{ backgroundColor: '#1A1A1A', borderTopColor: '#2D2D2D' }}>
      <div className="flex h-9 items-center gap-3 px-3 border-b" style={{ borderColor: '#2D2D2D' }}>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-6 w-6 text-white" onClick={() => setPlaying(!playing)}>
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <span className="text-xs text-white font-mono">0:03</span>
        </div>
        <div className="flex-1" />
        <Slider defaultValue={[50]} max={100} className="w-24" />
      </div>
      <div className="flex h-7 text-[11px] px-[110px] border-b items-end pb-1" style={{ color: '#666666', borderColor: '#2D2D2D' }}>
        {['0s','2s','4s','6s','8s','10s','12s','14s'].map((t) => (
          <span key={t} className="flex-1">{t}</span>
        ))}
      </div>
      <div className="max-h-[100px] overflow-auto">
        {tracks.map((tr) => {
          const Icon = tr.icon;
          return (
            <div key={tr.label} className="flex items-stretch border-b h-9" style={{ borderColor: '#222222' }}>
              <div className="w-[110px] shrink-0 flex items-center gap-1.5 px-3 border-r text-xs" style={{ color: '#CCCCCC', borderColor: '#2D2D2D' }}>
                <Icon className="h-3.5 w-3.5" style={{ color: '#888888' }} />
                {tr.label}
              </div>
              <div className="relative flex-1">
                {tr.clips.map((c, i) => (
                  <div
                    key={i}
                    className="absolute top-1 bottom-1 rounded-md flex items-center px-2 text-[10px] font-medium text-white shadow-sm"
                    style={{
                      left: `${c.start}%`,
                      width: `${c.duration}%`,
                      backgroundColor: '#1B7A6B',
                    }}
                  >
                    {c.label && <span className="truncate">{c.label}</span>}
                  </div>
                ))}
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

/* ---------- Right Properties Panel ---------- */
const RightPanel: React.FC<{
  selected: any;
  canvas: FabricCanvas | null;
  onClose?: () => void;
}> = ({ selected, canvas, onClose }) => {
  const isText = selected?.type === 'textbox' || selected?.type === 'text';

  const update = (prop: string, val: any) => {
    if (!selected || !canvas) return;
    selected.set(prop, val);
    canvas.renderAll();
  };

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-card border-l">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-base font-semibold">{isText ? 'Text' : selected ? 'Properties' : 'Design'}</h2>
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
                  <div className="grid grid-cols-6 gap-1">
                    <button className="flex h-9 w-full items-center justify-center rounded-lg border hover:bg-muted"><span className="text-xs font-semibold">A</span></button>
                    <button className="flex h-9 w-full items-center justify-center rounded-lg border bg-accent/20"><div className="h-4 w-4 rounded bg-amber-400" /></button>
                    <button onClick={() => update('fontWeight', selected.fontWeight === 'bold' ? 'normal' : 'bold')} className={`flex h-9 w-full items-center justify-center rounded-lg border ${selected.fontWeight === 'bold' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Bold className="h-4 w-4" /></button>
                    <button onClick={() => update('fontStyle', selected.fontStyle === 'italic' ? 'normal' : 'italic')} className={`flex h-9 w-full items-center justify-center rounded-lg border ${selected.fontStyle === 'italic' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Italic className="h-4 w-4" /></button>
                    <button onClick={() => update('underline', !selected.underline)} className={`flex h-9 w-full items-center justify-center rounded-lg border ${selected.underline ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Underline className="h-4 w-4" /></button>
                    <button className="flex h-9 w-full items-center justify-center rounded-lg border hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
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
                        <Input type="number" step={0.1} className="h-9" value={selected.lineHeight || 1.2} onChange={(e) => update('lineHeight', parseFloat(e.target.value))} />
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] text-muted-foreground">Letter Spacing</p>
                        <Input className="h-9" defaultValue="0%" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Color</p>
                <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
                  <input type="color" value={selected.fill || '#FFC107'} onChange={(e) => update('fill', e.target.value)} className="h-6 w-6 rounded cursor-pointer border" />
                  <Input value={selected.fill || '#FFC107'} onChange={(e) => update('fill', e.target.value)} className="h-7 border-0 shadow-none px-2 text-xs font-mono uppercase" />
                  <span className="text-xs text-muted-foreground">100%</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Effects</p>
                <div className="space-y-2">
                  {[
                    { l: 'Shadow', on: true },
                    { l: 'Outline', on: false },
                    { l: 'Glow', on: false },
                  ].map((e) => (
                    <div key={e.l} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" /> {e.l}
                      </div>
                      <Switch defaultChecked={e.on} />
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

            <TabsContent value="position" className="p-4 mt-2 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="mb-1 text-[10px] text-muted-foreground">X</p><Input type="number" className="h-9" value={Math.round(selected.left || 0)} onChange={(e) => update('left', parseInt(e.target.value))} /></div>
                <div><p className="mb-1 text-[10px] text-muted-foreground">Y</p><Input type="number" className="h-9" value={Math.round(selected.top || 0)} onChange={(e) => update('top', parseInt(e.target.value))} /></div>
                <div><p className="mb-1 text-[10px] text-muted-foreground">Rotation</p><Input type="number" className="h-9" value={Math.round(selected.angle || 0)} onChange={(e) => update('angle', parseInt(e.target.value))} /></div>
                <div><p className="mb-1 text-[10px] text-muted-foreground">Scale</p><Input type="number" step={0.1} className="h-9" value={selected.scaleX || 1} onChange={(e) => { update('scaleX', parseFloat(e.target.value)); update('scaleY', parseFloat(e.target.value)); }} /></div>
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

/* ---------- Bottom Bar ---------- */
const BottomBar: React.FC<{ zoom: number; setZoom: (n: number) => void }> = ({ zoom, setZoom }) => (
  <div className="flex h-11 shrink-0 items-center gap-3 border-t bg-card px-3">
    <div className="flex items-center gap-2">
      <Monitor className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="flex items-center gap-3">
      <Slider value={[zoom]} onValueChange={([v]) => setZoom(v)} max={400} min={25} className="w-[120px]" />
      <span className="min-w-[36px] text-center text-xs font-medium text-muted-foreground">{zoom}%</span>
    </div>
    <div className="flex-1" />
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
        <Grid3x3 className="h-3.5 w-3.5" /> Pages
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7"><Grid3x3 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
      <Button variant="ghost" size="icon" className="h-7 w-7"><Maximize2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
      <Button variant="ghost" size="icon" className="h-7 w-7"><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></Button>
    </div>
  </div>
);

/* ---------- Main Editor ---------- */
const EditorInner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('templates');
  const [projectName, setProjectName] = useState('Summer Sale Campaign');
  const [zoom, setZoom] = useState(100);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [, forceUpdate] = useState(0);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<string | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const isMobile = useIsMobile();

  // Detect a pending template BEFORE the canvas mounts so we skip default seeds.
  const pendingRef = useRef(peekPendingEditorTemplate());
  const [hasPending] = useState(() => !!pendingRef.current);
  const { effectiveContext, brand } = useAIContext();
  const { data: brandKits } = useBrandKits();

  // On canvas ready + pending template → instantiate via TemplateEngine and load.
  useEffect(() => {
    if (!canvas) return;
    const pending = consumePendingEditorTemplate();
    if (!pending?.template) return;
    let cancelled = false;

    (async () => {
      try {
        const activeKit = brandKits?.find((k) => k.is_active) || brandKits?.[0];
        const inst = await TemplateEngine.instantiate(pending.template, {
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
          category: effectiveContext?.active_category ?? pending.template.category ?? null,
          goal: (effectiveContext as any)?.active_goal ?? pending.template.objective ?? null,
          platform: pending.template.platform ?? null,
          productName: pending.template.name,
        });
        if (cancelled) return;
        const json = inst.json;
        if (json?.background) canvas.backgroundColor = json.background as string;
        canvas.loadFromJSON(json as any, () => {
          canvas.renderAll();
          setProjectName(pending.template.name);
          toast({
            title: 'Template loaded',
            description: `${Object.keys(inst.resolvedVariables).length} placeholders resolved${inst.appliedBrand ? ' • Brand applied' : ''}.`,
          });
        });
      } catch (err) {
        console.error('[VisualEditor] instantiate failed', err);
        toast({
          title: 'Could not load template',
          description: 'Falling back to a blank canvas.',
          variant: 'destructive',
        });
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);

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

  const renderLeftPanel = () => {
    switch (activeTab) {
      case 'templates': return <TemplatesPanel />;
      case 'background': return <BackgroundPanel />;
      case 'ai-studio': return <AIStudioPanel />;
      case 'text': return <TextPanel onAdd={addText} />;
      case 'elements': return <ElementsPanel onAdd={addShape} />;
      case 'brand': return <BrandKitPanel />;
      case 'layers': return <LayersPanel canvas={canvas} version={0} />;
      case 'media': return <SimplePanel title="Media"><p className="text-xs text-muted-foreground">Import from your Media Library.</p></SimplePanel>;
      case 'uploads': return <SimplePanel title="Uploads"><p className="text-xs text-muted-foreground">Drag & drop files to upload.</p></SimplePanel>;
      case 'projects': return <SimplePanel title="Projects"><p className="text-xs text-muted-foreground">Your recent projects.</p></SimplePanel>;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <TopToolbar
        projectName={projectName}
        setProjectName={setProjectName}
        zoom={zoom}
        setZoom={setZoom}
        onExport={onExport}
        onToggleLeft={() => setLeftOpen(true)}
        onToggleRight={() => setRightOpen(true)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <IconRail active={activeTab} onChange={setActiveTab} />

        {/* Desktop left panel */}
        <div className="hidden md:flex w-[264px] shrink-0 border-r">
          {renderLeftPanel()}
        </div>

        {/* Center */}
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
          <CanvasSubToolbar />
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="relative flex flex-1 min-w-0 flex-col overflow-hidden">
              <CanvasStage
                zoom={zoom}
                seedDefault={!hasPending}
                onCanvasReady={(c) => setCanvas(c)}
                onSelection={(o) => { setSelected(o); forceUpdate((n) => n + 1); }}
              />
              {selected && (
                <div className="absolute left-1/2 -translate-x-1/2 top-3 z-30 pointer-events-auto animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full shadow-lg" style={{ backgroundColor: '#2D2D2D', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                    <div className="flex items-center gap-1.5 px-1">
                      <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white">Ask AdVista</span>
                    </div>
                    <div className="w-px h-5 mx-1" style={{ backgroundColor: '#444444' }} />
                    <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 text-white"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 text-white"><Link className="h-3.5 w-3.5" /></button>
                    <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 text-white"><Lock className="h-3.5 w-3.5" /></button>
                    <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 text-white"><Copy className="h-3.5 w-3.5" /></button>
                    <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 text-white"><Trash2 className="h-3.5 w-3.5" /></button>
                    <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 text-white"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 py-2" style={{ backgroundColor: '#1A1A1A', borderTop: '1px solid #2D2D2D' }}>
                <button className="flex items-center gap-2 h-9 rounded-lg px-4 text-xs" style={{ backgroundColor: '#2D2D2D', border: '1px solid #444444', color: '#CCCCCC' }}>
                  <Plus className="h-3.5 w-3.5" /> Add page
                </button>
                <button onClick={() => setTimelineOpen(!timelineOpen)}
                  className="flex items-center gap-1.5 h-9 rounded-lg px-3 text-xs" style={{ backgroundColor: '#2D2D2D', border: '1px solid #444444', color: timelineOpen ? '#6C63FF' : '#CCCCCC' }}>
                  <span className={`transition-transform duration-200 ${timelineOpen ? 'rotate-180' : ''}`}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </span>
                  Timeline
                </button>
              </div>
            </div>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${timelineOpen ? 'max-h-[200px]' : 'max-h-0'}`}>
            <Timeline />
          </div>
        </div>

        {/* Desktop right panel — contextual, shows only on selection */}
        {selected && (
          <div className="hidden lg:flex w-[240px] shrink-0">
            <RightPanel selected={selected} canvas={canvas} onClose={() => setRightOpen(false)} />
          </div>
        )}
      </div>

      <BottomBar zoom={zoom} setZoom={setZoom} />

      {/* Mobile floating bottom tabs */}
      {isMobile && (
        <div className="mobile-sticky-actions mx-2 mb-2 flex items-center justify-around rounded-2xl px-1 py-1.5 md:hidden">
          {[
            { id: 'assets', label: 'Assets', icon: Layout, onClick: () => setLeftOpen(true) },
            { id: 'layers', label: 'Layers', icon: LayersIcon, onClick: () => { setActiveTab('layers'); setLeftOpen(true); } },
            { id: 'ai', label: 'AI', icon: Sparkles, onClick: () => setRightOpen(true) },
            { id: 'props', label: 'Props', icon: Palette, onClick: () => setRightOpen(true) },
            { id: 'export', label: 'Export', icon: Download, onClick: onExport },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={t.onClick} className="flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 hover:bg-muted">
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile left sheet */}
      <Sheet open={leftOpen} onOpenChange={setLeftOpen}>
        <SheetContent side="left" className="w-[min(20rem,calc(100vw-2rem))] p-0 flex flex-col">
          <div className="flex items-center gap-1 border-b bg-[hsl(245,45%,10%)] p-2 overflow-x-auto">
            {LEFT_TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-2.5 py-2 text-white ${isActive ? 'bg-primary' : 'hover:bg-white/10'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[9px]">{t.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">{renderLeftPanel()}</div>
        </SheetContent>
      </Sheet>

      {/* Mobile right sheet */}
      <Sheet open={rightOpen} onOpenChange={setRightOpen}>
        <SheetContent side="right" className="w-[min(20rem,calc(100vw-2rem))] p-0">
          <RightPanel selected={selected} canvas={canvas} onClose={() => setRightOpen(false)} />
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

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
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  ChevronUp, Scissors, FlipHorizontal2,
} from 'lucide-react';
import { AIActionsMenu } from '@/components/visual-editor/ai/AIActionsMenu';
import { AIQuickActionsMenu } from '@/components/visual-editor/ai/AIQuickActionsMenu';
import { consumePendingEditorTemplate, peekPendingEditorTemplate } from '@/lib/templateEditorSession';
import { TemplateEngine } from '@/services/templates/TemplateEngine';
import { isOverlayScrim, loadTemplateJSONIntoCanvas, retryFailedImages, type ImageLayerStatus } from '@/services/templates/loadIntoCanvas';
import { supabase } from '@/integrations/supabase/client';
import { useAIContext } from '@/contexts/AIContext';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreativeService, creativeDocument } from '@/services/creative/CreativeService';
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
import { fitContentToFrame, frameForTemplate, frameFromAspect, measureContentBounds, placeFittedImage, publishArtboard, replaceImageKeepingFrame, scaleImageToCover } from '@/components/visual-editor/canvasImagePlacement';
import { selectionToolSet, SELECTION_ACTIONS, type ToolSetId } from '@/components/visual-editor/editorTools';
import { CREATE_RAIL, EDITOR_TOOLS, FONT_COMBOS, TEXT_STYLES, matchTextStyle, panelForCreateTool } from '@/components/visual-editor/createRail';
import { applyImageFilters, neutralImageAdjustments, type ImageAdjustments, type ImagePreset } from '@/components/visual-editor/imageAdjustments';

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
  { id: 1, title: 'SUMMER SALE', bg: 'from-orange-500 via-amber-400 to-orange-600' },
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
  { id: 8, title: 'WEEKEND OFFER 50%', bg: 'from-amber-400 via-orange-500 to-orange-700' },
  { id: 9, title: 'SPECIAL DISCOUNT 40%', bg: 'from-cyan-500 via-blue-600 to-indigo-700' },
];

/* ---------- Left Icon Rail ---------- */
const IconRail: React.FC<{ active: string; onChange: (id: string) => void }> = ({ active, onChange }) => (
  <aside className="studio-tool-rail hidden md:flex h-full w-[64px] shrink-0 flex-col items-stretch border-r">
    <div className="flex items-center justify-center py-3 border-b border-white/5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg">
        <Sparkles className="h-4 w-4 text-primary-foreground" />
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
      <div className="mx-auto mb-1 flex h-5 w-5 items-center justify-center rounded-lg bg-primary/90 text-primary-foreground">
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
  onSave: () => void;
  saveStatus: string;
  returnToCreate?: boolean;
  onBack?: () => void;
}> = ({ projectName, setProjectName, zoom, setZoom, onExport, onUndo, onRedo, canUndo, canRedo, onToggleLeft, onToggleRight, isMobile, showGrid, onToggleGrid, onFit, onPreview, onPublish, artboardLabel, onSave, saveStatus, returnToCreate = false, onBack }) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  if (isMobile) {
    return (
      <header className="flex h-12 shrink-0 items-center gap-0.5 border-b border-black/10 bg-white px-1.5 text-neutral-900">
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-neutral-900 hover:bg-black/5 hover:text-neutral-900" onClick={returnToCreate ? onBack : onToggleLeft} aria-label={returnToCreate ? 'Back to create ad' : 'Back to dashboard'}>
          {returnToCreate ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="min-w-0 flex-1 px-1">
          {editing ? (
            <Input autoFocus value={projectName} onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setEditing(false)} onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
              className="h-8 border-neutral-300 bg-white px-2 text-sm font-semibold text-neutral-900" />
          ) : (
            <button onClick={() => setEditing(true)} className="block w-full truncate text-left text-[15px] font-semibold leading-tight text-neutral-900">
              {projectName || 'Untitled creative'}
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-neutral-800 hover:bg-black/5 hover:text-neutral-900" onClick={onUndo} disabled={!canUndo} aria-label="Undo"><Undo2 className={`h-4 w-4 ${canUndo ? '' : 'opacity-30'}`} /></Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-neutral-800 hover:bg-black/5 hover:text-neutral-900" onClick={onRedo} disabled={!canRedo} aria-label="Redo"><Redo2 className={`h-4 w-4 ${canRedo ? '' : 'opacity-30'}`} /></Button>
        {returnToCreate ? (
          <Button size="sm" className="h-9 shrink-0 rounded-lg bg-primary px-3 text-primary-foreground hover:bg-primary/90" onClick={onSave}>
            {saveStatus === 'Saving…' ? 'Saving…' : 'Done'}
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-neutral-800 hover:bg-black/5 hover:text-neutral-900" onClick={onSave} aria-label="Save creative" title={saveStatus}><Check className="h-4 w-4" /></Button>
        )}
        <Button size="icon" className="ml-0.5 h-9 w-9 shrink-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" onClick={onExport} aria-label="Download">
          <Download className="h-4 w-4" />
        </Button>
      </header>
    );
  }

  return (
    <header className="studio-command-bar flex h-[60px] shrink-0 items-center gap-2 px-2 shadow-lg sm:px-4">
      <Button variant="ghost" size="icon" className="hidden h-9 w-9 text-inherit hover:bg-primary-foreground/10 hover:text-inherit md:inline-flex" onClick={() => (onBack ? onBack() : navigate('/dashboard'))} aria-label={returnToCreate ? 'Back to create ad' : 'Back to dashboard'}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex min-w-0 items-center gap-2">
        <span className="editor-heading hidden text-lg font-semibold lg:inline">AdVista Studio</span>
        <span className="hidden h-5 w-px bg-primary-foreground/30 lg:block" />
        {editing ? (
          <Input
            autoFocus
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            className="h-8 w-40 border-primary-foreground/30 bg-primary-foreground/10 text-sm font-semibold text-inherit sm:w-56"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="group flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-primary-foreground/10"
          >
            <span className="max-w-[140px] truncate text-sm font-semibold sm:max-w-[220px]">{projectName}</span>
            <Edit3 className="h-3.5 w-3.5 opacity-0 group-hover:opacity-80" />
          </button>
        )}
        <span className="hidden text-[11px] text-primary-foreground/70 xl:inline">{artboardLabel}</span>
      </div>

      <Button variant="ghost" size="sm" onClick={onSave} className="hidden gap-1 text-inherit sm:inline-flex" aria-label={returnToCreate ? 'Save and continue' : 'Save creative'}><Check className="h-3 w-3" />{returnToCreate ? (saveStatus === 'Saving…' ? 'Saving…' : 'Save & continue') : saveStatus}</Button>

      <div className="ml-1 hidden md:flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-inherit hover:bg-primary-foreground/10 hover:text-inherit" onClick={onUndo} disabled={!canUndo}><Undo2 className={`h-4 w-4 ${canUndo ? '' : 'opacity-30'}`} /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-inherit hover:bg-primary-foreground/10 hover:text-inherit" onClick={onRedo} disabled={!canRedo}><Redo2 className={`h-4 w-4 ${canRedo ? '' : 'opacity-30'}`} /></Button>
      </div>

      <div className="flex-1" />

      <div className="hidden items-center gap-1 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-1 py-1 md:flex">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.max(25, zoom - 10))}>
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-[42px] text-center text-xs font-medium">{zoom}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.min(400, zoom + 10))}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Button variant="ghost" size="icon" className="hidden h-9 w-9 text-inherit hover:bg-primary-foreground/10 hover:text-inherit lg:inline-flex" title="Grid" onClick={onToggleGrid}><Grid3x3 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="hidden h-9 w-9 text-inherit hover:bg-primary-foreground/10 hover:text-inherit lg:inline-flex" title="Fit to screen" onClick={onFit}><Maximize2 className="h-4 w-4" /></Button>

      <AIQuickActionsMenu />
      <Button variant="ghost" size="sm" className="hidden h-9 gap-1.5 text-inherit hover:bg-primary-foreground/10 hover:text-inherit sm:inline-flex" onClick={onPreview}>
        <Play className="h-3.5 w-3.5" /> Preview
      </Button>
      <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-inherit hover:bg-primary-foreground/10 hover:text-inherit" onClick={onExport}>
        <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
      </Button>
      <Button size="sm" variant="secondary" className="hidden h-9 gap-1.5 border-primary-foreground/20 bg-primary-foreground text-primary sm:inline-flex" onClick={onPublish}>
        <Send className="h-3.5 w-3.5" /> {returnToCreate ? 'Continue' : 'Publish'}
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
const TextPanel: React.FC<{
  onAdd: (text: string, size: number, weight: string, fontFamily?: string) => void;
  onMagicWrite: (prompt: string) => Promise<void>;
}> = ({ onAdd, onMagicWrite }) => {
  const [search, setSearch] = useState('');
  const [prompt, setPrompt] = useState('');
  const [writing, setWriting] = useState(false);
  const styles = TEXT_STYLES.filter((item) => matchTextStyle(search, item));
  const combos = FONT_COMBOS.filter((item) => matchTextStyle(search, item));
  const place = (item: (typeof TEXT_STYLES)[number]) => onAdd(item.text, item.size, item.weight, item.fontFamily);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#2D2D2D]">
      <div className="border-b border-[#3D3D3D] px-4 py-3">
        <h2 className="text-base font-bold text-white">Text</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#888888]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search fonts and combinations"
            className="h-10 w-full rounded-lg border border-[#555555] bg-[#3D3D3D] pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#888888]" />
        </div>
        <button type="button" onClick={() => place(TEXT_STYLES[0])}
          className="mb-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#7C3AED] text-sm font-semibold text-white hover:bg-[#6D28D9]">
          <Type className="h-4 w-4" /> Add a text box
        </button>
        <form className="mb-4 flex gap-2" onSubmit={async (event) => {
          event.preventDefault();
          const line = prompt.trim();
          if (!line || writing) return;
          setWriting(true);
          try { await onMagicWrite(line); setPrompt(''); }
          finally { setWriting(false); }
        }}>
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Product or offer"
            className="h-11 min-w-0 flex-1 rounded-lg border border-[#555555] bg-[#2D2D2D] px-3 text-sm text-white outline-none placeholder:text-[#888888]" />
          <button type="submit" disabled={writing || prompt.trim().length < 2}
            className="h-11 shrink-0 rounded-lg border border-[#555555] px-3 text-sm text-white disabled:opacity-50">
            {writing ? 'Writing…' : 'Magic Write'}
          </button>
        </form>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#888888]">Default text styles</p>
        <div className="space-y-1">
          {styles.map((item) => (
            <button key={item.id} type="button" onClick={() => place(item)}
              className="flex h-12 w-full items-center rounded-lg bg-[#2D2D2D] px-4 text-left text-white hover:bg-[#3D3D3D]"
              style={{ fontFamily: item.fontFamily, fontWeight: item.weight, fontSize: Math.min(item.size, 24) }}>
              {item.label}
            </button>
          ))}
        </div>
        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-[#888888]">Font combinations</p>
        <div className="grid grid-cols-2 gap-2">
          {combos.map((item) => (
            <button key={item.id} type="button" onClick={() => place(item)}
              className="flex h-[100px] items-center justify-center rounded-lg bg-[#1F1F1F] px-3 text-center hover:bg-[#3D3D3D]"
              style={{ fontFamily: item.fontFamily, fontWeight: item.weight, color: '#F5F0E6' }}>
              {item.label}
            </button>
          ))}
        </div>
        {styles.length === 0 && combos.length === 0 && (
          <p className="mt-4 text-center text-xs text-[#888888]">No text styles match “{search}”.</p>
        )}
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
              <span className="text-xs text-[#6E56F5]">See all →</span>
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

const BrandKitPanel: React.FC<{
  onUseColor: (hex: string) => void;
  onUseFont: (name: string) => void;
  onUseLogo: (url: string) => void;
}> = ({ onUseColor, onUseFont, onUseLogo }) => {
  const { data: kits } = useBrandKits();
  const active = kits?.find((k) => k.is_active) || kits?.[0];
  const { data: colors } = useBrandColors(active?.id);
  const { data: fonts } = useBrandFonts(active?.id);
  const palette = [active?.primary_color, active?.secondary_color, active?.accent_color, ...(colors?.map((c) => c.hex) || [])].filter(Boolean) as string[];
  return (
    <SimplePanel title="Brand">
      {!active ? (
        <p className="text-xs text-muted-foreground">No brand kit yet. Create one on the Brand Kit page, then its colours, logo, and fonts can be placed here.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold">Logo</p>
            <button type="button" disabled={!active.logo_url} onClick={() => active.logo_url && onUseLogo(active.logo_url)}
              className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border bg-muted/40 disabled:cursor-default">
              {active.logo_url ? <img src={active.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-muted-foreground">No logo</span>}
            </button>
            {active.logo_url && <p className="mt-1 text-[11px] text-muted-foreground">Tap the logo to place it on the canvas.</p>}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold">Colours</p>
            <div className="grid grid-cols-6 gap-2">
              {palette.map((c) => (
                <button key={c} type="button" onClick={() => onUseColor(c)} className="aspect-square rounded-lg border" style={{ background: c }} title={`Use ${c}`} />
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">A colour fills the selected layer, or the canvas when nothing is selected.</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold">Fonts</p>
            <div className="space-y-1.5">
              {fonts?.length ? fonts.map((f) => (
                <button key={f.id} type="button" onClick={() => onUseFont(f.name)} className="w-full rounded-lg border px-3 py-2 text-left text-xs hover:bg-muted">{f.name}</button>
              )) : <p className="text-xs text-muted-foreground">No fonts in this kit.</p>}
            </div>
          </div>
        </div>
      )}
    </SimplePanel>
  );
};

const ProjectsPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['editor-projects', user?.id],
    enabled: !!user?.id,
    queryFn: () => CreativeService.list(user!.id),
  });
  return (
    <SimplePanel title="Projects">
      {!user && <p className="text-xs text-muted-foreground">Sign in to open designs you have saved.</p>}
      {user && isLoading && <p className="text-xs text-muted-foreground">Loading your designs…</p>}
      {error && <p className="text-xs text-destructive">Could not load saved designs.</p>}
      {user && !isLoading && data.length === 0 && <p className="text-xs text-muted-foreground">No saved designs yet. Save this canvas and it will appear here.</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {data.map((ad) => (
          <button key={ad.id} type="button" onClick={() => navigate(`/visual-editor?adId=${ad.id}`)}
            className="overflow-hidden rounded-xl border text-left">
            {ad.preview_url ? <img src={ad.preview_url} alt="" className="aspect-square w-full object-cover" /> : <div className="aspect-square bg-muted" />}
            <p className="truncate px-2 py-2 text-xs font-semibold">{ad.name || 'Untitled'}</p>
          </button>
        ))}
      </div>
    </SimplePanel>
  );
};

const ToolsSheet: React.FC<{ onOpen: (id: string) => void }> = ({ onOpen }) => (
  <div className="grid grid-cols-2 gap-2">
    {EDITOR_TOOLS.map((tool) => (
      <button key={tool.id} type="button" onClick={() => onOpen(tool.id)}
        className="rounded-xl border border-white/10 bg-[#2D2D2D] p-3 text-left hover:bg-[#3D3D3D]">
        <p className="text-sm font-semibold text-white">{tool.label}</p>
        <p className="mt-1 text-[11px] leading-snug text-[#AAAAAA]">{tool.hint}</p>
      </button>
    ))}
  </div>
);

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

  const thumbFor = (o: any): string | null => {
    try {
      const w = (o.width || 1) * (o.scaleX || 1);
      return o.toDataURL?.({ format: 'png', multiplier: Math.min(1, 96 / Math.max(1, w)) }) ?? null;
    } catch { return null; }
  };
  const roleFor = (o: any) => {
    const src = `${o?.variableKey ?? ''} ${o?.name ?? ''}`.toLowerCase();
    if (src.includes('headline') || src.includes('hook')) return 'Hook';
    if (src.includes('cta')) return 'CTA';
    if (src.includes('logo')) return 'Logo';
    if (src.includes('product') || src.includes('image')) return 'Hero';
    return null;
  };
  const nameFor = (o: any) =>
    (o.type === 'textbox' || o.type === 'i-text' || o.type === 'text')
      ? (o.text?.slice(0, 28) || 'Text')
      : (o.name || (o.type ? o.type.charAt(0).toUpperCase() + o.type.slice(1) : 'Layer'));

  return (
    <div className="flex h-full min-h-0 flex-col" data-version={version}>
      <div className="flex items-center justify-between px-1 pb-3">
        <h3 className="editor-heading text-base font-semibold text-studio-text">Layers</h3>
        <span className="text-xs text-studio-muted">{objs.length} item{objs.length === 1 ? '' : 's'}</span>
      </div>
      {objs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-studio-line px-4 py-8 text-center text-xs text-studio-muted">
          Layers will appear here as you add elements.
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-2">
          {[...objs].reverse().map((o: any, i) => {
            const realIdx = objs.length - 1 - i;
            const locked = isLocked(o);
            const hidden = o.visible === false;
            const isActive = selected === o;
            const thumb = thumbFor(o);
            const role = roleFor(o);
            return (
              <div key={realIdx}
                onClick={() => {
                  if (!canvas) return;
                  canvas.setActiveObject(o);
                  canvas.requestRenderAll();
                  onSelect(o);
                }}
                className={`group flex cursor-pointer items-center gap-2 rounded-xl border p-2 transition-all
                  ${isActive ? 'border-primary bg-primary/10' : 'border-studio-line bg-studio-panel-raised hover:border-studio-muted/40'}
                  ${dragIdx === i ? 'opacity-50' : ''}
                  ${hidden ? 'opacity-50' : ''}
                `}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx === null || dragIdx === i) { setDragIdx(null); return; }
                  const from = objs.length - 1 - dragIdx;
                  reorderLayer(canvas, objs[from], realIdx);
                  setDragIdx(null);
                  onChanged();
                }}
                onDragEnd={() => setDragIdx(null)}
              >
                <GripVertical className="hidden h-4 w-4 shrink-0 cursor-grab text-studio-muted sm:block" />
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background"
                  style={{ backgroundColor: '#ffffff', backgroundImage: 'repeating-conic-gradient(rgba(0,0,0,0.06) 0 25%, transparent 0 50%)', backgroundSize: '10px 10px' }}>
                  {thumb ? <img src={thumb} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-studio-muted">{typeIcon(o.type)}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-studio-text">{nameFor(o)}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-studio-muted">
                    {typeIcon(o.type)}
                    {role && <span className="rounded-full bg-primary/20 px-1.5 py-px text-[10px] text-primary-glow">✦ {role}</span>}
                    {locked && <span>Locked</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center">
                  <button onClick={(e) => { e.stopPropagation(); setVisible(canvas, o, hidden); onChanged(); }} aria-label={hidden ? 'Show' : 'Hide'}
                    className="flex h-8 w-7 items-center justify-center rounded-md text-studio-muted hover:text-studio-text">
                    {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setLocked(canvas, o, !locked); onChanged(); }} aria-label={locked ? 'Unlock' : 'Lock'}
                    className="flex h-8 w-7 items-center justify-center rounded-md text-studio-muted hover:text-studio-text">
                    {locked ? <Lock className="h-4 w-4 text-primary-glow" /> : <Unlock className="h-4 w-4" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteObject(canvas, o); onSelect(null); onChanged(); }} aria-label="Delete"
                    className="flex h-8 w-7 items-center justify-center rounded-md text-studio-muted hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ---------- Canvas Sub-toolbar ---------- */
const CanvasSubToolbar: React.FC<{
  canvas: FabricCanvas | null;
  selected: any;
  onChanged: () => void;
  preset: string;
  onPresetChange: (v: string) => void;
  customArtboard?: { label: string; width: number; height: number } | null;
  onOpenAnimate: () => void;
  onOpenPosition: () => void;
}> = ({ canvas, selected, onChanged, preset, onPresetChange, customArtboard, onOpenAnimate, onOpenPosition }) => {
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
        <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {customArtboard && <SelectItem value="custom">{customArtboard.label}</SelectItem>}
          {Object.entries(ARTBOARD_PRESETS).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

/* ---------- Canvas Stage ---------- */
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const SERIALIZED_CANVAS_PROPS = ['id', 'name', 'mediaFit', 'variableKey', 'brandReplaceable', 'aiReplaceable', 'brandCompliant'];

const MIN_ZOOM = 10;
const MAX_ZOOM = 400;

// Single source of spacing around the artboard: the gutter lives in the fit
// math only, never as padding on the centering shell (that would double up
// and crop the design at exact fit).
const GUTTER_MOBILE = 16;
const GUTTER_DESKTOP = 24;

// Bottom band reserved for page dots + zoom pill so they never cover the artboard.
const CONTROL_BAND = 52;

const fitZoom = (isMobile: boolean, containerWidth: number, containerHeight: number, w: number, h: number, controlBand = CONTROL_BAND): number => {
  const margin = isMobile ? GUTTER_MOBILE : GUTTER_DESKTOP;
  const availW = Math.max(40, containerWidth - margin * 2);
  const availH = Math.max(40, containerHeight - margin - controlBand);
  const z = Math.min(availW / w, availH / h) * 100;
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
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
  controlBand?: number;
  imageStatuses?: ImageLayerStatus[];
  onRetryImages?: () => void;
  retryingImages?: boolean;
  emptyOverlay?: React.ReactNode;
}> = ({ onCanvasReady, onSelection, zoom, onZoomChange, seedDefault, onCanvasWrapperRef, isMobile, artboard, showGrid, fitToken, controlBand = CONTROL_BAND, imageStatuses = [], onRetryImages, retryingImages, emptyOverlay }) => {
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
    const z = fitZoom(isMobile, rect.width, rect.height, artboard.width, artboard.height, controlBand);
    // Floor so rounding can never push the scaled artboard past the viewport.
    onZoomChange(Math.max(5, Math.floor(z)));
  }, [isMobile, artboard.width, artboard.height, onZoomChange, controlBand]);

  useEffect(() => {
    applyFit();
    // Panels/sheets/timeline animate — re-fit once the transition settles so the
    // artboard uses the real free space instead of the mid-animation box.
    const raf = requestAnimationFrame(applyFit);
    const t = setTimeout(applyFit, 320);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
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


  // Keep the Fabric surface the same size as the artboard. Object fitting happens
  // where the image or template is applied, so a later size sync cannot pull layers apart.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    if (c.getWidth() === artboard.width && c.getHeight() === artboard.height) return;
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
    <div ref={containerRef} className="canvas-viewport relative flex-1 min-w-0 overflow-hidden select-none"
      style={{ backgroundColor: 'hsl(var(--studio-bg))', boxSizing: 'border-box' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >

      {/* Loading skeleton */}
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-studio-bg">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-studio-panel" />
          <div className="h-3 w-32 animate-pulse rounded-full bg-studio-panel" />
          <div className="h-2 w-24 animate-pulse rounded-full bg-studio-panel" />
        </div>
      )}
      {/* Scroll layer: pans when the user zooms past fit, never clips the artboard. */}
      <div className="absolute inset-0 overflow-auto">
        {/* Centering shell: grid + margin:auto centers the scaled footprint and,
            unlike place-items-center, never clips the top/left when it overflows. */}
        <div className="grid min-h-full min-w-full">
          {/* Outer box carries the *scaled* footprint so layout/centering is correct at any zoom. */}
          <div
            className="relative shrink-0"
            style={{
              margin: 'auto',
              width: artboard.width * (zoom / 100),
              height: artboard.height * (zoom / 100),
            }}
          >
            {emptyOverlay && (
              <div className="absolute inset-0 z-20 overflow-hidden" style={{ containerType: 'size' } as React.CSSProperties}>
                {emptyOverlay}
              </div>
            )}
            <div
              ref={wrapperRef}
              className="canvas-card absolute left-0 top-0 overflow-hidden bg-background"
              style={{
                width: artboard.width,
                height: artboard.height,
                boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 18px 48px -12px rgba(0,0,0,0.65)',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
              }}
            >
              <canvas ref={ref} className="block" />
              {showGrid && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(110,86,245,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(110,86,245,0.25) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
              )}
            </div>
          </div>
        </div>
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

      {/* Page indicator (Canva-style) */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5" aria-hidden>
        <span className="h-1.5 w-5 rounded-full bg-studio-muted/70" />
        <span className="h-1.5 w-1.5 rounded-full bg-studio-muted/30" />
      </div>

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
  if (t === 'textbox' || t === 'text' || t === 'i-text') {
    const source = `${obj?.variableKey ?? ''} ${obj?.name ?? ''} ${obj?.text ?? ''}`.toLowerCase();
    const role = source.includes('headline') || source.includes('hook') ? 'Hook' : source.includes('cta') || source.includes('action') ? 'CTA' : 'Body';
    return { icon: Type, color: '#1B7A6B', label: `✦ ${role} · ${(obj.text || 'Text').toString().slice(0, 18)}` };
  }
  if (t === 'image') return { icon: ImageIcon, color: '#2563A8', label: obj.name || 'Image' };
  if (t === 'video') return { icon: Video, color: '#6E56F5', label: obj.name || 'Video' };
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

const CREATE_TOOL_ICONS = {
  templates: Layout,
  elements: Shapes,
  text: Type,
  camera: ImageIcon,
  brand: Sparkles,
  uploads: Upload,
  tools: Grid3x3,
} as const;

const CREATE_TOOLS: ToolItem[] = CREATE_RAIL.map((tool) => ({
  id: tool.id,
  label: tool.label,
  icon: CREATE_TOOL_ICONS[tool.id],
}));

const ACTION_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'edit-text': Edit3,
  font: Type,
  'text-style': Bold,
  'font-size': Type,
  colour: Palette,
  fill: Palette,
  opacity: Eye,
  replace: RefreshCw,
  flip: FlipHorizontal2,
  crop: Maximize2,
  adjust: Sun,
  position: MoveUp,
  border: SquareIcon,
  radius: Box,
  align: AlignVerticalJustifyCenter,
};

const toolsForSet = (set: ToolSetId): ToolItem[] => {
  if (set === 'create') return CREATE_TOOLS;
  return SELECTION_ACTIONS[set].map((action) => ({
    id: action.id,
    label: action.label,
    icon: ACTION_ICONS[action.id] ?? MoreHorizontal,
  }));
};

const getToolsForSelection = (selected: any): ToolItem[] => toolsForSet(selectionToolSet(selected));

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
  <nav className="studio-tool-rail z-40 flex min-h-[66px] shrink-0 items-center gap-0.5 overflow-x-auto border-t px-2 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {tools.map((t) => {
      const Icon = t.icon;
      const isActive = active === t.id;
      return (
        <button key={t.id} type="button" onClick={() => onToolTap(t.id)}
          className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5 transition-colors ${
            isActive ? 'text-primary' : 'text-inherit hover:bg-studio-panel'
          }`}>
          <span className={`grid h-8 w-8 place-items-center rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : ''}`}>
            <Icon className="h-5 w-5" />
          </span>
          <span className="w-full text-center text-[9px] font-medium leading-tight">{t.label}</span>
        </button>
      );
    })}
  </nav>
);

const SelectionBar: React.FC<{
  tools: ToolItem[];
  active: string | null;
  onTool: (id: string) => void;
  onDone: () => void;
  variant: 'dock' | 'float';
}> = ({ tools, active, onTool, onDone, variant }) => {
  const buttons = tools.map((tool) => {
    const Icon = tool.icon;
    const on = active === tool.id;
    return (
      <button key={tool.id} type="button" onClick={() => onTool(tool.id)}
        className={variant === 'float'
          ? `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${on ? 'bg-white text-neutral-900' : 'text-white/90 hover:bg-white/10'}`
          : `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5 text-[9px] font-medium leading-tight ${on ? 'text-primary' : 'text-inherit'}`}>
        <Icon className={variant === 'float' ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
        <span className={variant === 'float' ? '' : 'w-full truncate text-center'}>{tool.label}</span>
      </button>
    );
  });
  if (variant === 'float') {
    return (
      <div data-selection-bar="float" className="flex shrink-0 justify-center px-3 py-2">
        <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-white/10 bg-[#1a1a1a] px-1.5 py-1 shadow-lg [scrollbar-width:none]">
          {buttons}
          <button type="button" onClick={onDone} aria-label="Done editing" className="ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-neutral-900">
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
  return (
    <nav data-selection-bar="dock" className="studio-tool-rail z-40 flex min-h-[66px] shrink-0 items-center gap-0.5 border-t px-1.5 py-1">
      {buttons}
      <button type="button" onClick={onDone} aria-label="Done editing" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-4 w-4" />
      </button>
    </nav>
  );
};

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

const hexColor = (value: unknown, fallback = '#000000') =>
  typeof value === 'string' && /^#(?:[0-9a-f]{6})$/i.test(value) ? value : fallback;

const ColorToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const update = (prop: string, val: any) => { if (!selected || !canvas || isOverlayScrim(selected)) return; selected.set(prop, val); canvas.renderAll(); };
  const colors = ['#FF0000','#FF6B6B','#FF69B4','#800080','#008080','#0000FF','#FFA500','#FFD700','#00FF00','#008000','#000000','#555555','#888888','#BBBBBB','#DDDDDD','#FFFFFF'];
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground">Brand Colours</p>
      <div className="flex gap-2">{['#6E56F5','#FF6B6B','#00C9A7'].map(c => <button key={c} onClick={() => update('fill', c)} className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: c }} />)}</div>
      <p className="text-xs font-semibold text-muted-foreground">Recent</p>
      <div className="flex gap-2">{['#FFC107','#6E56F5','#ffffff'].map(c => <button key={c} onClick={() => update('fill', c)} className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: c }} />)}</div>
      <p className="text-xs font-semibold text-muted-foreground">Palette</p>
      <div className="grid grid-cols-8 gap-1.5">{colors.map(c => <button key={c} onClick={() => update('fill', c)} className="aspect-square rounded-lg border border-border" style={{ backgroundColor: c }} />)}</div>
      <div className="flex items-center gap-2 rounded-xl border px-3 py-2"><input type="color" value={hexColor(selected?.fill)} onChange={(e) => update('fill', e.target.value)} className="h-6 w-6 rounded cursor-pointer border" /><span className="text-xs font-mono uppercase">{typeof selected?.fill === 'string' ? selected.fill : '#000000'}</span></div>
    </div>
  );
};

const AnimateToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = () => (
  <UnavailableTool
    title="Animation is not applied yet"
    detail="Entrance presets are listed in the design, but this editor does not write animation onto the canvas. Nothing on the artboard changes from this panel."
  />
);

const paintObject = (selected: any, canvas: FabricCanvas | null, props: Record<string, unknown>) => {
  if (!selected || !canvas) return;
  selected.set(props);
  selected.setCoords?.();
  canvas.requestRenderAll();
};

const setObjectEffect = (selected: any, canvas: FabricCanvas | null, kind: 'shadow' | 'outline' | 'glow', on: boolean) => {
  if (!selected || !canvas) return;
  if (kind === 'outline') {
    paintObject(selected, canvas, on ? { stroke: '#000000', strokeWidth: 2 } : { strokeWidth: 0 });
    return;
  }
  if (!on) {
    paintObject(selected, canvas, { shadow: null });
    return;
  }
  paintObject(selected, canvas, {
    shadow: new Shadow(
      kind === 'glow'
        ? { color: (selected.fill as string) || '#ffffff', blur: 24, offsetX: 0, offsetY: 0 }
        : { color: 'rgba(0,0,0,0.35)', blur: 12, offsetX: 0, offsetY: 6 },
    ),
  });
};

const EffectsToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const [, bump] = useState(0);
  const refresh = () => bump((n) => n + 1);
  const shadowOn = !!selected?.shadow && (selected.shadow.blur ?? 0) <= 16;
  const glowOn = !!selected?.shadow && (selected.shadow.blur ?? 0) > 16;
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {([
          { l: 'Shadow', k: 'shadow' as const, on: shadowOn },
          { l: 'Outline', k: 'outline' as const, on: (selected?.strokeWidth ?? 0) > 0 },
          { l: 'Glow', k: 'glow' as const, on: glowOn },
        ]).map((effect) => (
          <div key={effect.k} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <span className="text-xs font-medium">{effect.l}</span>
            <Switch checked={effect.on} onCheckedChange={(on) => { setObjectEffect(selected, canvas, effect.k, on); refresh(); }} />
          </div>
        ))}
      </div>
      <OpacityToolPanel selected={selected} canvas={canvas} />
    </div>
  );
};

const PositionToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const [, bump] = useState(0);
  const update = (prop: string, val: any) => {
    if (!selected || !canvas) return;
    selected.set(prop, val);
    selected.setCoords?.();
    canvas.requestRenderAll();
    bump((n) => n + 1);
  };
  const arrange = (dir: 'up' | 'down' | 'front' | 'back') => {
    moveLayer(canvas, selected, dir);
    bump((n) => n + 1);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => arrange('up')}>Forward</Button>
        <Button variant="outline" onClick={() => arrange('down')}>Backward</Button>
        <Button variant="outline" onClick={() => arrange('front')}>To front</Button>
        <Button variant="outline" onClick={() => arrange('back')}>To back</Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><p className="mb-1 text-xs text-muted-foreground">X</p><Input type="number" className="h-9" value={Math.round(selected?.left || 0)} onChange={(e) => update('left', parseInt(e.target.value) || 0)} /></div>
        <div><p className="mb-1 text-xs text-muted-foreground">Y</p><Input type="number" className="h-9" value={Math.round(selected?.top || 0)} onChange={(e) => update('top', parseInt(e.target.value) || 0)} /></div>
        <div><p className="mb-1 text-xs text-muted-foreground">Rotation</p><Input type="number" className="h-9" value={Math.round(selected?.angle || 0)} onChange={(e) => update('angle', parseInt(e.target.value) || 0)} /></div>
        <div><p className="mb-1 text-xs text-muted-foreground">Scale</p><Input type="number" step={0.1} className="h-9" value={Number(selected?.scaleX || 1).toFixed(2)} onChange={(e) => { const n = parseFloat(e.target.value) || 1; update('scaleX', n); update('scaleY', n); }} /></div>
      </div>
    </div>
  );
};

const SpacingToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const update = (prop: string, val: any) => { if (!selected || !canvas) return; selected.set(prop, val); canvas.renderAll(); };
  return (
    <div className="space-y-3">
      <div><p className="mb-1 text-xs text-muted-foreground">Line Height</p><Input type="number" step={0.1} className="h-9" value={selected?.lineHeight || 1.2} onChange={(e) => update('lineHeight', parseFloat(e.target.value))} /></div>
      <div><p className="mb-1 text-xs text-muted-foreground">Letter Spacing</p><div className="flex items-center gap-2"><Slider value={[Math.round(selected?.charSpacing || 0)]} max={400} onValueChange={([v]) => update('charSpacing', v)} className="flex-1" /><span className="text-xs w-10 text-right">{Math.round(selected?.charSpacing || 0)}</span></div></div>
      <div><p className="mb-1 text-xs text-muted-foreground">Padding</p><Input type="number" className="h-9" defaultValue={0} /></div>
    </div>
  );
};

const FillToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = (props) => <ColorToolPanel {...props} />;

const StrokeToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const [width, setWidth] = useState(Math.round(selected?.strokeWidth ?? 0));
  const apply = (next: number) => {
    setWidth(next);
    paintObject(selected, canvas, { strokeWidth: next, stroke: selected?.stroke || '#111111' });
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Stroke weight</span>
        <span className="tabular-nums">{width}</span>
      </div>
      <Slider value={[width]} max={40} onValueChange={([value]) => apply(value)} />
      <div className="flex flex-wrap gap-2">
        {['#111111', '#ffffff', '#6E56F5', '#ef4444', '#2563eb'].map((color) => (
          <button key={color} type="button" aria-label={color} onClick={() => paintObject(selected, canvas, { stroke: color, strokeWidth: width || 4 })}
            className="h-8 w-8 rounded-full border border-white/20" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  );
};

const FlipToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const [flip, setFlip] = useState({ x: !!selected?.flipX, y: !!selected?.flipY });
  const toggle = (axis: 'x' | 'y') => {
    if (!selected || !canvas) return;
    const next = { ...flip, [axis]: !flip[axis] };
    selected.set(axis === 'x' ? 'flipX' : 'flipY', next[axis]);
    selected.setCoords?.();
    canvas.requestRenderAll();
    setFlip(next);
  };
  return (
    <div className="grid grid-cols-1 gap-2">
      <Button variant="outline" aria-pressed={flip.x} onClick={() => toggle('x')}>Flip horizontal</Button>
      <Button variant="outline" aria-pressed={flip.y} onClick={() => toggle('y')}>Flip vertical</Button>
    </div>
  );
};

const FontSizeToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const [size, setSize] = useState(Math.round(selected?.fontSize || 32));
  const apply = (next: number) => {
    setSize(next);
    paintObject(selected, canvas, { fontSize: next });
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Font size</span>
        <span className="tabular-nums">{size}</span>
      </div>
      <Slider value={[size]} min={10} max={160} onValueChange={([value]) => apply(value)} />
    </div>
  );
};

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

const UnavailableTool = ({ title, detail }: { title: string; detail: string }) => (
  <div className="rounded-xl border border-dashed p-4">
    <p className="text-sm font-medium">{title}</p>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
  </div>
);

const ReplaceImageToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const replace = async (file: File) => {
    if (!canvas || !selected) return;
    const url = URL.createObjectURL(file);
    try {
      await replaceImageKeepingFrame(canvas, selected, url);
      canvas.requestRenderAll();
    } catch {
      toast({ title: 'Could not load image', description: 'Try a different file.', variant: 'destructive' });
    }
  };
  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) replace(file); e.target.value = ''; }} />
      <Button className="w-full" onClick={() => fileRef.current?.click()}>Choose a replacement image</Button>
      <p className="text-xs text-muted-foreground">The new image fills the current frame without stretching it.</p>
    </div>
  );
};

const CropToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const element = selected?.getElement?.();
  const naturalW = element?.naturalWidth || element?.videoWidth || selected?.width || 1;
  const naturalH = element?.naturalHeight || element?.videoHeight || selected?.height || 1;
  const [inset, setInset] = useState(0);
  const apply = (percent: number) => {
    if (!selected || !canvas) return;
    const frameW = (selected.width || 1) * (selected.scaleX || 1);
    const frameH = (selected.height || 1) * (selected.scaleY || 1);
    const cropX = Math.round(naturalW * percent);
    const cropY = Math.round(naturalH * percent);
    const width = Math.max(1, naturalW - cropX * 2);
    const height = Math.max(1, naturalH - cropY * 2);
    selected.set({ cropX, cropY, width, height, scaleX: frameW / width, scaleY: frameH / height });
    selected.setCoords?.();
    canvas.requestRenderAll();
    setInset(percent);
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Crop equally from every edge. The frame on the artboard stays the same size.</p>
      <div className="flex items-center gap-3">
        <Slider value={[Math.round(inset * 100)]} max={40} onValueChange={([value]) => apply(value / 100)} className="flex-1" />
        <span className="w-10 text-right text-xs tabular-nums">{Math.round(inset * 100)}%</span>
      </div>
    </div>
  );
};

const ImageFilterToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null; mode: 'filters' | 'adjust' }> = ({ selected, canvas, mode }) => {
  const stored = (selected?.__advistaAdjust ?? neutralImageAdjustments) as ImageAdjustments;
  const [adjust, setAdjust] = useState<ImageAdjustments>(stored);
  if (!selected || typeof selected.applyFilters !== "function") {
    return <UnavailableTool title="Filters apply to images" detail="The selected object cannot take Fabric image filters, so this panel leaves it unchanged." />;
  }
  const commit = (next: ImageAdjustments) => {
    setAdjust(next);
    if (selected) selected.__advistaAdjust = next;
    applyImageFilters(selected, canvas, next);
  };
  return (
    <div className="space-y-4">
      {mode === 'filters' && (
        <div className="grid grid-cols-3 gap-2">
          {(['none', 'grayscale', 'sepia'] as ImagePreset[]).map((preset) => (
            <button key={preset} type="button" onClick={() => commit({ ...adjust, preset })} className={`rounded-lg border px-2 py-2 text-xs capitalize ${adjust.preset === preset ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}>{preset}</button>
          ))}
        </div>
      )}
      {mode === 'adjust' && (
        <>
          {([
            ['brightness', 'Brightness'],
            ['contrast', 'Contrast'],
            ['saturation', 'Saturation'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{label}</span>
                <span className="tabular-nums">{Math.round(adjust[key] * 100)}</span>
              </div>
              <Slider value={[Math.round(adjust[key] * 100)]} min={-100} max={100} onValueChange={([value]) => commit({ ...adjust, [key]: value / 100 })} />
            </div>
          ))}
        </>
      )}
    </div>
  );
};

const RadiusToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  if (selected?.type !== 'rect') {
    return <UnavailableTool title="Corner radius applies to rectangles" detail="Circles, ellipses, and triangles already have their own outline. Select a rectangle to round its corners." />;
  }
  const radius = Math.round(selected.rx || 0);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Corner radius</span><span className="tabular-nums">{radius}px</span></div>
      <Slider value={[radius]} max={120} onValueChange={([value]) => paintObject(selected, canvas, { rx: value, ry: value })} />
    </div>
  );
};

const ShadowToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => {
  const [, bump] = useState(0);
  const blur = Math.round(selected?.shadow?.blur ?? 0);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
        <span className="text-xs font-medium">Drop shadow</span>
        <Switch checked={!!selected?.shadow} onCheckedChange={(on) => { setObjectEffect(selected, canvas, 'shadow', on); bump((n) => n + 1); }} />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground"><span>Blur</span><span className="tabular-nums">{blur}px</span></div>
        <Slider value={[blur]} max={40} onValueChange={([value]) => {
          paintObject(selected, canvas, { shadow: new Shadow({ color: 'rgba(0,0,0,0.35)', blur: value, offsetX: 0, offsetY: 6 }) });
          bump((n) => n + 1);
        }} />
      </div>
    </div>
  );
};

const LayerOrderToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => (
  <div className="grid grid-cols-2 gap-2">
    <Button variant="outline" onClick={() => moveLayer(canvas, selected, 'front')}>Bring to front</Button>
    <Button variant="outline" onClick={() => moveLayer(canvas, selected, 'up')}>Bring forward</Button>
    <Button variant="outline" onClick={() => moveLayer(canvas, selected, 'down')}>Send backward</Button>
    <Button variant="outline" onClick={() => moveLayer(canvas, selected, 'back')}>Send to back</Button>
  </div>
);

const MoreObjectToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => (
  <div className="grid grid-cols-2 gap-2">
    <Button variant="outline" onClick={() => { duplicateObject(canvas, selected); }}>Duplicate</Button>
    <Button variant="outline" className="text-destructive" onClick={() => deleteObject(canvas, selected)}>Delete</Button>
    <Button variant="outline" onClick={() => setLocked(canvas, selected, !isLocked(selected))}>{isLocked(selected) ? 'Unlock' : 'Lock'}</Button>
    <Button variant="outline" onClick={() => setVisible(canvas, selected, selected?.visible === false)}>{selected?.visible === false ? 'Show' : 'Hide'}</Button>
  </div>
);

const AlignToolPanel: React.FC<{ selected: any; canvas: FabricCanvas | null }> = ({ selected, canvas }) => (
  <div className="grid grid-cols-2 gap-2">
    {([
      ['left', 'Align left'],
      ['center-h', 'Center'],
      ['right', 'Align right'],
      ['top', 'Align top'],
      ['center-v', 'Middle'],
      ['bottom', 'Align bottom'],
    ] as const).map(([value, label]) => (
      <Button key={value} variant="outline" onClick={() => alignObject(canvas, selected, value)}>{label}</Button>
    ))}
  </div>
);

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
    case 'font-size': return <FontSizeToolPanel {...props} />;
    case 'opacity': return <OpacityToolPanel {...props} />;
    case 'border': return <StrokeToolPanel {...props} />;
    case 'flip': return <FlipToolPanel {...props} />;
    case 'replace': return <ReplaceImageToolPanel {...props} />;
    case 'crop': return <CropToolPanel {...props} />;
    case 'filters': return <ImageFilterToolPanel {...props} mode="filters" />;
    case 'adjust': return <ImageFilterToolPanel {...props} mode="adjust" />;
    case 'radius': return <RadiusToolPanel {...props} />;
    case 'shadow': return <ShadowToolPanel {...props} />;
    case 'layers': return <LayerOrderToolPanel {...props} />;
    case 'more': return <MoreObjectToolPanel {...props} />;
    case 'align': return <AlignToolPanel {...props} />;
    case 'duplicate': return <MoreObjectToolPanel {...props} />;
    case 'lock': return <MoreObjectToolPanel {...props} />;
    case 'bg-remove':
    case 'ai-enhance':
      return <UnavailableTool title="This image action needs a provider" detail="Background removal and AI enhance are not connected to an image provider. The picture on the canvas is left unchanged." />;
    case 'trim':
    case 'split':
    case 'speed':
    case 'captions':
    case 'transitions':
    case 'group':
    case 'distribute':
      return <UnavailableTool title="This control is not available" detail="The editor does not apply this action yet, so it will not change the canvas or pretend that it did." />;
    default: return <UnavailableTool title="No editor for this tool" detail="Choose another control. This one does not change the selected object." />;
  }
};

/* ---------- Bottom Sheet (mobile, slide-up) ---------- */
const MobileBottomSheet: React.FC<{
  open: boolean;
  fill?: boolean;
  padded?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  label: string;
}> = ({ open, fill = false, padded = false, onClose, children, label }) => {
  const [full, setFull] = useState(false);
  const startY = useRef(0);

  useEffect(() => { if (open) setFull(false); }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = startY.current - e.changedTouches[0].clientY;
    if (delta < -80) {
      if (full && !fill) setFull(false);
      else onClose();
    }
    if (delta > 80) setFull(true);
  };

  const expanded = open && (fill || full);

  return (
    <section
      className={`studio-panel flex min-h-0 flex-col overflow-hidden border-t shadow-[var(--shadow-studio-tray)] transition-[flex-grow,height] duration-300 ease-out ${
        open
          ? 'min-h-0 flex-1 rounded-t-2xl'
          : 'h-0 flex-none border-transparent'
      }`}
      onTouchStart={open ? handleTouchStart : undefined}
      onTouchEnd={open ? handleTouchEnd : undefined}
      aria-hidden={!open}
    >
      {open && (
        <>
          <button type="button" className="flex w-full shrink-0 items-center justify-center bg-studio-panel py-2" onClick={() => (fill ? onClose() : setFull((value) => !value))} aria-label={expanded ? 'Collapse panel' : 'Expand panel'}>
            <span className="h-1 w-10 rounded-full bg-studio-muted/50" />
          </button>
          <div className="flex shrink-0 items-center justify-between px-4 pb-2">
            <span className="editor-heading text-sm font-semibold text-studio-text">{label}</span>
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-studio-muted hover:bg-studio-panel-raised hover:text-studio-text" aria-label="Close panel">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className={`min-h-0 flex-1 ${padded ? 'overflow-y-auto px-4 pb-4' : 'overflow-hidden'}`}>
            {children}
          </div>
        </>
      )}
    </section>
  );
};

/* ---------- Right Properties Panel ---------- */
const RightPanel: React.FC<{
  selected: any;
  canvas: FabricCanvas | null;
  onClose?: () => void;
  preset?: string;
  customArtboard?: { label: string; width: number; height: number } | null;
  onPresetChange?: (value: string) => void;
}> = ({ selected, canvas, onClose, preset, customArtboard, onPresetChange }) => {
  const [, bump] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Keep inspector fields in sync with direct canvas manipulation
  useEffect(() => {
    if (!canvas) return;
    const refresh = () => bump((n) => n + 1);
    const events = ['object:modified', 'object:moving', 'object:scaling', 'object:rotating', 'text:changed'];
    events.forEach((e) => canvas.on(e as any, refresh));
    return () => { events.forEach((e) => canvas.off(e as any, refresh)); };
  }, [canvas]);

  const type = String(selected?.type ?? '').toLowerCase();
  const isText = type === 'textbox' || type === 'text' || type === 'i-text';
  const isImage = type === 'image';
  const isShape = type === 'rect' || type === 'circle' || type === 'triangle' || type === 'ellipse';

  const update = (prop: string, val: any) => {
    if (!selected || !canvas) return;
    if (isOverlayScrim(selected) && (prop === 'fill' || prop === 'stroke')) return;
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
      await replaceImageKeepingFrame(canvas, selected, url);
    } catch {
      toast({ title: 'Could not load image', description: 'Try a different file.', variant: 'destructive' });
    }
  };

  const width = Math.round((selected?.width || 0) * (selected?.scaleX || 1));
  const height = Math.round((selected?.height || 0) * (selected?.scaleY || 1));
  const setWidth = (w: number) => update('scaleX', (w || 1) / (selected.width || 1));
  const setHeight = (h: number) => update('scaleY', (h || 1) / (selected.height || 1));

  return (
    <aside className="studio-panel flex h-full min-h-0 w-full flex-col border-l">
      <div className="flex items-center justify-between border-b border-studio-line px-4 py-3">
        <div>
          <h2 className="editor-heading text-base font-semibold">{isText ? 'Text' : isImage ? 'Image' : selected ? 'Properties' : 'Design'}</h2>
          {selected?.variableKey && <p className="mt-0.5 text-[10px] text-studio-muted">✦ {selected.variableKey}</p>}
        </div>
        {onClose && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>}
      </div>

      {!selected ? (
        <div className="flex flex-1 flex-col p-5">
          {preset && onPresetChange && (
            <div className="mb-6 text-left">
              <p className="mb-2 text-xs font-semibold text-studio-muted">Design size</p>
              <Select value={preset} onValueChange={onPresetChange}>
                <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {customArtboard && <SelectItem value="custom">{customArtboard.label}</SelectItem>}
                  {Object.entries(ARTBOARD_PRESETS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-[11px] leading-relaxed text-studio-muted">Photos fill this size automatically without stretching.</p>
            </div>
          )}
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <MousePointer className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium">No selection</p>
            <p className="mt-1 text-xs text-muted-foreground">Select an element on the canvas to edit its properties.</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="design" className="flex flex-1 min-h-0 flex-col">
          <TabsList className="mx-4 mt-3 grid h-auto grid-cols-3 rounded-lg bg-studio-bg">
            <TabsTrigger value="design" className="min-w-0 whitespace-normal px-2 text-xs">Design</TabsTrigger>
            <TabsTrigger value="animation" className="min-w-0 whitespace-normal px-2 text-xs">Animation</TabsTrigger>
            <TabsTrigger value="position" className="min-w-0 whitespace-normal px-2 text-xs">Position</TabsTrigger>
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
                    <input type="color" value={hexColor(selected.fill, '#ffffff')} onChange={(e) => update('fill', e.target.value)} className="h-6 w-6 rounded cursor-pointer border" />
                    <Input value={typeof selected.fill === 'string' ? selected.fill : ''} onChange={(e) => update('fill', e.target.value)} className="h-7 border-0 shadow-none px-2 text-xs font-mono uppercase" />
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Border</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-lg border px-2 py-1.5">
                    <input type="color" value={hexColor(selected.stroke)} onChange={(e) => update('stroke', e.target.value)} className="h-5 w-5 rounded cursor-pointer border" />
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
                  <button key={a} type="button" disabled className="cursor-not-allowed rounded-xl border bg-background px-3 py-6 text-xs font-medium opacity-70">{a}</button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">These names are not applied to the canvas yet.</p>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [creativeId, setCreativeId] = useState<string | null>(searchParams.get('adId'));
  const [campaignId, setCampaignId] = useState<string | null>(searchParams.get('campaignId'));
  const creativeIdRef = useRef(creativeId);
  const campaignIdRef = useRef(campaignId);
  const templateIdRef = useRef<string | null>(null);
  const creativeContentRef = useRef<Record<string, any>>({});
  const saveInFlight = useRef<Promise<string | null> | null>(null);
  const [saveStatus, setSaveStatus] = useState('Unsaved');
  const [documentLoaded, setDocumentLoaded] = useState(!searchParams.get('adId'));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'templates';
    const saved = window.localStorage.getItem('advista.editor.activeTab');
    if (searchParams.get('selectTemplate') === '1') return 'templates';
    return saved && LEFT_TABS.some((t) => t.id === saved) ? saved : 'templates';
  });
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled Creative');
  const [zoom, setZoom] = useState(100);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [tick, forceUpdate] = useState(0);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(() => searchParams.get('selectTemplate') === '1');
  const [pendingUploads, setPendingUploads] = useState<File[] | null>(null);
  const cameraRollRef = useRef<HTMLInputElement>(null);
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

  const [preset, setPreset] = useState('instagramPortrait');
  // Templates bring their own frame — kept as a "custom" artboard so the
  // design renders at its authored size instead of being squeezed into a preset.
  const [customArtboard, setCustomArtboard] = useState<{ label: string; width: number; height: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [pageIdx, setPageIdx] = useState(0);
  const artboard = (preset === 'custom' && customArtboard) ? customArtboard : (ARTBOARD_PRESETS[preset] ?? ARTBOARD_PRESETS.instagramPortrait);
  const isMobile = useIsMobile();
  const { videoUrl } = useVisualEditor();
  const isVideo = !!videoUrl;

  // A video frame gets the same treatment as a template: the artboard adopts the
  // clip's own aspect ratio so the fit path centres it without cropping.
  useEffect(() => {
    if (!videoUrl) return;
    let cancelled = false;
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      if (cancelled) return;
      const w = v.videoWidth || 1080;
      const h = v.videoHeight || 1920;
      setCustomArtboard({ label: `Video (${w}×${h})`, width: w, height: h });
      setPreset('custom');
      setFitToken((t) => t + 1);
    };
    v.src = videoUrl;
    return () => { cancelled = true; v.onloadedmetadata = null; };
  }, [videoUrl]);

  const currentTools = getToolsForSelection(selected);
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
    const json = JSON.stringify((c as any).toJSON(SERIALIZED_CANVAS_PROPS));
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

  useEffect(() => {
    if (!canvas) return;
    const onFrame = (frame: { width?: number; height?: number }) => {
      const width = Math.round(Number(frame?.width) || 0);
      const height = Math.round(Number(frame?.height) || 0);
      if (width < 2 || height < 2) return;
      setCustomArtboard({ label: `Custom · ${width}×${height}`, width, height });
      setPreset('custom');
      setFitToken((token) => token + 1);
    };
    canvas.on('advista:artboard' as any, onFrame);
    return () => { canvas.off('advista:artboard' as any, onFrame); };
  }, [canvas]);

  const changeArtboardPreset = useCallback((nextPreset: string) => {
    if (nextPreset === preset) return;
    const next = nextPreset === 'custom' ? customArtboard : ARTBOARD_PRESETS[nextPreset];
    if (!next) return;
    const previous = artboard;
    if (canvas && previous.width > 0 && previous.height > 0) {
      const scale = Math.min(next.width / previous.width, next.height / previous.height);
      const offsetX = (next.width - previous.width * scale) / 2;
      const offsetY = (next.height - previous.height * scale) / 2;
      canvas.getObjects().forEach((object: any) => {
        if (object.type === 'image' && object.mediaFit === 'cover') {
          scaleImageToCover(object, { left: 0, top: 0, width: next.width, height: next.height });
          return;
        }
        object.set({
          left: offsetX + (Number(object.left) || 0) * scale,
          top: offsetY + (Number(object.top) || 0) * scale,
          scaleX: (Number(object.scaleX) || 1) * scale,
          scaleY: (Number(object.scaleY) || 1) * scale,
        });
        object.setCoords?.();
      });
    }
    setPreset(nextPreset);
    setFitToken((token) => token + 1);
    if (canvas) saveSnapshot(canvas);
  }, [artboard, canvas, customArtboard, preset, saveSnapshot]);

  // Canonical persistence; browser storage is recovery-only, scoped to this creative.
  const persistCreative = useCallback(async (silent = false): Promise<string | null> => {
    if (!canvas || !user || !documentLoaded || loadError) return null;
    if (saveInFlight.current) return saveInFlight.current;
    const operation = (async () => {
      setSaveStatus('Saving…');
      try {
        const json = (canvas as any).toJSON(SERIALIZED_CANVAS_PROPS);
        const pageSnapshots = [...pages];
        if (pageSnapshots.length) pageSnapshots[pageIdx] = json;
        const document = creativeDocument(json, artboard.width, artboard.height, pageSnapshots);
        if (!campaignIdRef.current) {
          const fromUrl = new URLSearchParams(window.location.search).get('campaignId');
          if (fromUrl) campaignIdRef.current = fromUrl;
        }
        let targetCampaignId = campaignIdRef.current;
        if (!silent && !targetCampaignId) {
          const { data, error } = await supabase.from('campaigns').insert({ user_id: user.id, name: projectName, status: 'draft' }).select().single();
          if (error) throw error;
          targetCampaignId = data.id;
          campaignIdRef.current = data.id;
          setCampaignId(data.id);
        }
        const creative = await CreativeService.save(user.id, {
          campaign_id: targetCampaignId,
          name: projectName,
          canvas_data: document,
          content: { ...creativeContentRef.current, pageIdx, videoUrl },
          template_id: templateIdRef.current,
          preview_url: canvas.toDataURL({ format: 'png', multiplier: Math.min(1, 480 / artboard.width) }),
        }, creativeIdRef.current);
        creativeIdRef.current = creative.id;
        setCreativeId(creative.id);
        setSaveStatus('Saved');
        const params = new URLSearchParams(window.location.search);
        params.set('adId', creative.id);
        if (targetCampaignId) params.set('campaignId', targetCampaignId);
        setSearchParams(params, { replace: true });
        qc.invalidateQueries({ queryKey: ['creatives'] });
        qc.invalidateQueries({ queryKey: ['campaigns'] });
        if (!silent) {
          const returning = new URLSearchParams(window.location.search).get('returnTo') === 'create';
          toast({
            title: returning ? 'Design saved' : 'Creative saved',
            description: returning ? 'Back to Create Ad to continue.' : undefined,
          });
        }
        return targetCampaignId;
      } catch (error) {
        setSaveStatus('Save failed');
        if (!silent) toast({ title: 'Could not save creative', description: error instanceof Error ? error.message : 'Please retry.', variant: 'destructive' });
        return null;
      }
    })();
    saveInFlight.current = operation;
    try { return await operation; } finally { saveInFlight.current = null; }
  }, [canvas, user, documentLoaded, loadError, pages, pageIdx, artboard.width, artboard.height, projectName, videoUrl, setSearchParams, qc]);

  useEffect(() => {
    const save = () => {
      const returning = new URLSearchParams(window.location.search).get('returnTo') === 'create';
      if (!returning) {
        void persistCreative();
        return;
      }
      void (async () => {
        const id = await persistCreative();
        if (id) navigate(`/create-ad?campaignId=${id}&step=2`);
      })();
    };
    window.addEventListener('advista:save-creative', save);
    return () => window.removeEventListener('advista:save-creative', save);
  }, [persistCreative, navigate]);

  const autoSaveData = useMemo(() => {
    if (!canvas || !documentLoaded || loadError) return null;
    try { return { json: (canvas as any).toJSON(SERIALIZED_CANVAS_PROPS), name: projectName, width: artboard.width, height: artboard.height }; }
    catch { return null; }
  }, [canvas, documentLoaded, loadError, historyIdx, projectName, artboard.width, artboard.height]);
  const handleAutoSave = useCallback(async (data: any) => {
    if (!data?.json) return;
    try { localStorage.setItem(`editor_recovery_${user?.id}_${creativeIdRef.current ?? 'new'}`, JSON.stringify(data)); } catch { /* Cloud save remains available. */ }
    // New blank documents are saved only through the explicit Save command.
    if (creativeIdRef.current) {
      const result = await persistCreative(true);
      if (!result && campaignIdRef.current) throw new Error('Cloud save failed');
    }
  }, [user?.id, persistCreative]);
  useAutoSave(autoSaveData, handleAutoSave, {
    delay: 3000,
    enabled: !!canvas && documentLoaded && !loadError,
    key: `editor-${user?.id}-${creativeId ?? 'new'}`,
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
  const [hasPending] = useState(() => !!pendingRef.current || searchParams.has('adId') || searchParams.has('template'));
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
                logo_url: brand.logo_url ?? (activeKit as any)?.logo_url ?? undefined,
                colors: brand.colors?.length
                  ? brand.colors
                  : ([activeKit?.primary_color, activeKit?.secondary_color].filter(Boolean) as string[]),
                fonts: (activeKit as any)?.font_family ? [(activeKit as any).font_family] : undefined,
                voice: (brand as any).voice ?? undefined,
                locked: true,
              }
            : activeKit
              ? {
                  id: activeKit.id,
                  name: (activeKit as any).name ?? 'Brand',
                  logo_url: (activeKit as any).logo_url ?? undefined,
                  colors: [activeKit.primary_color, activeKit.secondary_color].filter(Boolean) as string[],
                  fonts: (activeKit as any).font_family ? [(activeKit as any).font_family] : undefined,
                  voice: (activeKit as any).brand_voice ?? undefined,
                  locked: true,
                }
              : null,
          category: effectiveContext?.active_category ?? template.category ?? null,
          goal: effectiveContext?.current_goal ?? template.objective ?? null,
          platform: template.platform ?? null,
          productName: template.name,
          skipAI: true,
        });
        templateIdRef.current = typeof template.id === "string" && template.id.startsWith("stock-") ? null : template.id;
        const json = inst.json as any;

        // Resilient load — unresolved {{image}} placeholders become editable
        // "Add image" slots instead of blowing up the whole document. The
        // template's own preview is a full-frame render, so it is deliberately
        // NOT dropped into a single layer.
        setImageStatuses([]);
        const result = await loadTemplateJSONIntoCanvas(canvas, json, {
          onImageStatus: upsertImageStatus,
        });


        if (json?.background) canvas.backgroundColor = json.background as string;

        // The artboard follows the template. When the stored frame is a different
        // shape from the artwork, the canvas follows the artwork and every layer
        // is scaled to fill that frame without distortion.
        const loadedObjects = canvas.getObjects() as any[];
        const content = measureContentBounds(canvas);
        const soleImage = loadedObjects.length === 1 && loadedObjects[0]?.type === 'image' ? loadedObjects[0] : null;
        const frame = frameForTemplate(
          { width: Number(template.width) || Number(json?.width), height: Number(template.height) || Number(json?.height) },
          soleImage
            ? { width: Number(soleImage.width) || content?.width || 1080, height: Number(soleImage.height) || content?.height || 1080 }
            : content,
        );
        publishArtboard(canvas, frame);
        if (soleImage) {
          scaleImageToCover(soleImage, { left: 0, top: 0, width: frame.width, height: frame.height });
          soleImage.set({ name: soleImage.name || 'Template artwork', mediaFit: 'cover' });
        } else {
          fitContentToFrame(canvas, frame);
        }
        setCustomArtboard({ label: `Custom · ${frame.width}×${frame.height}`, width: frame.width, height: frame.height });
        setPreset('custom');


        const srcObjects: any[] = Array.isArray(json?.objects) ? json.objects : [];

        canvas.getObjects().forEach((obj: any, i) => {
          const src = srcObjects[i] ?? {};
          // The contrast scrim is a translucent tint behind the type. It must not
          // become a solid plate, and it must not steal taps from the photo or text.
          if (isOverlayScrim(obj) || isOverlayScrim(src)) {
            const authored = typeof src.fill === 'string' ? src.fill : 'rgba(8,8,14,0.62)';
            obj.set({
              fill: authored,
              selectable: false,
              evented: false,
              hoverCursor: 'default',
            });
            obj.setCoords?.();
            return;
          }
          // Everything else stays fully editable — templates are a starting point, not a lock.
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
          obj.brandCompliant = Boolean(activeKit && src.brandReplaceable);
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

        // Re-fit the viewport now that the artboard matches the template.
        setFitToken((t) => t + 1);



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

  const handleRetryImages = useCallback(async () => {
    if (!canvas) return;
    setRetryingImages(true);
    try {
      const { recovered, stillFailing } = await retryFailedImages(canvas, upsertImageStatus);
      forceUpdate((n) => n + 1);
      toast({
        title: recovered ? `${recovered} image${recovered > 1 ? 's' : ''} recovered` : 'Still unavailable',
        description: stillFailing ? `${stillFailing} image${stillFailing > 1 ? 's' : ''} still failing — try replacing the layer.` : 'All template images loaded.',
        variant: stillFailing && !recovered ? 'destructive' : undefined,
      });
    } finally {
      setRetryingImages(false);
    }
  }, [canvas, upsertImageStatus]);



  // On canvas ready → load a pending template (session handoff) or ?template=<id>.
  useEffect(() => {
    if (!canvas || !user) return;
    let cancelled = false;
    const adId = searchParams.get('adId');
    if (adId && !documentLoaded) {
      (async () => {
        try {
          const creative = await CreativeService.get(user.id, adId);
          if (cancelled) return;
          if (campaignIdRef.current && creative.campaign_id !== campaignIdRef.current) throw new Error('Creative does not belong to this campaign');
          creativeIdRef.current = creative.id;
          campaignIdRef.current = creative.campaign_id;
          setCampaignId(creative.campaign_id);
          templateIdRef.current = creative.template_id;
          creativeContentRef.current = (creative.content ?? {}) as Record<string, any>;
          setProjectName(creative.name);
          if (!creative.canvas_data && creativeContentRef.current.mediaUrl) {
            const img = await FabricImage.fromURL(creativeContentRef.current.mediaUrl, { crossOrigin: 'anonymous' });
            const frame = frameFromAspect(Number(img.width) || 1080, Number(img.height) || 1080);
            publishArtboard(canvas, frame);
            scaleImageToCover(img, { left: 0, top: 0, width: frame.width, height: frame.height });
            img.set({ mediaFit: 'cover', name: 'Full-bleed image' });
            canvas.add(img);
            setCustomArtboard({ label: `Custom · ${frame.width}×${frame.height}`, width: frame.width, height: frame.height });
            setPreset('custom');
            saveSnapshot(canvas);
          }
          if (creative.canvas_data) {
            const doc = creative.canvas_data as Record<string, any>;
            const width = Number(doc.width) || 1080;
            const height = Number(doc.height) || 1350;
            isRestoringRef.current = true;
            await loadTemplateJSONIntoCanvas(canvas, doc, { onImageStatus: upsertImageStatus });
            if (cancelled) return;
            setCustomArtboard({ label: `Custom · ${width}×${height}`, width, height });
            setPreset('custom');
            canvas.setDimensions({ width, height });
            setPages(doc.pages ?? []);
            setPageIdx(creativeContentRef.current.pageIdx ?? 0);
            isRestoringRef.current = false;
            saveSnapshot(canvas);
          }
          setSaveStatus('Saved');
          setDocumentLoaded(true);
          setFitToken(t => t + 1);
          forceUpdate(n => n + 1);
        } catch (error) {
          isRestoringRef.current = false;
          setLoadError(error instanceof Error ? error.message : 'Could not load creative');
          toast({ title: 'Could not open creative', description: 'Your saved work has not been changed.', variant: 'destructive' });
        }
      })();
      return () => { cancelled = true; };
    }
    if (adId) return;
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
  }, [canvas, user?.id]);

  const activeKit = brandKits?.find((k) => k.is_active) || brandKits?.[0];
  const brandPalette = [activeKit?.primary_color, activeKit?.secondary_color, activeKit?.accent_color].filter(Boolean) as string[];


  const clearSelection = () => {
    canvas?.discardActiveObject();
    canvas?.requestRenderAll();
    setSelected(null);
    setActiveTool(null);
  };

  const openSelectionTool = (id: string) => {
    if (activeTool === id) {
      setActiveTool(null);
      if (isMobile) setSheetExpanded(false);
      return;
    }
    setActiveTool(id);
    setSheetExpanded(true);
  };

  const addText = (text: string, size: number, weight: string, fontFamily = 'Outfit') => {
    if (!canvas) return;
    const bgFill = String(canvas.backgroundColor || '#ffffff').toLowerCase();
    const darkBg = !['#ffffff', '#fff', 'white', ''].includes(bgFill);
    const w = Math.min(320, (canvas.getWidth?.() || 360) - 48);
    const tb = new Textbox(text, { left: 24, top: 60, fontSize: size, fontWeight: weight, fill: darkBg ? '#ffffff' : '#111111', fontFamily, width: w });
    canvas.add(tb); canvas.setActiveObject(tb); canvas.renderAll();
    setSelected(tb); forceUpdate((n) => n + 1);
  };

  const magicWrite = async (product: string) => {
    if (!user) {
      toast({ title: 'Sign in to write ad copy', description: 'Magic Write uses your account to generate a headline.' });
      return;
    }
    const { data, error } = await supabase.functions.invoke('generate-ad-copy', {
      body: { productName: product, platform: (effectiveContext as any)?.active_platform || 'instagram' },
    });
    if (error) {
      toast({ title: 'Copy was not written', description: error.message, variant: 'destructive' });
      return;
    }
    const copy = data?.copy ?? data;
    const headline = typeof copy?.headline === 'string' ? copy.headline.trim() : '';
    if (!headline) {
      toast({ title: 'No headline came back', description: 'Try a more specific product or offer.', variant: 'destructive' });
      return;
    }
    addText(headline, 36, '700', 'Outfit');
    if (typeof copy?.subtitle === 'string' && copy.subtitle.trim()) addText(copy.subtitle.trim(), 18, '500', 'Figtree');
  };

  const useBrandColor = (hex: string) => {
    if (!canvas) return;
    if (selected && !isOverlayScrim(selected)) {
      if (selected.type === 'line') selected.set({ stroke: hex });
      else selected.set({ fill: hex });
    } else {
      canvas.backgroundColor = hex;
    }
    canvas.requestRenderAll();
    markChanged();
  };

  const useBrandFont = (name: string) => {
    if (selected && ['textbox', 'text', 'i-text'].includes(String(selected.type))) {
      selected.set({ fontFamily: name });
      canvas?.requestRenderAll();
      markChanged();
      return;
    }
    addText('Brand line', 32, '700', name);
  };
  const addShape = (t: 'rectangle' | 'circle') => {
    if (!canvas) return;
    const s = t === 'rectangle'
      ? new Rect({ left: 100, top: 100, width: 120, height: 120, fill: '#6E56F5' })
      : new FCircle({ left: 100, top: 100, radius: 60, fill: '#FFC107' });
    canvas.add(s); canvas.setActiveObject(s); canvas.renderAll();
    setSelected(s); forceUpdate((n) => n + 1);
  };

  const onExport = () => {
    if (!canvas) return;
    const objects = canvas.getObjects() as any[];
    const text = objects.filter((obj) => ['textbox', 'text', 'i-text'].includes(obj.type));
    const hasCTA = text.some((obj) => `${obj.variableKey ?? ''} ${obj.name ?? ''} ${obj.text ?? ''}`.toLowerCase().includes('cta'));
    const missing: string[] = [];
    if (!objects.length) missing.push('content');
    if (!hasCTA) missing.push('CTA');
    if (!activeKit) missing.push('Brand Kit');
    const url = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    const a = document.createElement('a'); a.href = url; a.download = `${projectName || 'design'}.png`; a.click();
    toast({
      title: missing.length ? 'Exported with ad health notes' : 'Exported · Ad health passed',
      description: missing.length ? `Downloaded. Review ${missing.join(', ')} before publishing.` : 'Copy, CTA, and Brand Kit checks passed.',
    });
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

  const returnToCreateAd = searchParams.get('returnTo') === 'create';

  const saveAndReturn = useCallback(async () => {
    const id = await persistCreative();
    if (!returnToCreateAd || !id) return;
    navigate(`/create-ad?campaignId=${id}&step=2`);
  }, [persistCreative, navigate, returnToCreateAd]);

  const backToCreateAd = useCallback(async () => {
    const id = await persistCreative(true);
    const campaignId = id || campaignIdRef.current || searchParams.get('campaignId');
    if (!campaignId) {
      navigate('/create-ad');
      return;
    }
    navigate(`/create-ad?campaignId=${campaignId}&step=2`);
  }, [persistCreative, navigate, searchParams]);

  const onPublish = useCallback(async () => {
    if (returnToCreateAd) {
      await saveAndReturn();
      return;
    }
    const id = await persistCreative();
    if (!id) return;
    navigate(`/campaigns/${id}`);
  }, [persistCreative, navigate, returnToCreateAd, saveAndReturn]);

  const addPage = useCallback(() => {
    if (!canvas) return;
    const snapshot = (canvas as any).toJSON(SERIALIZED_CANVAS_PROPS);
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
    const snapshot = (canvas as any).toJSON(SERIALIZED_CANVAS_PROPS);
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
      case 'templates': return (
        <StudioTemplatesPanel
          embedded={isMobile}
          canvas={canvas}
          platform={(effectiveContext as any)?.active_platform ?? null}
          onUse={(t: StudioTemplate) => loadTemplateRecord(t)}
          onChanged={() => forceUpdate((n) => n + 1)}
          onAttach={() => { setActiveTab('uploads'); setSheetExpanded(true); }}
          onWriteCopy={(text) => addText(text, 28, '600')}
        />
      );
      case 'background': return <StudioBackgroundPanel canvas={canvas} onChanged={() => forceUpdate((n) => n + 1)} brandColors={brandPalette} selected={selected} />;
      case 'ai-studio': return <StudioAIPanel canvas={canvas} onChanged={() => forceUpdate((n) => n + 1)} platform={(effectiveContext as any)?.active_platform ?? null} category={effectiveContext?.active_category ?? null} selected={selected} />;
      case 'text': return <TextPanel onAdd={addText} onMagicWrite={magicWrite} />;
      case 'elements': return <StudioElementsPanel canvas={canvas} onChanged={() => forceUpdate((n) => n + 1)} brandColors={brandPalette} selected={selected} />;
      case 'brand': return (
        <BrandKitPanel
          onUseColor={useBrandColor}
          onUseFont={useBrandFont}
          onUseLogo={(url) => { if (!canvas) return; void placeFittedImage(canvas, url).then(() => markChanged()); }}
        />
      );
      case 'layers': return <LayersPanel canvas={canvas} version={tick} selected={selected} onSelect={setSelected} onChanged={markChanged} />;
      case 'media': return <StudioMediaPanel embedded={isMobile} canvas={canvas} onChanged={() => forceUpdate((n) => n + 1)} selected={selected} />;
      case 'uploads':
      case 'camera': return (
        <StudioUploadsPanel
          embedded={isMobile}
          canvas={canvas}
          onChanged={() => forceUpdate((n) => n + 1)}
          selected={selected}
          pendingFiles={pendingUploads}
          onPendingConsumed={() => setPendingUploads(null)}
        />
      );
      case 'projects': return <ProjectsPanel />;
      case 'tools': return (
        <div className="h-full overflow-y-auto p-4">
          <ToolsSheet onOpen={(id) => { setActiveTab(id); setActiveTool(null); setSheetExpanded(true); }} />
        </div>
      );

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
        fitToken={fitToken + (sheetExpanded ? 1000 : 0)}
        controlBand={isMobile && sheetExpanded ? 12 : CONTROL_BAND}
        imageStatuses={imageStatuses}
        onRetryImages={handleRetryImages}
        retryingImages={retryingImages}
        emptyOverlay={isEmpty ? (
          // Sized in container units so it always stays inside the artboard edges.
          <div className="flex h-full w-full flex-col items-center justify-center text-center text-studio-bg"
            style={{ padding: '6cqw', gap: '2.5cqh' }}>
            <div className="flex items-center justify-center rounded-[22%] bg-primary/15"
              style={{ width: 'clamp(28px, 16cqw, 64px)', height: 'clamp(28px, 16cqw, 64px)' }}>
              <Sparkles className="text-primary" style={{ width: '50%', height: '50%' }} />
            </div>
            <div>
              <h3 className="editor-heading font-semibold leading-tight" style={{ fontSize: 'clamp(12px, 6.5cqw, 26px)' }}>Start creating</h3>
              <p className="mt-1 opacity-60" style={{ fontSize: 'clamp(9px, 3.6cqw, 14px)' }}>
                Tap a tool below to add text, images, shapes, or upload your own media.
              </p>
            </div>
            <div className="grid w-full grid-cols-3" style={{ gap: '2.5cqw' }}>
              {[
                { label: 'Text', icon: Type, action: () => addText('New Text', 32, 'bold'), color: 'from-blue-500 to-blue-600' },
                { label: 'Shape', icon: Shapes, action: () => addShape('rectangle'), color: 'from-primary to-primary-glow' },
                { label: 'Upload', icon: Upload, action: () => { setActiveTab('uploads'); setSheetExpanded(true); }, color: 'from-emerald-500 to-emerald-600' },
              ].map(({ label, icon: Icon, action, color }) => (
                <button key={label} onClick={action}
                  className="flex min-w-0 flex-col items-center rounded-xl bg-studio-bg/[0.06] transition hover:bg-studio-bg/[0.12]"
                  style={{ padding: '3.5cqw 1cqw', gap: '2cqw' }}>
                  <div className={`flex items-center justify-center rounded-lg bg-gradient-to-br ${color}`}
                    style={{ width: 'clamp(20px, 11cqw, 40px)', height: 'clamp(20px, 11cqw, 40px)' }}>
                    <Icon className="text-white" style={{ width: '50%', height: '50%' }} />
                  </div>
                  <span className="truncate font-medium" style={{ fontSize: 'clamp(8px, 3.4cqw, 13px)' }}>{label}</span>
                </button>
              ))}
            </div>
            <p className="opacity-45" style={{ fontSize: 'clamp(8px, 3cqw, 12px)' }}>Tip: Tap a template to start from a pre-made design</p>
          </div>
        ) : undefined}
      />

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

      {/* Pages sit under the artboard. Hidden on mobile while a sheet is open so the design stays fully visible above the tools. */}
      {!(isMobile && sheetExpanded) && (
      <div className={`flex shrink-0 items-center justify-center gap-2 py-2 ${isMobile ? 'bg-transparent' : 'border-t border-studio-line bg-studio-bg'}`}>
        {pages.length > 1 && pages.map((_, i) => (
          <button key={i} onClick={() => goToPage(i)}
            className="h-9 min-w-9 rounded-lg px-3 text-xs"
            style={{
              backgroundColor: i === pageIdx ? '#6E56F5' : '#2D2D2D',
              border: '1px solid #444444',
              color: i === pageIdx ? '#FFFFFF' : '#CCCCCC',
            }}>
            {i + 1}
          </button>
        ))}
        <button onClick={addPage} className="flex items-center gap-2 h-9 rounded-full px-4 text-xs" style={{ backgroundColor: '#2D2D2D', border: '1px solid #444444', color: '#CCCCCC' }}>
          <Plus className="h-3.5 w-3.5" /> Add page
        </button>
      </div>
      )}
    </>
  );

  return (
    <div className="visual-editor flex h-[100dvh] w-full flex-col overflow-hidden bg-studio-bg">
      <input
        ref={cameraRollRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = event.target.files ? Array.from(event.target.files) : [];
          event.target.value = '';
          if (files.length) {
            setPendingUploads(files);
            setActiveTab('camera');
            setSheetExpanded(true);
          }
        }}
      />
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
          onSave={() => void (returnToCreateAd ? saveAndReturn() : persistCreative())}
          returnToCreate={returnToCreateAd}
          onBack={returnToCreateAd ? () => void backToCreateAd() : undefined}
          saveStatus={saveStatus}
          artboardLabel={`${artboard.label} · ${artboard.width}×${artboard.height} px`}
        />
      </div>

      {loadError && <div role="alert" className="border-b border-destructive bg-card p-3 text-destructive">{loadError}<Button variant="outline" className="ml-3" onClick={() => window.location.reload()}>Retry</Button></div>}
      {/* Desktop only: Editor Second Bar */}
      <div className="editor-second-bar flex-shrink-0">
        <CanvasSubToolbar
          canvas={canvas}
          selected={selected}
          onChanged={markChanged}
          preset={preset}
          onPresetChange={changeArtboardPreset}
          customArtboard={customArtboard}
          onOpenAnimate={() => { setActiveTab('ai-studio'); setActiveTool('animate'); }}
          onOpenPosition={() => { setActiveTab('layers'); setActiveTool('position'); }}
        />
      </div>

      {/* Mobile layout: Top Bar → Canvas → Bottom Sheet → Contextual Toolbar */}
      {isMobile ? (
        <>
          {/* The artboard keeps a real slice of the stage. Sheets sit under it instead of covering it. */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className={`editor-canvas-area relative min-w-0 overflow-hidden ${
              sheetExpanded && !activeTool && (activeTab === 'uploads' || activeTab === 'media')
                ? 'hidden'
                : sheetExpanded
                  ? 'flex h-[min(46vh,420px)] w-full shrink-0 flex-col'
                  : 'flex min-h-0 w-full flex-1 flex-col'
            }`}>
              {renderCanvas()}
            </div>
            <MobileBottomSheet
              open={sheetExpanded}
              fill={!activeTool && (activeTab === 'uploads' || activeTab === 'media')}
              padded={!!activeTool}
              onClose={() => { setSheetExpanded(false); setActiveTool(null); }}
              label={activeTool ? (currentTools.find(t => t.id === activeTool)?.label || activeTool) : (CREATE_TOOLS.find(t => t.id === activeTab)?.label || EDITOR_TOOLS.find(t => t.id === activeTab)?.label || LEFT_TABS.find(t => t.id === activeTab)?.label || 'Create')}
            >
              {activeTool && selected
                ? renderToolSheet(activeTool, selected, canvas)
                : renderLeftPanel()}
            </MobileBottomSheet>
          </div>

          {/* Contextual Toolbar — auto-switches based on selection */}
          {selected && currentTools !== CREATE_TOOLS ? (
            <SelectionBar tools={currentTools} active={activeTool} onTool={openSelectionTool} onDone={clearSelection} variant="dock" />
          ) : (
          <ContextualToolbar
            tools={CREATE_TOOLS}
            active={activeTool ? null : activeTab === 'uploads' ? 'uploads' : activeTab}
            onToolTap={(id) => {
              if (id === 'camera') {
                cameraRollRef.current?.click();
                setActiveTab('camera');
                setActiveTool(null);
                setSheetExpanded(true);
                return;
              }
              const panel = panelForCreateTool(id);
              if (activeTab === panel && sheetExpanded && !activeTool) {
                setSheetExpanded(false);
                return;
              }
              setActiveTab(panel);
              setActiveTool(null);
              setSheetExpanded(true);
            }}
          />
          )}
        </>
      ) : (
        /* Desktop layout */
        <>
          {/* Editor Main */}
          <div className="editor-main flex flex-1 overflow-hidden min-h-0">
            {/* Left: Icon Rail + Panel */}
            <div className="editor-left-panel flex h-full overflow-hidden">
              <IconRail active={activeTab} onChange={selectTab} />
              <div className="editor-panel-content studio-panel hidden h-full w-[280px] shrink-0 flex-col overflow-hidden border-r md:flex">
                <div key={activeTool || activeTab} className="flex h-full min-h-0 flex-col">
                  {activeTool && selected ? (
                    <div className="flex h-full min-h-0 flex-col">
                      <div className="flex items-center gap-2 border-b border-[#3D3D3D] px-3 py-3">
                        <button type="button" onClick={() => setActiveTool(null)} className="grid h-8 w-8 place-items-center rounded-lg text-white hover:bg-white/10" aria-label="Back to tools">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <h2 className="text-sm font-semibold text-white">{currentTools.find((tool) => tool.id === activeTool)?.label || 'Edit'}</h2>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        {renderToolSheet(activeTool, selected, canvas)}
                      </div>
                    </div>
                  ) : renderLeftPanel()}
                </div>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="editor-canvas-area relative flex flex-1 min-w-0 flex-col overflow-hidden">
              {selected && currentTools !== CREATE_TOOLS && (
                <SelectionBar tools={currentTools} active={activeTool} onTool={openSelectionTool} onDone={clearSelection} variant="float" />
              )}
              {renderCanvas()}
            </div>

            {/* Desktop right panel — opened from the top bar */}
            {selected && rightOpen && (
               <div className="editor-right-panel studio-panel hidden w-[260px] shrink-0 overflow-y-auto border-l lg:flex">
                <RightPanel selected={selected} canvas={canvas} onClose={() => setRightOpen(false)} preset={preset} customArtboard={customArtboard} onPresetChange={changeArtboardPreset} />
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

      {/* Inspector slide-over — used when the docked right panel isn't visible */}
      <Sheet open={rightOpen} onOpenChange={setRightOpen}>
        <SheetContent side="right" className="w-[min(20rem,calc(100vw-2rem))] p-0 flex flex-col">
          <RightPanel selected={selected} canvas={canvas} onClose={() => setRightOpen(false)} preset={preset} customArtboard={customArtboard} onPresetChange={changeArtboardPreset} />
        </SheetContent>
      </Sheet>

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

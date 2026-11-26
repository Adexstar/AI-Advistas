import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon, Smartphone, Square, Play, Maximize2, Upload, Megaphone,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { START_PRESETS, editorStartUrl, setPendingEditorUpload } from '@/lib/designHome';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const TILE_ICONS = {
  'instagram-post': ImageIcon,
  story: Smartphone,
  square: Square,
  video: Play,
} as const;

type Props = {
  collapsed?: boolean;
  onNavigate?: () => void;
  triggerClassName?: string;
  children: React.ReactNode;
};

export function CreateNewMenu({ collapsed, onNavigate, triggerClassName, children }: Props) {
  const navigate = useNavigate();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customW, setCustomW] = useState('1080');
  const [customH, setCustomH] = useState('1080');

  const go = (path: string) => {
    onNavigate?.();
    navigate(path);
  };

  const openCustom = () => {
    const width = Number(customW);
    const height = Number(customH);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 64 || height < 64 || width > 8192 || height > 8192) {
      toast({ title: 'Enter a valid size', description: 'Use widths and heights between 64 and 8192.', variant: 'destructive' });
      return;
    }
    setCustomOpen(false);
    go(editorStartUrl({ width, height, mode: 'photo' }));
  };

  const onUpload = (file: File | undefined) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      toast({ title: 'Unsupported file', description: 'Choose a picture or a video.', variant: 'destructive' });
      return;
    }
    setPendingEditorUpload(file);
    go(editorStartUrl({
      preset: isVideo ? 'reels' : 'instagramPortrait',
      mode: isVideo ? 'video' : 'photo',
      upload: true,
    }));
  };

  return (
    <>
      <input
        ref={uploadRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          onUpload(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={cn(triggerClassName)} aria-label="Create New">
            {children}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={collapsed ? 'start' : 'start'} side={collapsed ? 'right' : 'bottom'} className="w-56">
          {START_PRESETS.map((tile) => {
            const Icon = TILE_ICONS[tile.id];
            return (
              <DropdownMenuItem key={tile.id} onClick={() => go(editorStartUrl({ preset: tile.preset, mode: tile.mode }))}>
                <Icon className="mr-2 h-4 w-4" />
                {tile.label}{tile.ratio ? ` ${tile.ratio}` : ''}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuItem onClick={() => setCustomOpen(true)}>
            <Maximize2 className="mr-2 h-4 w-4" />
            Custom size
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => uploadRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => go('/create-ad')}>
            <Megaphone className="mr-2 h-4 w-4" />
            New campaign
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Custom size</DialogTitle>
            <DialogDescription>
              Enter width and height in pixels. The editor opens a blank photo canvas at that size.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <label className="space-y-1.5 text-xs text-muted-foreground">
              Width
              <Input type="number" min={64} max={8192} value={customW} onChange={(event) => setCustomW(event.target.value)} />
            </label>
            <label className="space-y-1.5 text-xs text-muted-foreground">
              Height
              <Input type="number" min={64} max={8192} value={customH} onChange={(event) => setCustomH(event.target.value)} />
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCustomOpen(false)}>Cancel</Button>
            <Button onClick={openCustom}>Open editor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

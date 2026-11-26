import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, FolderOpen, Image as ImageIcon, Loader2, Mic, Plus, Square, Stamp, Video, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreativeService } from '@/services/creative/CreativeService';
import { designAttachment, ACCEPT } from '@/lib/adStudio/uploads';
import { useSpeech } from '@/lib/adStudio/speech';
import type { AttachedFile, FileKind } from '@/lib/adStudio/sessions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

export interface UiFile extends AttachedFile {
  uploading?: boolean;
}

interface Props {
  userId: string;
  value: string;
  onChange: (value: string) => void;
  files: UiFile[];
  onUpload: (kind: Exclude<FileKind, 'design'>, files: File[]) => void;
  onPickDesign: (file: AttachedFile) => void;
  onRemove: (id: string) => void;
  onSend: () => void;
  canSend: boolean;
  sending?: boolean;
}

function Thumb({ file, onRemove }: { file: UiFile; onRemove: () => void }) {
  return (
    <li className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1b1b22]" data-testid="attached-file">
      {file.kind === 'video' ? (
        <video src={file.url} muted preload="metadata" className="h-full w-full object-cover" aria-label={file.name} />
      ) : file.url ? (
        <img src={file.url} alt={file.name} className={cn('h-full w-full', file.kind === 'logo' ? 'object-contain p-1.5' : 'object-cover')} />
      ) : (
        <span className="grid h-full w-full place-items-center text-white/40"><ImageIcon className="h-5 w-5" /></span>
      )}
      {file.uploading && (
        <span className="absolute inset-0 grid place-items-center bg-black/55" role="status" aria-label={`Uploading ${file.name}`}>
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        </span>
      )}
      {file.kind !== 'image' && (
        <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[9px] font-medium capitalize text-white">{file.kind}</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/75 text-white hover:bg-black"
      >
        <X className="h-3 w-3" />
      </button>
    </li>
  );
}

function DesignPicker({ userId, open, onOpenChange, onPick }: { userId: string; open: boolean; onOpenChange: (open: boolean) => void; onPick: (file: AttachedFile) => void }) {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['creatives', 'ad-studio-picker', userId],
    enabled: open && !!userId,
    queryFn: () => CreativeService.list(userId),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-[#0f0f14] text-white">
        <DialogHeader>
          <DialogTitle>Choose one of your designs</DialogTitle>
          <DialogDescription className="text-white/50">Its picture is used as a reference for the ad.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto">
          {isLoading && Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="aspect-square rounded-xl" />)}
          {isError && <p className="col-span-3 text-sm text-red-300">Your designs could not be loaded.</p>}
          {!isLoading && !isError && data.length === 0 && <p className="col-span-3 text-sm text-white/50">You have no designs yet.</p>}
          {data.map((design) => (
            <button
              key={design.id}
              type="button"
              disabled={!design.preview_url}
              onClick={() => { onPick(designAttachment(design)); onOpenChange(false); }}
              className="group min-w-0 text-left disabled:opacity-40"
              aria-label={`Use ${design.name || 'design'}`}
            >
              <span className="block aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#15151b]">
                {design.preview_url && <img src={design.preview_url} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" loading="lazy" />}
              </span>
              <span className="mt-1 block truncate text-xs text-white/70">{design.name || 'Untitled design'}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const PromptBox: React.FC<Props> = ({ userId, value, onChange, files, onUpload, onPickDesign, onRemove, onSend, canSend, sending }) => {
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const [designs, setDesigns] = useState(false);

  const speech = useSpeech(
    (text) => onChange(`${valueRef.current}${valueRef.current && !/\s$/.test(valueRef.current) ? ' ' : ''}${text}`),
    (message) => toast({ title: 'Voice input', description: message, variant: 'destructive' }),
  );

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.style.height = 'auto';
    area.style.height = `${Math.min(220, area.scrollHeight)}px`;
  }, [value]);

  const choose = (kind: Exclude<FileKind, 'design'>) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (picked.length) onUpload(kind, picked);
  };

  return (
    <div className="rounded-[26px] border border-white/[0.08] bg-[#14141b] p-3 shadow-[0_20px_60px_-30px_rgba(125,92,255,0.45)] focus-within:border-[#7d5cff]/60">
      {files.length > 0 && (
        <ul className="mb-3 flex gap-2 overflow-x-auto pb-1" aria-label="Attached files">
          {files.map((file) => <Thumb key={file.id} file={file} onRemove={() => onRemove(file.id)} />)}
        </ul>
      )}
      <textarea
        ref={areaRef}
        value={value}
        rows={2}
        aria-label="Describe your ad"
        placeholder="Describe the ad: what you sell, who it is for, and the offer"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canSend && !sending) {
            event.preventDefault();
            onSend();
          }
        }}
        className="block max-h-[220px] min-h-[56px] w-full resize-none bg-transparent px-2 py-1 text-[16px] leading-relaxed text-white outline-none placeholder:text-white/35"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Add files" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white hover:bg-white/10">
              <Plus className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60 border-white/10 bg-[#15151b] text-white">
            <DropdownMenuItem onSelect={() => photoRef.current?.click()} className="gap-2"><ImageIcon className="h-4 w-4" /> Upload a product photo</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => videoRef.current?.click()} className="gap-2"><Video className="h-4 w-4" /> Upload a video</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => logoRef.current?.click()} className="gap-2"><Stamp className="h-4 w-4" /> Upload a logo</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDesigns(true)} className="gap-2"><FolderOpen className="h-4 w-4" /> Choose one of your designs</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          {speech.supported && (
            <button
              type="button"
              onClick={speech.toggle}
              aria-pressed={speech.listening}
              aria-label={speech.listening ? 'Stop voice input' : 'Start voice input'}
              className={cn(
                'grid h-10 w-10 place-items-center rounded-full border transition',
                speech.listening ? 'animate-pulse border-red-400/60 bg-red-500/20 text-red-200' : 'border-white/10 text-white hover:bg-white/10',
              )}
            >
              {speech.listening ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend || sending}
            aria-label="Send"
            className="ad-studio-primary grid h-10 w-10 place-items-center rounded-full transition hover:brightness-110 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <input ref={photoRef} type="file" accept={ACCEPT.image} multiple className="hidden" aria-hidden tabIndex={-1} data-testid="upload-photo" onChange={choose('image')} />
      <input ref={videoRef} type="file" accept={ACCEPT.video} className="hidden" aria-hidden tabIndex={-1} data-testid="upload-video" onChange={choose('video')} />
      <input ref={logoRef} type="file" accept={ACCEPT.logo} className="hidden" aria-hidden tabIndex={-1} data-testid="upload-logo" onChange={choose('logo')} />
      <DesignPicker userId={userId} open={designs} onOpenChange={setDesigns} onPick={onPickDesign} />
    </div>
  );
};

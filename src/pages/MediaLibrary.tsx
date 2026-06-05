import React, { useMemo, useRef, useState } from 'react';
import {
  Upload,
  FolderPlus,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Star,
  MoreVertical,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  FileText,
  Trash2,
  Download,
  PenTool,
  Megaphone,
  Folder,
  X,
  Play,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  useMediaAssets,
  useMediaFolders,
  useCreateFolder,
  useUploadAssets,
  useDeleteAsset,
  useToggleFavorite,
  type MediaAsset,
} from '@/hooks/useMediaLibrary';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const formatBytes = (b: number) => {
  if (!b) return '0 KB';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(b > k ? 1 : 0)} ${sizes[i]}`;
};

const STORAGE_QUOTA_BYTES = 100 * 1024 * 1024 * 1024; // 100 GB

const typeIcon = (t: string) =>
  t === 'video' ? VideoIcon : t === 'audio' ? MusicIcon : t === 'image' ? ImageIcon : FileText;

const KpiCard: React.FC<{
  label: string;
  value: string | number;
  delta?: string;
  icon: React.ElementType;
  tint: string;
}> = ({ label, value, delta, icon: Icon, tint }) => (
  <Card className="p-4 sm:p-5 flex items-center gap-4 border-border/60">
    <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center shrink-0', tint)}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{value}</p>
      {delta && (
        <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
          <TrendingUp className="h-3 w-3" />
          {delta}
        </p>
      )}
    </div>
  </Card>
);

const AssetThumb: React.FC<{ asset: MediaAsset }> = ({ asset }) => {
  if (asset.type === 'image' && (asset.thumbnail_url || asset.file_url)) {
    return (
      <img
        src={asset.thumbnail_url || asset.file_url!}
        alt={asset.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  if (asset.type === 'video') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
        {asset.file_url && (
          <video src={asset.file_url} className="h-full w-full object-cover opacity-90" muted preload="metadata" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
            <Play className="h-5 w-5 text-white fill-white" />
          </div>
        </div>
      </div>
    );
  }
  if (asset.type === 'audio') {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-fuchsia-100 dark:from-violet-950/40 dark:to-fuchsia-950/40 flex items-center justify-center">
        <MusicIcon className="h-10 w-10 text-violet-500" />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 bg-muted flex items-center justify-center">
      <FileText className="h-10 w-10 text-muted-foreground" />
    </div>
  );
};

const AssetCard: React.FC<{
  asset: MediaAsset;
  onOpen: () => void;
  onToggleFav: () => void;
  onDelete: () => void;
}> = ({ asset, onOpen, onToggleFav, onDelete }) => {
  const sizeLabel = `${asset.type.toUpperCase()} • ${formatBytes(asset.file_size)}`;
  return (
    <div className="group cursor-pointer" onClick={onOpen}>
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted ring-1 ring-border/60">
        <AssetThumb asset={asset} />
        {asset.type === 'video' && (
          <div className="absolute bottom-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/70 text-white">
            {asset.mime_type?.split('/')[1]?.toUpperCase() || 'VIDEO'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition" />
      </div>
      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{asset.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sizeLabel}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFav();
            }}
            className="p-1 rounded hover:bg-muted"
          >
            <Star
              className={cn(
                'h-4 w-4',
                asset.favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
              )}
            />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-1 rounded hover:bg-muted">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onOpen}>Preview</DropdownMenuItem>
              {asset.file_url && (
                <DropdownMenuItem asChild>
                  <a href={asset.file_url} target="_blank" rel="noreferrer" download>
                    Download
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

const MediaLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { data: assets = [], isLoading, error, refetch } = useMediaAssets();
  const { data: folders = [] } = useMediaFolders();
  const createFolder = useCreateFolder();
  const uploadAssets = useUploadAssets();
  const deleteAsset = useDeleteAsset();
  const toggleFav = useToggleFavorite();

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const counts = useMemo(() => {
    return {
      all: assets.length,
      image: assets.filter((a) => a.type === 'image').length,
      video: assets.filter((a) => a.type === 'video').length,
      audio: assets.filter((a) => a.type === 'audio').length,
      favorites: assets.filter((a) => a.favorite).length,
    };
  }, [assets]);

  const storageUsed = useMemo(() => assets.reduce((s, a) => s + (a.file_size || 0), 0), [assets]);
  const storagePct = Math.min(100, (storageUsed / STORAGE_QUOTA_BYTES) * 100);

  const byType = useMemo(() => {
    const acc = { image: 0, video: 0, audio: 0, document: 0 };
    assets.forEach((a) => {
      acc[a.type as keyof typeof acc] = (acc[a.type as keyof typeof acc] || 0) + (a.file_size || 0);
    });
    return acc;
  }, [assets]);

  const filtered = useMemo(() => {
    let list = assets.slice();
    if (tab === 'favorites') list = list.filter((a) => a.favorite);
    else if (tab !== 'all') list = list.filter((a) => a.type === tab);
    if (activeFolder) list = list.filter((a) => a.folder === activeFolder);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || (a.tags || []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (sort === 'newest') list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === 'oldest') list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'size') list.sort((a, b) => b.file_size - a.file_size);
    return list;
  }, [assets, tab, activeFolder, query, sort]);

  const recent = useMemo(
    () => assets.slice().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5),
    [assets],
  );

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadAssets.mutate({ files: Array.from(files), folder: activeFolder });
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your images, videos, and audio files in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 w-64 rounded-full"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowNewFolder(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAssets.isPending}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploadAssets.isPending ? 'Uploading…' : 'Upload Media'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.currentTarget.value = '';
            }}
          />
        </div>
      </div>

      {/* Mobile search */}
      <div className="relative md:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search media..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 rounded-full"
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="All Files"
          value={counts.all.toLocaleString()}
          icon={ImageIcon}
          tint="bg-violet-100 text-violet-600 dark:bg-violet-950/40"
        />
        <KpiCard
          label="Images"
          value={counts.image.toLocaleString()}
          icon={ImageIcon}
          tint="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40"
        />
        <KpiCard
          label="Videos"
          value={counts.video.toLocaleString()}
          icon={VideoIcon}
          tint="bg-sky-100 text-sky-600 dark:bg-sky-950/40"
        />
        <KpiCard
          label="Audio"
          value={counts.audio.toLocaleString()}
          icon={MusicIcon}
          tint="bg-pink-100 text-pink-600 dark:bg-pink-950/40"
        />
      </div>

      {/* Folders strip */}
      {folders.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <Button
            variant={activeFolder === null ? 'default' : 'outline'}
            size="sm"
            className="rounded-full shrink-0"
            onClick={() => setActiveFolder(null)}
          >
            All folders
          </Button>
          {folders.map((f) => (
            <Button
              key={f.id}
              variant={activeFolder === f.name ? 'default' : 'outline'}
              size="sm"
              className="rounded-full shrink-0"
              onClick={() => setActiveFolder(f.name)}
            >
              <Folder className="h-3.5 w-3.5 mr-1.5" />
              {f.name}
            </Button>
          ))}
        </div>
      )}

      {/* Filters bar */}
      <Card className="p-2 sm:p-3 flex flex-wrap items-center gap-2 border-border/60">
        <Tabs value={tab} onValueChange={setTab} className="flex-1 min-w-0">
          <TabsList className="bg-transparent gap-1 flex-wrap h-auto">
            {[
              ['all', 'All Media', counts.all],
              ['image', 'Images', counts.image],
              ['video', 'Videos', counts.video],
              ['audio', 'Audio', counts.audio],
              ['favorites', 'Favorites', counts.favorites],
            ].map(([val, label, n]) => (
              <TabsTrigger
                key={val as string}
                value={val as string}
                className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700 dark:data-[state=active]:bg-violet-950/40 rounded-full px-3"
              >
                <span>{label}</span>
                <span className="ml-2 text-xs text-muted-foreground">{n as number}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-1 ml-auto">
          <div className="hidden sm:flex border rounded-lg p-0.5">
            <button
              onClick={() => setView('grid')}
              className={cn('p-1.5 rounded', view === 'grid' ? 'bg-violet-100 text-violet-700' : 'text-muted-foreground')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('p-1.5 rounded', view === 'list' ? 'bg-violet-100 text-violet-700' : 'text-muted-foreground')}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Largest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Loading / Error / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4 mt-2" />
              <Skeleton className="h-3 w-1/2 mt-1" />
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">Failed to load media</p>
          <Button size="sm" onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : filtered.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            'border-2 border-dashed rounded-2xl p-12 text-center transition',
            dragOver ? 'border-violet-500 bg-violet-50/50' : 'border-border bg-muted/30',
          )}
        >
          <div className="mx-auto h-14 w-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
            <Upload className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No assets yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Drag &amp; drop files here or click to browse.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => fileInputRef.current?.click()} className="bg-violet-600 hover:bg-violet-700 text-white">
              <Upload className="h-4 w-4 mr-2" />
              Upload Assets
            </Button>
            <Button variant="outline" onClick={() => setShowNewFolder(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            'rounded-2xl transition',
            dragOver && 'ring-2 ring-violet-400 ring-offset-2 ring-offset-background',
          )}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Upload tile */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/60 hover:bg-violet-100/60 dark:bg-violet-950/20 flex flex-col items-center justify-center text-center p-3 transition"
            >
              <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mb-2">
                <Upload className="h-5 w-5 text-violet-600" />
              </div>
              <p className="text-sm font-semibold text-violet-700">Upload Media</p>
              <p className="text-[11px] text-muted-foreground mt-1">Drop files or click to browse</p>
              <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, MP4, MOV, MP3</p>
            </button>

            {filtered.map((a) => (
              <AssetCard
                key={a.id}
                asset={a}
                onOpen={() => setPreview(a)}
                onToggleFav={() => toggleFav.mutate(a)}
                onDelete={() => deleteAsset.mutate(a)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Storage + Recent Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5 border-border/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Storage Overview</h3>
            <Button size="sm" variant="outline">
              Upgrade
            </Button>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="bg-violet-500" style={{ width: `${(byType.image / storageUsed) * 100 || 0}%` }} />
            <div className="bg-emerald-500" style={{ width: `${(byType.video / storageUsed) * 100 || 0}%` }} />
            <div className="bg-pink-500" style={{ width: `${(byType.audio / storageUsed) * 100 || 0}%` }} />
            <div className="bg-amber-500" style={{ width: `${(byType.document / storageUsed) * 100 || 0}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <span>{formatBytes(storageUsed)} of {formatBytes(STORAGE_QUOTA_BYTES)} used</span>
            <span>{formatBytes(Math.max(0, STORAGE_QUOTA_BYTES - storageUsed))} available</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { k: 'Images', v: byType.image, c: 'bg-violet-500', icon: ImageIcon },
              { k: 'Videos', v: byType.video, c: 'bg-emerald-500', icon: VideoIcon },
              { k: 'Audio', v: byType.audio, c: 'bg-pink-500', icon: MusicIcon },
              { k: 'Others', v: byType.document, c: 'bg-amber-500', icon: FileText },
            ].map((row) => {
              const pct = storageUsed ? Math.round((row.v / storageUsed) * 100) : 0;
              const Icon = row.icon;
              return (
                <div key={row.k} className="flex items-center gap-2">
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-white', row.c)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{row.k}</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatBytes(row.v)} <span className="text-muted-foreground font-normal">{pct}%</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 border-border/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Recent Uploads</h3>
          </div>
          <div className="space-y-3">
            {recent.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent uploads.</p>
            )}
            {recent.map((a) => {
              const Icon = typeIcon(a.type);
              return (
                <button
                  key={a.id}
                  onClick={() => setPreview(a)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0 relative">
                    {a.type === 'image' && (a.thumbnail_url || a.file_url) ? (
                      <img src={a.thumbnail_url || a.file_url!} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatBytes(a.file_size)}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Mobile floating upload */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="sm:hidden fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Preview modal */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="truncate">{preview.name}</span>
                  {preview.favorite && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                </DialogTitle>
              </DialogHeader>
              <div className="rounded-xl overflow-hidden bg-muted relative aspect-video">
                {preview.type === 'image' && preview.file_url && (
                  <img src={preview.file_url} alt={preview.name} className="absolute inset-0 h-full w-full object-contain" />
                )}
                {preview.type === 'video' && preview.file_url && (
                  <video src={preview.file_url} controls className="absolute inset-0 h-full w-full object-contain" />
                )}
                {preview.type === 'audio' && preview.file_url && (
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <audio src={preview.file_url} controls className="w-full" />
                  </div>
                )}
                {preview.type === 'document' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium">{preview.mime_type || preview.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Size</p>
                  <p className="font-medium">{formatBytes(preview.file_size)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Uploaded</p>
                  <p className="font-medium">{new Date(preview.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Usage</p>
                  <p className="font-medium">{preview.usage_count}×</p>
                </div>
              </div>
              {preview.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {preview.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
              <DialogFooter className="flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate('/campaigns')}>
                  <Megaphone className="h-4 w-4 mr-2" />
                  Use in Campaign
                </Button>
                <Button variant="outline" onClick={() => navigate('/visual-editor')}>
                  <PenTool className="h-4 w-4 mr-2" />
                  Open in Editor
                </Button>
                {preview.file_url && (
                  <Button variant="outline" asChild>
                    <a href={preview.file_url} target="_blank" rel="noreferrer" download>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteAsset.mutate(preview);
                    setPreview(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New folder dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name (e.g. Brand Assets)"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newFolderName.trim()) return;
                createFolder.mutate(newFolderName.trim(), {
                  onSuccess: () => {
                    setNewFolderName('');
                    setShowNewFolder(false);
                  },
                });
              }}
              disabled={createFolder.isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaLibrary;

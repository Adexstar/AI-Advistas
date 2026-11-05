import { ImageIcon, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMediaAssets, type MediaAsset } from '@/hooks/useMediaLibrary';
import { signedMediaUrl } from '@/lib/mediaUrl';

export function CreateAdMediaPicker({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}) {
  const { data, isLoading, error } = useMediaAssets();
  const images = (data ?? []).filter((asset) => asset.type === 'image' && (asset.file_url || asset.thumbnail_url || asset.file_path));

  const choose = async (asset: MediaAsset) => {
    const url = asset.file_url || asset.thumbnail_url || (asset.file_path ? await signedMediaUrl(asset.file_path) : '');
    if (!url) return;
    onSelect(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Media library</DialogTitle>
          <DialogDescription>Choose an image you already uploaded.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <p className="text-sm text-destructive">Could not load your media library.</p>
        ) : images.length === 0 ? (
          <div className="py-10 text-center">
            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No images yet</p>
            <p className="text-xs text-muted-foreground">Upload a file on this step, or add images in Media Library.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => void choose(asset)}
                className="overflow-hidden rounded-xl border border-border bg-card text-left hover:border-primary/40"
              >
                <img src={asset.thumbnail_url || asset.file_url || ''} alt="" className="aspect-square w-full object-cover" />
                <p className="truncate px-2 py-1.5 text-xs">{asset.name}</p>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

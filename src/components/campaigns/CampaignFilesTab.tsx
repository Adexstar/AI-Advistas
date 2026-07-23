import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Image, Video, File, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignAssetService } from '@/services/campaign/CampaignAssetService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { CampaignAsset } from '@/services/campaign/types';

const TYPE_ICONS: Record<string, React.ElementType> = {
  template: FileText,
  image: Image,
  video: Video,
  document: File,
  report: FileText,
};

interface Props {
  campaignId: string;
}

export function CampaignFilesTab({ campaignId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: assets, isLoading } = useQuery({
    queryKey: ['campaign-assets', campaignId],
    queryFn: () => CampaignAssetService.list(campaignId),
  });

  const handleRemove = async (asset: CampaignAsset) => {
    try {
      await CampaignAssetService.remove(asset.id, campaignId, user!.id);
      qc.invalidateQueries({ queryKey: ['campaign-assets', campaignId] });
      toast.success('Asset removed');
    } catch {
      toast.error('Failed to remove asset');
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No assets attached</p>
          <p className="text-sm text-muted-foreground">Templates, images, and other files will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {assets.map((asset) => {
        const Icon = TYPE_ICONS[asset.asset_type] || File;
        return (
          <Card key={asset.id} className="rounded-xl border-border/60">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{asset.asset_name || asset.asset_type}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] capitalize">{asset.asset_type}</Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(asset.added_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {asset.asset_url && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <a href={asset.asset_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(asset)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

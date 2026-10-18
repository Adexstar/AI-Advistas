import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CreativeService } from '@/services/creative/CreativeService';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Image, Plus, Pencil } from 'lucide-react';

export function CampaignCreativesTab({ campaignId }: { campaignId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['creatives', user?.id, campaignId],
    enabled: !!user,
    queryFn: () => {
      if (!user) throw new Error('Not signed in');
      return CreativeService.list(user.id, campaignId);
    },
  });
  return <section className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-lg font-bold">Creatives</h3>
      <Button onClick={() => navigate(`/visual-editor?campaignId=${campaignId}`)}><Plus className="mr-2 h-4 w-4" />New creative</Button>
    </div>
    {query.isLoading && <Skeleton className="h-40 w-full" />}
    {query.isError && <div role="alert" className="text-destructive">Could not load creatives. <Button variant="outline" onClick={() => query.refetch()}>Retry</Button></div>}
    {!query.isLoading && !query.isError && !query.data?.length && <p className="py-8 text-center text-muted-foreground">No creatives yet.</p>}
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {query.data?.map(creative => <article key={creative.id} className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex aspect-[4/3] items-center justify-center bg-muted">
          {creative.preview_url ? <img src={creative.preview_url} alt={creative.name} className="h-full w-full object-contain" /> : <Image className="h-8 w-8 text-muted-foreground" />}
        </div>
        <div className="space-y-2 p-4">
          <h4 className="truncate font-semibold">{creative.name}</h4>
          <p className="text-xs capitalize text-muted-foreground">{creative.status}</p>
          <Button variant="outline" onClick={() => navigate(`/visual-editor?campaignId=${campaignId}&adId=${creative.id}`)}><Pencil className="mr-2 h-4 w-4" />Edit creative</Button>
        </div>
      </article>)}
    </div>
  </section>;
}
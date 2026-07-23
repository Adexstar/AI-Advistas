import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GitBranch, RotateCcw, Plus, Tag, Eye, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignVersionService } from '@/services/campaign/CampaignVersionService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { CampaignVersion } from '@/services/campaign/types';

interface Props {
  campaignId: string;
}

export function CampaignVersionsTab({ campaignId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ['campaign-versions', campaignId],
    queryFn: () => CampaignVersionService.list(campaignId),
  });

  const handleCreate = async () => {
    if (!user) return;
    try {
      await CampaignVersionService.create(campaignId, user.id, label || undefined, description || undefined);
      qc.invalidateQueries({ queryKey: ['campaign-versions', campaignId] });
      qc.invalidateQueries({ queryKey: ['campaign-events', campaignId] });
      setShowCreateDialog(false);
      setLabel('');
      setDescription('');
      toast.success('Version created');
    } catch {
      toast.error('Failed to create version');
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!user) return;
    if (!confirm('Restoring a version will overwrite your current campaign. Continue?')) return;
    setRestoring(versionId);
    try {
      await CampaignVersionService.restore(campaignId, user.id, versionId);
      qc.invalidateQueries({ queryKey: ['campaign-versions', campaignId] });
      qc.invalidateQueries({ queryKey: ['campaign', campaignId] });
      qc.invalidateQueries({ queryKey: ['campaign-events', campaignId] });
      toast.success('Version restored');
    } catch {
      toast.error('Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Version History</h3>
          <p className="text-sm text-muted-foreground">Git-like snapshots of your campaign state.</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-1.5 rounded-xl">
          <Plus className="h-4 w-4" /> Save Version
        </Button>
      </div>

      {(!versions || versions.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <GitBranch className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">No versions saved</p>
            <p className="text-sm text-muted-foreground">Save snapshots of your campaign to track changes over time.</p>
            <Button variant="outline" className="mt-4 gap-1.5" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" /> Create First Version
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {versions.map((version, i) => (
            <Card key={version.id} className="rounded-xl border-border/60 hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <GitBranch className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold">v{version.version_number}</span>
                        {version.label && <Badge variant="secondary" className="text-[10px]">{version.label}</Badge>}
                        {i === 0 && (
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-0">
                            Current
                          </Badge>
                        )}
                      </div>
                      {version.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{version.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(version.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={() => handleRestore(version.id)}
                      disabled={restoring === version.id || i === 0}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Label (optional)</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Before headline change"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What changed in this version?"
                className="w-full min-h-[80px] rounded-xl border border-input bg-transparent px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!label && !description}>Save Version</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

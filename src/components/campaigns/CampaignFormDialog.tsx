import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CAMPAIGN_OBJECTIVES, CAMPAIGN_PLATFORMS, CampaignRow, useCreateCampaign, useUpdateCampaign } from '@/hooks/useCampaigns';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaign?: CampaignRow | null;
}

export function CampaignFormDialog({ open, onOpenChange, campaign }: Props) {
  const create = useCreateCampaign();
  const update = useUpdateCampaign();
  const isEdit = !!campaign;

  const [form, setForm] = useState({
    name: '',
    objective: 'awareness',
    platform: 'Facebook',
    budget: 0,
    status: 'draft',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (campaign) {
      setForm({
        name: campaign.name,
        objective: campaign.objective || 'awareness',
        platform: campaign.platform || 'Facebook',
        budget: Number(campaign.budget) || 0,
        status: campaign.status,
        start_date: campaign.start_date ? campaign.start_date.slice(0, 10) : '',
        end_date: campaign.end_date ? campaign.end_date.slice(0, 10) : '',
      });
    } else {
      setForm({ name: '', objective: 'awareness', platform: 'Facebook', budget: 0, status: 'draft', start_date: '', end_date: '' });
    }
  }, [campaign, open]);

  const handleSubmit = async () => {
    const payload = {
      name: form.name,
      objective: form.objective,
      platform: form.platform,
      budget: Number(form.budget),
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };
    if (isEdit && campaign) {
      await update.mutateAsync({ id: campaign.id, updates: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Campaign Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Summer Sale 2026" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Objective</Label>
              <Select value={form.objective} onValueChange={(v) => setForm({ ...form, objective: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_OBJECTIVES.map((o) => (
                    <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Budget ($)</Label>
              <Input type="number" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={busy || !form.name.trim()}>
            {busy ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { StickyNote, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { CampaignService } from '@/services/campaign/CampaignService';
import { toast } from 'sonner';

interface Props {
  campaignId: string;
  initialNotes: string | null;
}

export function CampaignNotesTab({ campaignId, initialNotes }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await CampaignService.updateNotes(campaignId, user.id, notes);
      qc.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Notes saved');
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Notes</h3>
          <p className="text-sm text-muted-foreground">Internal notes for your campaign team.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5 rounded-xl">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Notes'}
        </Button>
      </div>
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about your campaign strategy, creative direction, team feedback..."
            className="w-full min-h-[300px] rounded-2xl border-0 bg-transparent px-5 py-5 text-sm resize-none focus:outline-none"
          />
        </CardContent>
      </Card>
    </div>
  );
}

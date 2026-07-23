import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignAutomationService } from '@/services/campaign/CampaignAutomationService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { AutomationRuleConfig } from '@/services/campaign/types';

interface Props {
  campaignId: string;
}

const TRIGGER_OPTIONS = [
  { value: 'cpa_exceeded', label: 'CPA exceeds target', desc: 'Pause when cost per acquisition goes above threshold' },
  { value: 'roas_above', label: 'ROAS above threshold', desc: 'Increase budget when ROAS exceeds target' },
  { value: 'ctr_dropped', label: 'CTR drops below target', desc: 'Notify when click-through rate decreases' },
  { value: 'creative_fatigue', label: 'Creative fatigue detected', desc: 'Generate new creatives when frequency is high' },
  { value: 'budget_depleted', label: 'Budget nearly depleted', desc: 'Notify when 80% of budget is spent' },
];

const ACTION_OPTIONS = [
  { value: 'pause_campaign', label: 'Pause Campaign' },
  { value: 'increase_budget', label: 'Increase Budget' },
  { value: 'decrease_budget', label: 'Decrease Budget' },
  { value: 'notify', label: 'Send Notification' },
  { value: 'generate_creatives', label: 'Generate New Creatives' },
];

export function CampaignAutomationRules({ campaignId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    triggerType: 'cpa_exceeded',
    threshold: 0,
    actionType: 'notify',
    actionValue: 0,
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ['automation-rules', user?.id],
    queryFn: () => CampaignAutomationService.listRules(user!.id),
    enabled: !!user,
  });

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await CampaignAutomationService.toggleRule(id, enabled);
      qc.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success(enabled ? 'Rule enabled' : 'Rule disabled');
    } catch {
      toast.error('Failed to toggle rule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this automation rule?')) return;
    try {
      await CampaignAutomationService.deleteRule(id);
      qc.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Rule deleted');
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    try {
      await CampaignAutomationService.createRule(user.id, {
        name: newRule.name,
        trigger: { type: newRule.triggerType, threshold: newRule.threshold } as any,
        condition: {},
        action: { type: newRule.actionType, value: newRule.actionValue || undefined } as any,
        enabled: true,
      });
      qc.invalidateQueries({ queryKey: ['automation-rules'] });
      setShowCreate(false);
      setNewRule({ name: '', triggerType: 'cpa_exceeded', threshold: 0, actionType: 'notify', actionValue: 0 });
      toast.success('Rule created');
    } catch {
      toast.error('Failed to create rule');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Automation Rules</h3>
          <p className="text-sm text-muted-foreground">Set rules for autonomous campaign optimization.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5 rounded-xl">
          <Plus className="h-4 w-4" /> Add Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : (!rules || rules.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">No automation rules yet</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Create rules to automate campaign optimization — pause on high CPA, scale on strong ROAS, and more.
            </p>
            <Button variant="outline" className="mt-4 gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Add Your First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => {
            const triggerLabel = TRIGGER_OPTIONS.find((t) => t.value === rule.trigger.type)?.label || rule.trigger.type;
            return (
              <Card key={rule.id} className="rounded-xl border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{rule.name}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {rule.trigger.type.replace(/_/g, ' ')}
                        </Badge>
                        {rule.trigger.threshold && (
                          <span className="text-xs text-muted-foreground">
                            Threshold: {rule.trigger.threshold}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{triggerLabel}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(v) => handleToggle(rule.id, v)}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Automation Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rule Name</Label>
              <Input value={newRule.name} onChange={(e) => setNewRule({ ...newRule, name: e.target.value })} placeholder="e.g., Pause on high CPA" />
            </div>
            <div>
              <Label>Trigger</Label>
              <Select value={newRule.triggerType} onValueChange={(v) => setNewRule({ ...newRule, triggerType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Threshold</Label>
              <Input type="number" min={0} value={newRule.threshold || ''} onChange={(e) => setNewRule({ ...newRule, threshold: Number(e.target.value) })} placeholder="e.g., 50" />
            </div>
            <div>
              <Label>Action</Label>
              <Select value={newRule.actionType} onValueChange={(v) => setNewRule({ ...newRule, actionType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newRule.name.trim()}>Create Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

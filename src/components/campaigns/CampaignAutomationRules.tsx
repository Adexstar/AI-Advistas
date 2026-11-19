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
import { CampaignService } from '@/services/campaign/CampaignService';
import { budgetAfterAction, checkRule, signalsFromMetrics } from '@/services/campaign/automationMatch';
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
  { value: 'generate_creatives', label: 'Flag that new creatives are needed' },
];

export function CampaignAutomationRules({ campaignId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkNotes, setCheckNotes] = useState<string[]>([]);
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

  const handleCheck = async () => {
    if (!user) return;
    setChecking(true);
    try {
      const campaign = await CampaignService.get(campaignId);
      const signals = signalsFromMetrics(campaign);
      const notes: string[] = [];
      for (const rule of rules ?? []) {
        const result = checkRule(rule, signals);
        notes.push(`${rule.name}: ${result.detail}`);
        if (!result.matched) continue;
        if (rule.action.type === 'pause_campaign' && campaign.status !== 'paused') {
          await CampaignService.updateStatus(campaignId, user.id, 'paused');
          notes[notes.length - 1] += ' Campaign paused.';
        } else if (rule.action.type === 'increase_budget' || rule.action.type === 'decrease_budget') {
          const next = budgetAfterAction(Number(campaign.budget || 0), rule.action);
          if (next == null) notes[notes.length - 1] += ' Set an amount on the rule before the budget can change.';
          else {
            await CampaignService.updateBudget(campaignId, user.id, next);
            notes[notes.length - 1] += ` Budget is now ${next}.`;
          }
        } else if (rule.action.type === 'notify') {
          await CampaignAutomationService.enqueueAction(campaignId, user.id, rule.id, 'notify', {}, result.detail);
          notes[notes.length - 1] += ' A note was added to this campaign.';
        } else if (rule.action.type === 'generate_creatives') {
          notes[notes.length - 1] += ' Creative generation is not started from this check.';
        }
      }
      if (!notes.length) notes.push('Add a rule before checking this campaign.');
      setCheckNotes(notes);
      toast.success('Rules checked against the saved metrics');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not check the rules');
    } finally {
      setChecking(false);
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
          <p className="text-sm text-muted-foreground">Rules are saved on your account and run only when you check this campaign. Nothing runs in the background.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void handleCheck()} disabled={checking} className="rounded-xl">
            {checking ? 'Checking…' : 'Check this campaign'}
          </Button>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5 rounded-xl">
            <Plus className="h-4 w-4" /> Add Rule
          </Button>
        </div>
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
              A rule can pause the campaign, change its budget, or record a note when you run the check and the saved metrics match.
            </p>
            <Button variant="outline" className="mt-4 gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Add Your First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {checkNotes.length > 0 && (
            <Card className="rounded-xl border-border/60">
              <CardContent className="space-y-1 p-4 text-sm">
                {checkNotes.map((note) => <p key={note}>{note}</p>)}
              </CardContent>
            </Card>
          )}
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

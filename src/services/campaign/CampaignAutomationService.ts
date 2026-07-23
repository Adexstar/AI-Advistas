import { supabase } from '@/integrations/supabase/client';
import type { AutomationRuleConfig, CampaignAutomationQueueItem } from './types';
import { CampaignEventService } from './CampaignEventService';

export const CampaignAutomationService = {
  async listRules(userId: string) {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AutomationRuleConfig[];
  },

  async createRule(
    userId: string,
    input: Pick<AutomationRuleConfig, 'name' | 'trigger' | 'condition' | 'action'> & { enabled?: boolean },
  ) {
    const { data, error } = await supabase
      .from('automation_rules')
      .insert({
        user_id: userId,
        name: input.name,
        trigger: input.trigger as any,
        condition: input.condition as any,
        action: input.action as any,
        enabled: input.enabled ?? false,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return data as AutomationRuleConfig;
  },

  async toggleRule(id: string, enabled: boolean) {
    const { error } = await supabase
      .from('automation_rules')
      .update({ enabled })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteRule(id: string) {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getQueue(campaignId: string) {
    const { data, error } = await supabase
      .from('campaign_automation_queue')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CampaignAutomationQueueItem[];
  },

  async enqueueAction(
    campaignId: string,
    userId: string,
    ruleId: string | null,
    actionType: string,
    actionParams: Record<string, unknown>,
    reason?: string,
  ) {
    const { data, error } = await supabase
      .from('campaign_automation_queue')
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        rule_id: ruleId,
        action_type: actionType,
        action_params: actionParams as any,
        status: 'pending',
        reason: reason ?? null,
      } as any)
      .select()
      .single();
    if (error) throw error;
    await CampaignEventService.log(campaignId, userId, 'rule_triggered', `Automation: ${actionType}`, reason ?? undefined);
    return data as CampaignAutomationQueueItem;
  },

  shouldPauseOnHighCPA(rule: AutomationRuleConfig, cpa: number): boolean {
    if (!rule.enabled || rule.trigger.type !== 'cpa_exceeded') return false;
    return cpa > (rule.trigger.threshold ?? Infinity);
  },

  shouldIncreaseBudgetOnHighROAS(rule: AutomationRuleConfig, roas: number): boolean {
    if (!rule.enabled || rule.trigger.type !== 'roas_above') return false;
    return roas > (rule.trigger.threshold ?? Infinity);
  },

  shouldNotifyOnLowCTR(rule: AutomationRuleConfig, ctr: number): boolean {
    if (!rule.enabled || rule.trigger.type !== 'ctr_dropped') return false;
    return ctr < (rule.trigger.threshold ?? 0);
  },

  shouldWarnOnCreativeFatigue(rule: AutomationRuleConfig, frequency: number): boolean {
    if (!rule.enabled || rule.trigger.type !== 'creative_fatigue') return false;
    return frequency > (rule.trigger.threshold ?? 3);
  },
};

import type { AIMode, AIContextRow, CategoryPlaybook } from './types';
import { sb } from './supabase';

export type Specialist =
  | 'creative_strategist'
  | 'design_advisor'
  | 'brand_guardian'
  | 'campaign_optimizer'
  | 'analytics_expert'
  | 'publishing_advisor'
  | 'general';

export interface OrchestratedPrompt {
  specialist: Specialist;
  systemPrompt: string;
  userPrompt: string;
  schema: Record<string, unknown>;
  context: {
    brand?: Record<string, unknown>;
    campaign?: Record<string, unknown>;
    category?: CategoryPlaybook | null;
    mode: AIMode;
    page: string;
  };
}

export const PromptOrchestrator = {
  async orchestrate(
    intent: string,
    context: AIContextRow | null,
    mode: AIMode,
    page: string,
    extraVars?: Record<string, string>,
  ): Promise<OrchestratedPrompt> {
    const specialist = this.routeSpecialist(intent);
    const template = await this.loadTemplate(specialist, intent, context?.active_category ?? null);
    const vars = this.buildVariables(context, extraVars);
    const renderedUserPrompt = this.renderTemplate(template?.user_prompt_template ?? this.defaultPrompt(specialist, intent), vars);

    return {
      specialist,
      systemPrompt: template?.system_prompt ?? this.defaultSystemPrompt(specialist, context ?? null),
      userPrompt: renderedUserPrompt,
      schema: template?.output_schema ?? {},
      context: {
        category: null,
        mode,
        page,
      },
    };
  },

  routeSpecialist(intent: string): Specialist {
    const lower = intent.toLowerCase();

    if (lower.includes('headline') || lower.includes('cta') || lower.includes('copy') ||
        lower.includes('creative') || lower.includes('variant') || lower.includes('concept')) {
      return 'creative_strategist';
    }
    if (lower.includes('layout') || lower.includes('design') || lower.includes('spacing') ||
        lower.includes('color') || lower.includes('typography') || lower.includes('visual')) {
      return 'design_advisor';
    }
    if (lower.includes('brand') || lower.includes('logo') || lower.includes('tone') ||
        lower.includes('voice') || lower.includes('identity')) {
      return 'brand_guardian';
    }
    if (lower.includes('budget') || lower.includes('platform') || lower.includes('optimize') ||
        lower.includes('objective') || lower.includes('perform')) {
      return 'campaign_optimizer';
    }
    if (lower.includes('analytics') || lower.includes('metric') || lower.includes('trend') ||
        lower.includes('insight') || lower.includes('report')) {
      return 'analytics_expert';
    }
    if (lower.includes('publish') || lower.includes('schedule') || lower.includes('compliance') ||
        lower.includes('format') || lower.includes('post')) {
      return 'publishing_advisor';
    }
    return 'general';
  },

  async loadTemplate(specialist: Specialist, intent: string, category: string | null): Promise<{
    system_prompt: string;
    user_prompt_template: string;
    output_schema: Record<string, unknown>;
  } | null> {
    try {
      const { data, error } = await sb
        .from('prompt_templates')
        .select('*')
        .eq('specialist', specialist)
        .eq('category', category ?? 'general')
        .order('usage_count', { ascending: false })
        .limit(1);
      if (error || !data || data.length === 0) return null;
      return data[0] as any;
    } catch {
      return null;
    }
  },

  buildVariables(context: AIContextRow | null, extra?: Record<string, string>): Record<string, string> {
    return {
      brand: context?.brand_id ?? 'unknown',
      category: context?.active_category ?? 'general',
      platform: context?.active_platform ?? 'any',
      objective: context?.active_objective ?? 'awareness',
      goal: context?.current_goal ?? 'unknown',
      campaign: context?.current_campaign_id ?? 'none',
      ...(extra ?? {}),
    };
  },

  renderTemplate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `[${key}]`);
  },

  defaultSystemPrompt(specialist: Specialist, context: AIContextRow | null): string {
    const base = 'You are an expert marketing AI assistant. ';
    const guardians: Record<Specialist, string> = {
      creative_strategist: 'You specialize in generating high-performing ad creative — headlines, CTAs, concepts, and variations. Be concise, persuasive, and data-informed.',
      design_advisor: 'You specialize in visual design review — layout, spacing, hierarchy, contrast, and typography. Be specific and actionable.',
      brand_guardian: 'You specialize in brand identity protection and consistency. Ensure all output adheres to brand guidelines for logo, colors, fonts, and tone of voice.',
      campaign_optimizer: 'You specialize in campaign performance optimization — budget allocation, audience targeting, platform selection, and bidding strategy.',
      analytics_expert: 'You specialize in marketing analytics — performance trends, metric interpretation, and actionable insights from campaign data.',
      publishing_advisor: 'You specialize in cross-platform publishing — compliance, best posting times, format requirements, and scheduling strategy.',
      general: 'You provide general marketing advice across creative, strategy, analytics, and publishing domains.',
    };
    const brandInfo = context?.brand_id ? ` The active brand ID is ${context.brand_id}.` : '';
    return base + guardians[specialist] + brandInfo;
  },

  defaultPrompt(specialist: Specialist, intent: string): string {
    return `Generate a ${specialist.replace('_', ' ')} response for: {{intent}}\n\nContext:\n- Brand: {{brand}}\n- Category: {{category}}\n- Platform: {{platform}}\n- Objective: {{objective}}\n- Goal: {{goal}}`;
  },
};

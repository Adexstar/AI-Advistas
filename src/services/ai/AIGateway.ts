import { supabase } from '@/integrations/supabase/client';

export type AIProvider = 'edge_function' | 'mock' | string;

export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  specialist: string;
  temperature?: number;
  maxTokens?: number;
  schema?: Record<string, unknown>;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  latency: number;
  tokensUsed?: number;
}

type ProviderFn = (req: AIRequest) => Promise<AIResponse>;

export const AIGateway = {
  activeProvider: 'edge_function' as AIProvider,

  providers: new Map<string, ProviderFn>(),

  register(name: string, fn: ProviderFn): void {
    this.providers.set(name, fn);
  },

  async route(request: AIRequest, preferredProvider?: AIProvider): Promise<AIResponse> {
    const provider = preferredProvider ?? this.activeProvider;

    if (this.providers.has(provider)) {
      return this.providers.get(provider)!(request);
    }

    switch (provider) {
      case 'edge_function':
        return this.callEdgeFunction(request);
      case 'mock':
        return this.mockResponse(request);
      default:
        return this.callEdgeFunction(request);
    }
  },

  async callEdgeFunction(request: AIRequest): Promise<AIResponse> {
    const start = performance.now();
    const functionName = this.mapSpecialistToFunction(request.specialist);

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          systemPrompt: request.systemPrompt,
          userPrompt: request.userPrompt,
          temperature: request.temperature ?? 0.7,
          maxTokens: request.maxTokens ?? 500,
          schema: request.schema,
        },
      });
      if (error) throw error;
      const content = data?.content ?? data?.output ?? JSON.stringify(data);
      return {
        content,
        provider: `supabase:${functionName}`,
        model: 'edge-function',
        latency: Math.round(performance.now() - start),
      };
    } catch (e) {
      return this.fallback(request, String(e));
    }
  },

  mapSpecialistToFunction(specialist: string): string {
    const map: Record<string, string> = {
      creative_strategist: 'generate-ad-copy',
      design_advisor: 'suggest-ad-style',
      campaign_optimizer: 'generate-ai-campaign',
      analytics_expert: 'analyze-performance',
      brand_guardian: 'generate-ad-copy',
      publishing_advisor: 'generate-ad-copy',
      general: 'generate-ad-copy',
    };
    return map[specialist] ?? 'generate-ad-copy';
  },

  async fallback(_request: AIRequest, error: string): Promise<AIResponse> {
    console.warn(`AIGateway fallback: ${error}`);
    return this.mockResponse(_request);
  },

  mockResponse(request: AIRequest): AIResponse {
    const start = performance.now();
    const content = `[AI ${request.specialist}] Generated response for: ${request.userPrompt.slice(0, 60)}...`;
    return {
      content,
      provider: 'mock',
      model: 'mock-v1',
      latency: Math.round(performance.now() - start),
    };
  },
};

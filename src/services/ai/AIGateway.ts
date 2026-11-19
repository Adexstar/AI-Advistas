import { supabase } from '@/integrations/supabase/client';
import { readEdgeError } from '@/services/edgeError';

export type AIProvider = 'edge_function' | string;

const UNAVAILABLE = 'AI is unavailable. Add GROQ_API_KEY, OPENAI_API_KEY, GOOGLE_GEMINI_API_KEY, or ANTHROPIC_API_KEY as a Supabase secret.';

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

    return this.callEdgeFunction(request, provider === 'edge_function' ? undefined : provider);
  },

  async callEdgeFunction(request: AIRequest, preferredProvider?: string): Promise<AIResponse> {
    const start = performance.now();
    const { data, error } = await supabase.functions.invoke('ai-gateway', {
      body: {
        systemPrompt: request.systemPrompt,
        userPrompt: request.userPrompt,
        specialist: request.specialist,
        temperature: request.temperature ?? 0.7,
        maxTokens: request.maxTokens ?? 500,
        schema: request.schema,
        preferredProvider,
      },
    });
    if (error) throw new Error(await readEdgeError(error, UNAVAILABLE));
    const payload = data && typeof data === 'object' ? data as { content?: unknown; error?: unknown; provider?: unknown; model?: unknown } : {};
    const content = typeof payload.content === 'string' ? payload.content.trim() : '';
    if (!content || payload.provider === 'error') {
      throw new Error(typeof payload.error === 'string' && payload.error.trim() ? payload.error : UNAVAILABLE);
    }
    return {
      content,
      provider: typeof payload.provider === 'string' ? payload.provider : 'ai-gateway',
      model: typeof payload.model === 'string' ? payload.model : 'edge-function',
      latency: Math.round(performance.now() - start),
    };
  },
};

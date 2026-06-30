import { supabase } from '@/lib/supabase';

const DEFAULT_AI_ENDPOINT = '/api/ai/gemini-finance-insight';

function getAiEndpoint(): string {
  return import.meta.env.VITE_AI_FUNCTION_URL || DEFAULT_AI_ENDPOINT;
}

export interface GeminiFinanceInsightResponse {
  result?: unknown;
  error?: string;
}

export async function invokeGeminiFinanceInsight(
  body: Record<string, unknown>,
): Promise<{ data: GeminiFinanceInsightResponse | null; error: Error | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const response = await fetch(getAiEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as GeminiFinanceInsightResponse;

    if (!response.ok) {
      return {
        data: null,
        error: new Error(payload.error || `AI request failed (${response.status})`),
      };
    }

    return { data: payload, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('AI request failed'),
    };
  }
}

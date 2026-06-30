import { createFileRoute } from '@tanstack/react-router';
import { handleGeminiFinanceInsightRequest } from '@/server/gemini-finance-insight';

export const Route = createFileRoute('/api/ai/gemini-finance-insight')({
  server: {
    handlers: {
      POST: async ({ request }) => handleGeminiFinanceInsightRequest(request),
      OPTIONS: async ({ request }) => handleGeminiFinanceInsightRequest(request),
    },
  },
});

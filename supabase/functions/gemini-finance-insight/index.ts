
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FinanceSummary {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  income: Array<{ category: string; amount: number }>;
  expenses: Array<{ category: string; amount: number }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { summary, question } = await req.json();

    if (!summary) {
      throw new Error('Finance summary is required');
    }

    let prompt: string;

    if (question) {
      // This is a follow-up question
      const contextPrompt = buildPrompt(summary);
      prompt = `
Berdasarkan evaluasi keuangan berikut:
${contextPrompt}

User bertanya: "${question}"

Berikan jawaban yang helpful dan actionable dalam 1-2 paragraf:
      `;
    } else {
      // This is the initial insight request
      prompt = buildPrompt(summary);
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: question ? 512 : 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      console.error('Gemini API response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);
    
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Gagal mendapatkan insight.";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-finance-insight function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Gagal mendapatkan insight dari AI' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildPrompt(summary: FinanceSummary): string {
  const { startDate, endDate, income, expenses } = summary;

  // Format income by category
  const formatCategoryItems = (items: Array<{ category: string; amount: number }>, type: 'pemasukan' | 'pengeluaran') => {
    if (items.length === 0) return `Tidak ada ${type} yang tercatat.`;
    
    // Group by category and sum amounts
    const grouped = items.reduce((acc, item) => {
      const category = item.category || 'Lain-lain';
      acc[category] = (acc[category] || 0) + item.amount;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and sort by amount (descending)
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => {
        const percentage = type === 'pengeluaran' && summary.totalExpenses > 0 
          ? ` (${((amount / summary.totalExpenses) * 100).toFixed(1)}%)`
          : type === 'pemasukan' && summary.totalIncome > 0
          ? ` (${((amount / summary.totalIncome) * 100).toFixed(1)}%)`
          : '';
        return `- ${category}: Rp${amount.toLocaleString('id-ID')}${percentage}`;
      })
      .join('\n');
  };

  const incomeText = formatCategoryItems(income, 'pemasukan');
  const expenseText = formatCategoryItems(expenses, 'pengeluaran');
  const netFlowPercentage = summary.totalIncome > 0 
    ? ((summary.netFlow / summary.totalIncome) * 100).toFixed(1)
    : '0';

  return `
Kamu adalah asisten keuangan pribadi yang ahli dalam analisis keuangan individu di Indonesia.

EVALUASI KEUANGAN
Periode: ${startDate} s/d ${endDate}

📊 RINGKASAN KEUANGAN
• Total Pemasukan: Rp${summary.totalIncome.toLocaleString('id-ID')}
• Total Pengeluaran: Rp${summary.totalExpenses.toLocaleString('id-ID')}
• Saldo Bersih: Rp${summary.netFlow.toLocaleString('id-ID')} (${netFlowPercentage}% dari pemasukan)

📥 DETAIL PEMASUKAN
${incomeText}

📤 DETAIL PENGELUARAN
${expenseText}

🔍 TUGAS ANDA:
1. **Status Keuangan** - Berikan penilaian kondisi keuangan saat ini (Sehat/Perlu Perhatian/Kritis) beserta alasan singkat.
2. **Analisis Pola** - Identifikasi 2-3 pola penting dari data keuangan di atas, termasuk kategori yang dominan.
3. **Rekomendasi** - Berikan saran spesifik berdasarkan pola yang terlihat, fokus pada pengelolaan kategori pengeluaran terbesar.
4. **Tips Praktis** - Berikan 1-2 strategi penghematan atau peningkatan pendapatan yang realistis untuk konteks Indonesia.

FORMAT JAWABAN:
Gunakan bahasa Indonesia yang mudah dipahami, santai namun tetap profesional. Maksimal 5 paragraf. Beri penekanan pada aspek-aspek yang memerlukan perhatian khusus.`;
}

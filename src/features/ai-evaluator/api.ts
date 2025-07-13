// Remove hardcoded API credentials - now handled by edge function

import { supabase } from '@/lib/supabase';
import type { FinanceSummary } from '@/types/finance';

export async function getFinanceInsight(summary: FinanceSummary): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-finance-insight', {
      body: { summary }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Gagal mendapatkan insight dari AI');
    }

    return data?.result ?? "Gagal mendapatkan insight.";
  } catch (error) {
    console.error('Error getting finance insight:', error);
    throw new Error('Gagal mendapatkan insight dari AI');
  }
}

export async function askAI(question: string, context: FinanceSummary): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-finance-insight', {
      body: { 
        summary: context,
        question: question
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Gagal mendapatkan jawaban dari AI');
    }

    return data?.result ?? "Maaf, tidak bisa menjawab pertanyaan ini.";
  } catch (error) {
    console.error('Error asking AI:', error);
    throw new Error('Gagal mendapatkan jawaban dari AI');
  }
}

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

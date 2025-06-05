
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const GEMINI_API_KEY = "AIzaSyC8ayF6x42UqiXAqlT3_FLFF6I-y5Q3t0w";

import type { FinanceSummary } from '@/types/finance';

export async function getFinanceInsight(summary: FinanceSummary): Promise<string> {
  const prompt = buildPrompt(summary);

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Gagal mendapatkan insight.";
  } catch (error) {
    console.error('Error getting finance insight:', error);
    throw new Error('Gagal mendapatkan insight dari AI');
  }
}

export async function askAI(question: string, context: string): Promise<string> {
  const prompt = `
Berdasarkan evaluasi keuangan berikut:
${context}

User bertanya: "${question}"

Berikan jawaban yang helpful dan actionable dalam 1-2 paragraf:
  `;

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Maaf, tidak bisa menjawab pertanyaan ini.";
  } catch (error) {
    console.error('Error asking AI:', error);
    throw new Error('Gagal mendapatkan jawaban dari AI');
  }
}

function buildPrompt(summary: FinanceSummary): string {
  const { startDate, endDate, income, expenses, totalIncome, totalExpenses, netFlow } = summary;

  const incomeText = income.length > 0 
    ? income.map(i => `- ${i.category}: Rp${i.amount.toLocaleString('id-ID')}`).join("\n")
    : "Tidak ada pemasukan";
  
  const expenseText = expenses.length > 0
    ? expenses.map(e => `- ${e.category}: Rp${e.amount.toLocaleString('id-ID')}`).join("\n")
    : "Tidak ada pengeluaran";

  return `
Kamu adalah asisten keuangan pribadi yang ahli. Evaluasi kondisi keuangan user berdasarkan data berikut dalam periode ${startDate} sampai ${endDate}:

📥 Total Pemasukan: Rp${totalIncome.toLocaleString('id-ID')}
Detail Pemasukan:
${incomeText}

📤 Total Pengeluaran: Rp${totalExpenses.toLocaleString('id-ID')}
Detail Pengeluaran:
${expenseText}

💰 Net Cash Flow: Rp${netFlow.toLocaleString('id-ID')}

Berikan evaluasi dalam format berikut:
1. **Status Keuangan**: Apakah sehat, perlu perhatian, atau kritis?
2. **Insight Utama**: 2-3 poin penting dari analisis spending pattern
3. **Rekomendasi**: Saran actionable untuk periode ke depan
4. **Tips Budgeting**: 1-2 strategi praktis

Jawab dalam bahasa Indonesia yang mudah dipahami, maksimal 4 paragraf.
  `;
}

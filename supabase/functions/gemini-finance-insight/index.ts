
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// =================================================================
// Final, improved buildPrompt function
// =================================================================
function buildPrompt(summary, language = 'id') {
  const { startDate, endDate, income, expenses } = summary;
  const formatCategoryItems = (items, type, lang)=>{
    if (!items || items.length === 0) {
      return lang === 'en' ? `No ${type} recorded.` : `Tidak ada ${type} yang tercatat.`;
    }
    const grouped = items.reduce((acc, item)=>{
      const category = item.category || (lang === 'en' ? 'Uncategorized' : 'Lain-lain');
      acc[category] = (acc[category] || 0) + item.amount;
      return acc;
    }, {});
    return Object.entries(grouped).sort((a, b)=>b[1] - a[1]).map(([category, amount])=>{
      const percentage = type === 'expenses' && summary.totalExpenses > 0 ? ` (${(amount / summary.totalExpenses * 100).toFixed(1)}%)` : type === 'income' && summary.totalIncome > 0 ? ` (${(amount / summary.totalIncome * 100).toFixed(1)}%)` : '';
      return `- ${category}: Rp${amount.toLocaleString('id-ID')}${percentage}`;
    }).join('\n');
  };
  const prompts = {
    en: {
      header: "You are \"Duitr AI\", an intelligent and supportive personal finance assistant for the Duitr app.",
      context_user: "The user is an individual in Indonesia using the Duitr app to manage their finances. They value modern, intuitive tools and actionable insights.",
      title: "FINANCIAL EVALUATION",
      period: `Period: ${startDate} to ${endDate}`,
      summary_header: "📊 FINANCIAL SUMMARY",
      total_income: `• Total Income: Rp${summary.totalIncome.toLocaleString('id-ID')}`,
      total_expenses: `• Total Expenses: Rp${summary.totalExpenses.toLocaleString('id-ID')}`,
      net_flow: `• Net Flow: Rp${summary.netFlow.toLocaleString('id-ID')}`,
      income_details: "📥 INCOME DETAILS",
      expense_details: "📤 EXPENSE DETAILS",
      tasks_header: "🔍 YOUR TASK:",
      tasks: [
        "1. **Financial Health Status** - Assess the current financial condition (e.g., Healthy, Needs Attention, Critical) and provide a brief reason.",
        "2. **Key Pattern Analysis** - Identify 2-3 significant patterns from the financial data, highlighting dominant income/expense categories.",
        "3. **Actionable Recommendations** - Offer specific, actionable advice based on the identified patterns. Focus on managing the largest expense categories.",
        "4. **Opportunities & Next Steps** - Suggest 1-2 practical strategies for saving or income growth relevant to the Indonesian context. If there are wishlist items or loans in the app, suggest how to plan for them."
      ],
      format_header: "ANSWER FORMAT:",
      format_instructions: "Use clear, encouraging, and professional English. Use Markdown for formatting (e.g., `**Headings**`, bullet points `*`) to make the response easy to read. Maximum of 5 paragraphs."
    },
    id: {
      header: "Anda adalah \"Duitr AI\", asisten keuangan pribadi yang cerdas dan suportif dari aplikasi Duitr.",
      context_user: "Pengguna adalah individu di Indonesia yang menggunakan aplikasi Duitr untuk mengelola keuangan. Mereka menghargai aplikasi yang modern, intuitif, dan insight yang bisa langsung diterapkan.",
      title: "EVALUASI KEUANGAN",
      period: `Periode: ${startDate} s/d ${endDate}`,
      summary_header: "📊 RINGKASAN KEUANGAN",
      total_income: `• Total Pemasukan: Rp${summary.totalIncome.toLocaleString('id-ID')}`,
      total_expenses: `• Total Pengeluaran: Rp${summary.totalExpenses.toLocaleString('id-ID')}`,
      net_flow: `• Saldo Bersih: Rp${summary.netFlow.toLocaleString('id-ID')}`,
      income_details: "📥 DETAIL PEMASUKAN",
      expense_details: "📤 DETAIL PENGELUARAN",
      tasks_header: "🔍 TUGAS ANDA:",
      tasks: [
        "1. **Status Keuangan** - Berikan penilaian kondisi keuangan saat ini (misal: Sehat, Perlu Perhatian, Kritis) beserta alasan singkatnya.",
        "2. **Analisis Pola Kunci** - Identifikasi 2-3 pola penting dari data keuangan, sorot kategori pemasukan/pengeluaran yang dominan.",
        "3. **Rekomendasi Aplikatif** - Berikan saran spesifik yang bisa langsung diterapkan berdasarkan pola yang ditemukan. Fokus pada pengelolaan kategori pengeluaran terbesar.",
        "4. **Peluang & Langkah Berikutnya** - Berikan 1-2 strategi penghematan atau peningkatan pendapatan yang realistis untuk konteks Indonesia. Jika ada data wishlist atau pinjaman, sarankan cara merencanakannya."
      ],
      format_header: "FORMAT JAWABAN:",
      format_instructions: "Gunakan bahasa Indonesia yang mudah dipahami, suportif, dan profesional. Gunakan Markdown untuk format (misal: `**Judul**`, poin `*`) agar mudah dibaca. Maksimal 5 paragraf."
    }
  };
  const p = prompts[language] || prompts['id'];
  const incomeText = formatCategoryItems(income, 'income', language);
  const expenseText = formatCategoryItems(expenses, 'expenses', language);
  const netFlowPercentage = summary.totalIncome > 0 ? (summary.netFlow / summary.totalIncome * 100).toFixed(1) : '0';
  const netFlowText = `${p.net_flow} (${netFlowPercentage}% of income)`;
  return `
${p.header}
${p.context_user}

${p.title}
${p.period}

${p.summary_header}
${p.total_income}
${p.total_expenses}
${netFlowText}

${p.income_details}
${incomeText}

${p.expense_details}
${expenseText}

${p.tasks_header}
${p.tasks.join('\n')}

${p.format_header}
${p.format_instructions}
  `.trim();
}

// =================================================================
// Transaction parsing prompt builder
// =================================================================
function buildTransactionParsePrompt(input: string, language: string = 'id', availableCategories?: Array<{name: string, type: string, keywords: string[]}>) {
  const categoriesText = availableCategories ? availableCategories.map(cat =>
    `${cat.name} (${cat.type}) - Keywords: ${cat.keywords.join(', ')}`
  ).join('\n') : '';

  const prompts = {
    en: {
      instructions: `You are a transaction parsing AI for the Duitr finance app. Parse the user's input and extract financial transactions.

Available categories and their keywords:
${categoriesText || 'Dining, Groceries, Transportation, Shopping, Entertainment, etc.'}

Rules:
1. Extract multiple transactions if present (separated by commas, "and", or "juga")
2. Categorize each transaction appropriately
3. Parse amounts in Indonesian format (ribu, rb, k, juta, jt)
4. Default to expense type unless explicitly stated as income
5. Return a JSON response with this exact structure:
{
  "success": true,
  "message": "Successfully parsed X transactions",
  "transactions": [
    {
      "description": "Clean description",
      "amount": 10000,
      "category": "Category Name",
      "type": "expense",
      "confidence": 0.9
    }
  ]
}`,
      userInput: `User input: "${input}"`
    },
    id: {
      instructions: `Anda adalah AI parsing transaksi untuk aplikasi Duitr. Parse input user dan ekstrak transaksi keuangan.

Kategori yang tersedia dan keywordnya:
${categoriesText || 'Dining, Groceries, Transportation, Shopping, Entertainment, dll.'}

Aturan:
1. Ekstrak multiple transaksi jika ada (dipisahkan koma, "dan", atau "juga")
2. Kategorikan setiap transaksi dengan tepat
3. Parse jumlah dalam format Indonesia (ribu, rb, k, juta, jt)
4. Default ke expense kecuali secara eksplisit disebut income
5. Return response JSON dengan struktur tepat ini:
{
  "success": true,
  "message": "Berhasil mem-parse X transaksi",
  "transactions": [
    {
      "description": "Deskripsi bersih",
      "amount": 10000,
      "category": "Nama Kategori",
      "type": "expense",
      "confidence": 0.9
    }
  ]
}`,
      userInput: `Input user: "${input}"`
    }
  };

  const p = prompts[language] || prompts['id'];
  return `${p.instructions}

${p.userInput}

Pastikan response adalah JSON yang valid.`;
}
// =================================================================
// Main server function
// =================================================================
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    // UPDATED: Now accepts 'language' and 'action' from the client
    const { summary, question, language = 'id', action, input, availableCategories } = await req.json();

    // Handle different actions
    if (action === 'parse_transactions') {
      if (!input) {
        throw new Error('Input text is required for transaction parsing');
      }

      const parsePrompt = buildTransactionParsePrompt(input, language, availableCategories);
      const parseResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: parsePrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!parseResponse.ok) {
        throw new Error(`HTTP error! status: ${parseResponse.status}`);
      }

      const parseData = await parseResponse.json();
      const parseResult = parseData.candidates[0].content.parts[0].text;

      // Try to parse the result as JSON, handle markdown code blocks
      let parsed;
      try {
        // First try direct JSON parse
        parsed = JSON.parse(parseResult);
      } catch {
        // Try to extract JSON from markdown code blocks
        let jsonMatch = parseResult.match(/```json\s*([\s\S]*?)\s*```/);
        if (!jsonMatch) {
          // Try alternative format: ```json {content} ```
          jsonMatch = parseResult.match(/```json\s*(\{[\s\S]*\})\s*```/);
        }
        if (!jsonMatch) {
          // Try to find any JSON object between backticks
          jsonMatch = parseResult.match(/```\s*(\{[\s\S]*\})\s*```/);
        }
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[1].trim());
          } catch {
            return new Response(JSON.stringify({
              result: {
                success: false,
                message: 'Invalid JSON format in AI response',
                transactions: [],
                error: 'JSON parsing failed'
              }
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } else {
          return new Response(JSON.stringify({
            result: {
              success: false,
              message: parseResult,
              transactions: [],
              error: 'No valid JSON found in response'
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
      return new Response(JSON.stringify({
        result: parsed
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!summary) {
      throw new Error('Finance summary is required');
    }
    let prompt;
    if (question) {
      // This is a follow-up question
      const contextPrompt = buildPrompt(summary, language); // Pass language
      const followUpInstruction = language === 'en' ? `Based on the following financial evaluation:\n${contextPrompt}\n\nThe user asks: "${question}"\n\nPlease provide a helpful and actionable answer in 1-2 paragraphs in English:` : `Berdasarkan evaluasi keuangan berikut:\n${contextPrompt}\n\nUser bertanya: "${question}"\n\nBerikan jawaban yang helpful dan actionable dalam 1-2 paragraf dalam Bahasa Indonesia:`;
      prompt = followUpInstruction;
    } else {
      // This is the initial insight request
      prompt = buildPrompt(summary, language); // Pass language
    }
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: question ? 2048 : 4096,
          candidateCount: 1
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });
    if (!response.ok) {
      console.error('Gemini API response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Gemini API request failed: ${response.status}`);
    }
    const data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data, null, 2));
    if (!data || !data.candidates || data.candidates.length === 0) {
      console.error('No candidates in response:', data);
      throw new Error('Tidak ada respons yang valid dari AI');
    }
    const candidate = data.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error('Invalid candidate structure:', candidate);
      throw new Error('Struktur respons AI tidak valid');
    }
    let result = candidate.content.parts[0].text;
    if (!result || result.trim().length === 0) {
      console.error('Empty or null result from AI');
      throw new Error('Respons AI kosong');
    }
    if (candidate.finishReason === 'SAFETY') {
      console.error('Response blocked by safety filters');
      result = language === 'en' ? "Sorry, the analysis could not be provided due to safety reasons. Please try again with different data." : "Maaf, tidak dapat memberikan analisis karena alasan keamanan. Silakan coba dengan data yang berbeda.";
    }
    return new Response(JSON.stringify({
      result: result.trim()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in gemini-finance-insight function:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Gagal mendapatkan insight dari AI'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

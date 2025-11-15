
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// =================================================================
// Type definitions for budget predictions
// =================================================================
interface Budget {
  categoryId: number;
  categoryName?: string;
  limit: number;
  period: 'monthly';
}

interface Transaction {
  categoryId: number;
  amount: number;
  date: string;
  type: 'expense' | 'income';
}

interface CategorySpending {
  categoryId: number;
  totalSpent: number;
  transactionCount: number;
}

interface BudgetPrediction {
  categoryId: number;
  categoryName: string;
  currentSpend: number;
  budgetLimit: number;
  projectedSpend: number;
  overrunAmount: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  daysRemaining: number;
  recommendedDailyLimit: number;
  insight: string;
  seasonalNote?: string;
}

interface PredictBudgetResponse {
  predictions: BudgetPrediction[];
  overallRisk: 'low' | 'medium' | 'high';
  summary: string;
}

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
// Budget prediction helper functions
// =================================================================

/**
 * Calculate the number of days in a month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get start and end dates for the current month period
 */
function getCurrentMonthPeriod(currentDate: Date): { start: Date; end: Date; daysElapsed: number; totalDays: number; daysRemaining: number } {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();
  
  const start = new Date(year, month, 1);
  const totalDays = getDaysInMonth(year, month);
  const daysElapsed = day;
  const daysRemaining = totalDays - day;
  
  return {
    start,
    end: new Date(year, month, totalDays, 23, 59, 59),
    daysElapsed,
    totalDays,
    daysRemaining
  };
}

/**
 * Calculate spending for each category in current period
 */
function calculateCategorySpending(transactions: Transaction[], startDate: Date, endDate: Date): Map<number, CategorySpending> {
  const spending = new Map<number, CategorySpending>();
  
  for (const txn of transactions) {
    // Only count expenses
    if (txn.type !== 'expense') continue;
    
    const txnDate = new Date(txn.date);
    if (txnDate >= startDate && txnDate <= endDate) {
      const current = spending.get(txn.categoryId) || { 
        categoryId: txn.categoryId, 
        totalSpent: 0, 
        transactionCount: 0 
      };
      
      current.totalSpent += txn.amount;
      current.transactionCount += 1;
      spending.set(txn.categoryId, current);
    }
  }
  
  return spending;
}

/**
 * Calculate seasonal pattern by comparing with historical data
 */
function analyzeSeasonalPattern(
  transactions: Transaction[], 
  categoryId: number, 
  currentDate: Date,
  currentSpend: number
): { hasPattern: boolean; note?: string; historicalAverage?: number } {
  const currentDay = currentDate.getDate();
  
  // Get last 3 months same period spending
  const historicalSpending: number[] = [];
  
  for (let monthsBack = 1; monthsBack <= 3; monthsBack++) {
    const historicalDate = new Date(currentDate);
    historicalDate.setMonth(historicalDate.getMonth() - monthsBack);
    
    const year = historicalDate.getFullYear();
    const month = historicalDate.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month, currentDay, 23, 59, 59);
    
    let periodSpend = 0;
    for (const txn of transactions) {
      if (txn.categoryId !== categoryId || txn.type !== 'expense') continue;
      
      const txnDate = new Date(txn.date);
      if (txnDate >= startDate && txnDate <= endDate) {
        periodSpend += txn.amount;
      }
    }
    
    if (periodSpend > 0) {
      historicalSpending.push(periodSpend);
    }
  }
  
  // Need at least 2 historical data points
  if (historicalSpending.length < 2) {
    return { hasPattern: false };
  }
  
  const average = historicalSpending.reduce((a, b) => a + b, 0) / historicalSpending.length;
  const percentageDiff = ((currentSpend - average) / average) * 100;
  
  // Flag if current spending is >20% different from historical average
  if (Math.abs(percentageDiff) > 20) {
    return {
      hasPattern: true,
      note: percentageDiff > 0 ? 'higher_than_usual' : 'lower_than_usual',
      historicalAverage: average
    };
  }
  
  return { hasPattern: false, historicalAverage: average };
}

/**
 * Calculate risk level based on projected spending vs budget
 */
function calculateRiskLevel(projectedSpend: number, budgetLimit: number): 'low' | 'medium' | 'high' {
  const percentage = (projectedSpend / budgetLimit) * 100;
  
  if (percentage <= 85) return 'low';
  if (percentage <= 100) return 'medium';
  return 'high';
}

/**
 * Calculate confidence score based on data quality
 */
function calculateConfidence(transactionCount: number, daysElapsed: number): number {
  // Base confidence on transaction frequency and time elapsed
  let confidence = 0.5; // Start at 50%
  
  // More transactions = higher confidence (max +0.3)
  if (transactionCount >= 10) confidence += 0.3;
  else if (transactionCount >= 5) confidence += 0.2;
  else if (transactionCount >= 3) confidence += 0.1;
  
  // More days elapsed = higher confidence (max +0.2)
  if (daysElapsed >= 15) confidence += 0.2;
  else if (daysElapsed >= 7) confidence += 0.1;
  
  return Math.min(confidence, 1.0); // Cap at 100%
}

/**
 * Build prompt for Gemini to generate budget prediction insights
 */
function buildBudgetPredictionPrompt(
  prediction: Omit<BudgetPrediction, 'insight'>, 
  seasonalData: { hasPattern: boolean; note?: string; historicalAverage?: number },
  language: string = 'id'
): string {
  const prompts = {
    en: {
      instruction: `You are "Duitr AI", a supportive personal finance assistant. Generate a brief, actionable insight for this budget prediction:

Category: ${prediction.categoryName}
Current Spend: Rp${prediction.currentSpend.toLocaleString('id-ID')}
Budget Limit: Rp${prediction.budgetLimit.toLocaleString('id-ID')}
Projected Month-End: Rp${prediction.projectedSpend.toLocaleString('id-ID')}
Risk Level: ${prediction.riskLevel.toUpperCase()}
Days Remaining: ${prediction.daysRemaining}
${seasonalData.hasPattern ? `Seasonal Pattern: Spending is ${seasonalData.note} (historical avg: Rp${seasonalData.historicalAverage?.toLocaleString('id-ID')})` : ''}

Provide a 1-2 sentence insight that:
1. Explains WHY the risk exists (e.g., "high spending on weekends", "frequent small purchases")
2. Gives ONE specific, actionable recommendation (e.g., "reduce by Rp 15,000/day")

Keep it encouraging and practical. Use simple English.`
    },
    id: {
      instruction: `Anda adalah "Duitr AI", asisten keuangan pribadi yang suportif. Buatkan insight singkat dan aplikatif untuk prediksi budget ini:

Kategori: ${prediction.categoryName}
Pengeluaran Saat Ini: Rp${prediction.currentSpent.toLocaleString('id-ID')}
Limit Budget: Rp${prediction.budgetLimit.toLocaleString('id-ID')}
Proyeksi Akhir Bulan: Rp${prediction.projectedSpend.toLocaleString('id-ID')}
Level Risiko: ${prediction.riskLevel === 'low' ? 'RENDAH' : prediction.riskLevel === 'medium' ? 'SEDANG' : 'TINGGI'}
Hari Tersisa: ${prediction.daysRemaining}
${seasonalData.hasPattern ? `Pola Musiman: Pengeluaran ${seasonalData.note === 'higher_than_usual' ? 'lebih tinggi dari biasanya' : 'lebih rendah dari biasanya'} (rata-rata historis: Rp${seasonalData.historicalAverage?.toLocaleString('id-ID')})` : ''}

Berikan insight 1-2 kalimat yang:
1. Jelaskan KENAPA risiko ini ada (misal: "pengeluaran tinggi di akhir pekan", "pembelian kecil yang sering")
2. Berikan SATU rekomendasi spesifik yang bisa diterapkan (misal: "kurangi Rp 15.000/hari")

Gunakan bahasa yang mendukung dan praktis. Bahasa Indonesia sederhana.`
    }
  };
  
  const p = prompts[language] || prompts['id'];
  return p.instruction;
}

/**
 * Build summary prompt for overall budget predictions
 */
function buildBudgetSummaryPrompt(predictions: BudgetPrediction[], overallRisk: string, language: string = 'id'): string {
  const highRiskCount = predictions.filter(p => p.riskLevel === 'high').length;
  const mediumRiskCount = predictions.filter(p => p.riskLevel === 'medium').length;
  
  const categoriesList = predictions.map(p => 
    `- ${p.categoryName}: ${p.riskLevel.toUpperCase()} risk (Rp${p.currentSpend.toLocaleString('id-ID')} / Rp${p.budgetLimit.toLocaleString('id-ID')})`
  ).join('\n');
  
  const prompts = {
    en: {
      instruction: `You are "Duitr AI". Provide a 2-3 sentence summary of these budget predictions:

Overall Risk: ${overallRisk.toUpperCase()}
Categories:
${categoriesList}

High Risk: ${highRiskCount} categories
Medium Risk: ${mediumRiskCount} categories

Summarize the overall financial situation and give ONE priority action for the user. Be encouraging and practical.`
    },
    id: {
      instruction: `Anda adalah "Duitr AI". Buatkan ringkasan 2-3 kalimat untuk prediksi budget ini:

Risiko Keseluruhan: ${overallRisk === 'low' ? 'RENDAH' : overallRisk === 'medium' ? 'SEDANG' : 'TINGGI'}
Kategori:
${categoriesList}

Risiko Tinggi: ${highRiskCount} kategori
Risiko Sedang: ${mediumRiskCount} kategori

Rangkum situasi keuangan keseluruhan dan berikan SATU prioritas aksi untuk user. Gunakan bahasa yang mendukung dan praktis.`
    }
  };
  
  const p = prompts[language] || prompts['id'];
  return p.instruction;
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
    const requestBody = await req.json();
    const { summary, question, language = 'id', action, input, availableCategories, budgets, transactions, currentDate } = requestBody;

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

    // Handle budget prediction action
    if (action === 'predict_budget') {
      if (!budgets || !Array.isArray(budgets) || budgets.length === 0) {
        throw new Error('Budgets array is required for budget prediction');
      }
      
      if (!transactions || !Array.isArray(transactions)) {
        throw new Error('Transactions array is required for budget prediction');
      }
      
      const currentDateObj = currentDate ? new Date(currentDate) : new Date();
      const period = getCurrentMonthPeriod(currentDateObj);
      
      // Calculate current spending for each category
      const categorySpending = calculateCategorySpending(transactions, period.start, period.end);
      
      // Generate predictions for each budget
      const predictions: BudgetPrediction[] = [];
      
      for (const budget of budgets) {
        const spending = categorySpending.get(budget.categoryId) || { 
          categoryId: budget.categoryId, 
          totalSpent: 0, 
          transactionCount: 0 
        };
        
        // Calculate spending velocity and projection
        const velocity = period.daysElapsed > 0 ? spending.totalSpent / period.daysElapsed : 0;
        const projectedSpend = Math.round(velocity * period.totalDays);
        const overrunAmount = Math.max(0, projectedSpend - budget.limit);
        
        // Calculate risk level
        const riskLevel = calculateRiskLevel(projectedSpend, budget.limit);
        
        // Calculate confidence
        const confidence = calculateConfidence(spending.transactionCount, period.daysElapsed);
        
        // Calculate recommended daily limit for remaining days
        const remainingBudget = Math.max(0, budget.limit - spending.totalSpent);
        const recommendedDailyLimit = period.daysRemaining > 0 
          ? Math.round(remainingBudget / period.daysRemaining) 
          : 0;
        
        // Analyze seasonal pattern
        const seasonalData = analyzeSeasonalPattern(
          transactions, 
          budget.categoryId, 
          currentDateObj,
          spending.totalSpent
        );
        
        // Create prediction object without insight first
        const predictionWithoutInsight = {
          categoryId: budget.categoryId,
          categoryName: budget.categoryName || `Category ${budget.categoryId}`,
          currentSpend: spending.totalSpent,
          budgetLimit: budget.limit,
          projectedSpend,
          overrunAmount,
          riskLevel,
          confidence,
          daysRemaining: period.daysRemaining,
          recommendedDailyLimit,
          seasonalNote: seasonalData.hasPattern ? seasonalData.note : undefined
        };
        
        // Generate AI insight for this prediction
        const insightPrompt = buildBudgetPredictionPrompt(predictionWithoutInsight, seasonalData, language);
        
        try {
          const insightResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: insightPrompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 512,
                }
              })
            }
          );
          
          if (insightResponse.ok) {
            const insightData = await insightResponse.json();
            const insight = insightData.candidates?.[0]?.content?.parts?.[0]?.text || 
              (language === 'en' ? 'Budget monitoring required.' : 'Perlu monitoring budget.');
            
            predictions.push({
              ...predictionWithoutInsight,
              insight: insight.trim()
            });
          } else {
            // Fallback if AI fails
            predictions.push({
              ...predictionWithoutInsight,
              insight: language === 'en' ? 'Budget monitoring required.' : 'Perlu monitoring budget.'
            });
          }
        } catch (error) {
          console.error('Error generating insight for category:', budget.categoryId, error);
          // Use fallback insight
          predictions.push({
            ...predictionWithoutInsight,
            insight: language === 'en' ? 'Budget monitoring required.' : 'Perlu monitoring budget.'
          });
        }
      }
      
      // Calculate overall risk based on highest risk level
      let overallRisk: 'low' | 'medium' | 'high' = 'low';
      if (predictions.some(p => p.riskLevel === 'high')) {
        overallRisk = 'high';
      } else if (predictions.some(p => p.riskLevel === 'medium')) {
        overallRisk = 'medium';
      }
      
      // Generate overall summary using AI
      let summary = language === 'en' ? 'Budget prediction complete.' : 'Prediksi budget selesai.';
      
      if (predictions.length > 0) {
        const summaryPrompt = buildBudgetSummaryPrompt(predictions, overallRisk, language);
        
        try {
          const summaryResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: summaryPrompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 1024,
                }
              })
            }
          );
          
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            summary = summaryData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || summary;
          }
        } catch (error) {
          console.error('Error generating summary:', error);
        }
      }
      
      const response: PredictBudgetResponse = {
        predictions,
        overallRisk,
        summary
      };
      
      return new Response(JSON.stringify({ result: response }), {
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

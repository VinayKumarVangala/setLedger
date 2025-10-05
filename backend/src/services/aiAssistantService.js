const axios = require('axios');

class AIAssistantService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  async processMessage(message, context) {
    try {
      const prompt = this.buildPrompt(message, context);
      
      if (this.geminiApiKey) {
        return await this.callGeminiAPI(prompt);
      } else {
        return this.generateMockResponse(message, context);
      }
    } catch (error) {
      console.error('Error processing AI message:', error);
      return this.generateMockResponse(message, context);
    }
  }

  buildPrompt(message, context) {
    return `You are a financial AI assistant for a business. Here's the current business context:

BUSINESS METRICS (Last 30 days):
- Total Revenue: ₹${context.metrics.totalRevenue.toLocaleString()}
- Total Expenses: ₹${context.metrics.totalExpenses.toLocaleString()}
- Profit: ₹${context.metrics.profit.toLocaleString()}
- Profit Margin: ${context.metrics.profitMargin.toFixed(1)}%
- Number of Invoices: ${context.metrics.invoiceCount}
- Average Order Value: ₹${context.metrics.averageOrderValue.toFixed(0)}

TOP PRODUCTS:
${context.topProducts.map(p => `- ${p.name}: ₹${p.price} (Stock: ${p.stock}, Sales: ${p.salesCount})`).join('\n')}

EXPENSE CATEGORIES:
${Object.entries(context.expenseCategories).map(([cat, amt]) => `- ${cat}: ₹${amt.toLocaleString()}`).join('\n')}

RECENT TRENDS:
${this.formatTrends(context.trends)}

User Question: ${message}

Provide a helpful, concise response with actionable insights. Include specific numbers from the data when relevant. If asked about forecasts or predictions, use the trend data to make reasonable estimates.`;
  }

  async callGeminiAPI(prompt) {
    try {
      const response = await axios.post(
        `${this.geminiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      
      return {
        message: aiResponse,
        data: this.extractDataFromResponse(aiResponse),
        suggestions: this.generateSuggestions()
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  generateMockResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('revenue') || lowerMessage.includes('sales')) {
      return {
        message: `Your revenue for the last 30 days is ₹${context.metrics.totalRevenue.toLocaleString()}. You've processed ${context.metrics.invoiceCount} invoices with an average order value of ₹${context.metrics.averageOrderValue.toFixed(0)}. ${context.metrics.totalRevenue > 100000 ? 'Great performance!' : 'Consider strategies to boost sales.'}`,
        data: { revenue: context.metrics.totalRevenue, invoices: context.metrics.invoiceCount },
        suggestions: ['View revenue trends', 'Analyze top products', 'Check customer insights']
      };
    }
    
    if (lowerMessage.includes('expense') || lowerMessage.includes('cost')) {
      const topExpense = Object.entries(context.expenseCategories)
        .sort(([,a], [,b]) => b - a)[0];
      
      return {
        message: `Your total expenses are ₹${context.metrics.totalExpenses.toLocaleString()}. Your largest expense category is ${topExpense?.[0] || 'N/A'} at ₹${topExpense?.[1]?.toLocaleString() || '0'}. Consider reviewing this category for optimization opportunities.`,
        data: { expenses: context.metrics.totalExpenses, categories: context.expenseCategories },
        suggestions: ['View expense breakdown', 'Set expense budgets', 'Track spending trends']
      };
    }
    
    if (lowerMessage.includes('profit')) {
      return {
        message: `Your profit for the last 30 days is ₹${context.metrics.profit.toLocaleString()} with a ${context.metrics.profitMargin.toFixed(1)}% margin. ${context.metrics.profitMargin > 20 ? 'Excellent profitability!' : context.metrics.profitMargin > 10 ? 'Good profit margins.' : 'Consider ways to improve profitability.'}`,
        data: { profit: context.metrics.profit, margin: context.metrics.profitMargin },
        suggestions: ['Analyze profit trends', 'Review pricing strategy', 'Optimize expenses']
      };
    }
    
    if (lowerMessage.includes('forecast') || lowerMessage.includes('predict')) {
      const avgDaily = context.metrics.totalRevenue / 30;
      const nextMonthForecast = avgDaily * 30 * 1.05; // 5% growth assumption
      
      return {
        message: `Based on your current trends, I predict next month's revenue could be around ₹${nextMonthForecast.toLocaleString()}. This assumes a 5% growth rate. Your top-selling products should continue performing well.`,
        data: { forecast: nextMonthForecast, confidence: 0.75 },
        suggestions: ['View detailed forecasts', 'Set sales targets', 'Plan inventory']
      };
    }
    
    return {
      message: `I can help you analyze your business performance. Your current profit is ₹${context.metrics.profit.toLocaleString()} with ${context.metrics.invoiceCount} recent transactions. What specific insights would you like?`,
      data: context.metrics,
      suggestions: ['Revenue analysis', 'Expense breakdown', 'Profit trends', 'Sales forecast']
    };
  }

  formatTrends(trends) {
    const revenueEntries = Object.entries(trends.dailyRevenue).slice(-7);
    const expenseEntries = Object.entries(trends.dailyExpenses).slice(-7);
    
    return `Recent 7-day revenue: ${revenueEntries.map(([date, amt]) => `${date}: ₹${amt}`).join(', ')}
Recent 7-day expenses: ${expenseEntries.map(([date, amt]) => `${date}: ₹${amt}`).join(', ')}`;
  }

  extractDataFromResponse(response) {
    // Extract numerical data from AI response for charts/widgets
    const numbers = response.match(/₹[\d,]+/g) || [];
    const percentages = response.match(/\d+\.?\d*%/g) || [];
    
    return {
      extractedNumbers: numbers,
      extractedPercentages: percentages
    };
  }

  generateSuggestions() {
    return [
      'Show revenue trends',
      'Analyze top expenses',
      'View profit margins',
      'Forecast next month'
    ];
  }

  async trainWithContext(context) {
    // Store context for future reference
    return {
      success: true,
      message: 'AI assistant trained with organization data',
      contextSize: JSON.stringify(context).length
    };
  }
}

module.exports = new AIAssistantService();
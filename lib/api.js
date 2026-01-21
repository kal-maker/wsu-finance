const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ExpensePredictorAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async predictExpense(text) {
    try {
      const response = await fetch(`${this.baseURL}/api/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Prediction API error:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const response = await fetch(`${this.baseURL}/api/categories`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Categories API error:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/api/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const expenseAPI = new ExpensePredictorAPI();
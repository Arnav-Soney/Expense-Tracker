// API Client for frontend
import { getFullUrl, API_CONFIG } from "../../shared/api-config.js";

export const apiClient = {
  async getExpenses() {
    const response = await fetch(getFullUrl(API_CONFIG.ENDPOINTS.EXPENSES));
    if (!response.ok) throw new Error("Failed to fetch expenses");
    return response.json();
  },

  async addExpense(expense) {
    const response = await fetch(getFullUrl(API_CONFIG.ENDPOINTS.EXPENSES), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });
    if (!response.ok) throw new Error("Failed to add expense");
    return response.json();
  },

  async updateExpense(id, expense) {
    const response = await fetch(
      `${getFullUrl(API_CONFIG.ENDPOINTS.EXPENSES)}/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      },
    );
    if (!response.ok) throw new Error("Failed to update expense");
    return response.json();
  },

  async deleteExpense(id) {
    const response = await fetch(
      `${getFullUrl(API_CONFIG.ENDPOINTS.EXPENSES)}/${id}`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) throw new Error("Failed to delete expense");
    return response.json();
  },
};

// API Configuration - Shared between frontend and backend
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  ENDPOINTS: {
    EXPENSES: "/api/expenses",
  },
};

export const getFullUrl = (endpoint) => `${API_CONFIG.BASE_URL}${endpoint}`;

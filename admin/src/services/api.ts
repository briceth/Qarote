// API base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL;

// Helper for making authenticated API requests
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("adminToken");

  const headers: Record<string, any> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle unauthorized errors
  if (response.status === 401) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  // Handle server errors
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || "API request failed");
  }

  return response.json();
};

// Feedback service
export const feedbackService = {
  // Get all feedback
  async getAllFeedback() {
    return fetchWithAuth("/feedback");
  },

  // Get feedback by id
  async getFeedbackById(id: string) {
    return fetchWithAuth(`/feedback/${id}`);
  },

  // Update feedback status
  async updateFeedbackStatus(id: string, status: "pending" | "resolved") {
    return fetchWithAuth(`/feedback/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  // Add response to feedback
  async addResponse(id: string, content: string) {
    return fetchWithAuth(`/feedback/${id}/responses`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  // Get responses for feedback
  async getResponses(id: string) {
    return fetchWithAuth(`/feedback/${id}/responses`);
  },
};

// Auth service
export const authService = {
  // Login
  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Login failed" }));
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();

    // Store token and user data
    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminUser", JSON.stringify(data.user));

    return data;
  },

  // Logout
  logout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
  },
};

// Dashboard service
export const dashboardService = {
  // Get dashboard stats
  async getStats() {
    return fetchWithAuth("/admin/stats");
  },
};

export default {
  feedback: feedbackService,
  auth: authService,
  dashboard: dashboardService,
};

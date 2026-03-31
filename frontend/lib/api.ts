const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  error: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('feedpulse_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const json = await res.json();
  return json as ApiResponse<T>;
}

export interface FeedbackItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: 'New' | 'In Review' | 'Resolved';
  submitterName?: string;
  submitterEmail?: string;
  ai_category?: string;
  ai_sentiment?: 'Positive' | 'Neutral' | 'Negative';
  ai_priority?: number;
  ai_summary?: string;
  ai_tags?: string[];
  ai_processed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackListResponse {
  items: FeedbackItem[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface StatsResponse {
  total: number;
  open: number;
  averagePriority: string;
  topTag: string;
}

export const api = {
  submitFeedback: (body: {
    title: string;
    description: string;
    category: string;
    submitterName?: string;
    submitterEmail?: string;
  }) =>
    request<FeedbackItem>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getAllFeedback: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<FeedbackListResponse>(`/api/feedback?${qs}`, {}, true);
  },

  getStats: () => request<StatsResponse>('/api/feedback/stats', {}, true),

  getWeeklySummary: () =>
    request<{ summary: string }>('/api/feedback/summary', {}, true),

  updateStatus: (id: string, status: string) =>
    request<FeedbackItem>(`/api/feedback/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, true),

  reanalyse: (id: string) =>
    request<FeedbackItem>(`/api/feedback/${id}/reanalyse`, {
      method: 'POST',
    }, true),

  deleteFeedback: (id: string) =>
    request<null>(`/api/feedback/${id}`, { method: 'DELETE' }, true),

  login: (email: string, password: string) =>
    request<{ token: string; email: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

const TOKEN_KEY = 'bidxchange_auth_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(endpoint, options = {}) {
  const token = tokenStorage.get();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (data) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMe: () => request('/auth/me'),
    toggleRole: () =>
      request('/auth/toggle-role', {
        method: 'POST',
      }),
  },

  categories: {
    list: () => request('/categories'),
  },

  auctions: {
    list: (params) => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.sort) searchParams.set('sort', params.sort);
      if (params?.minPrice) searchParams.set('minPrice', params.minPrice.toString());
      if (params?.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());
      const query = searchParams.toString();
      return request(`/auctions${query ? `?${query}` : ''}`);
    },

    getById: (id) => request(`/auctions/${id}`),

    create: (data) =>
      request('/auctions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    cancel: (id) =>
      request(`/auctions/${id}/cancel`, {
        method: 'POST',
      }),

    placeBid: (auctionId, amount, idempotencyKey) =>
      request(`/auctions/${auctionId}/bids`, {
        method: 'POST',
        body: JSON.stringify({ amount, idempotencyKey }),
      }),
  },

  watchlist: {
    get: () => request('/watchlist'),
    toggle: (auctionId) =>
      request('/watchlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ auctionId }),
      }),
  },

  notifications: {
    list: () => request('/notifications'),
    markRead: (id) =>
      request('/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ id }),
      }),
  },

  buyer: {
    getDashboard: () => request('/buyer/dashboard'),

    checkout: (data) =>
      request('/buyer/checkout', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  seller: {
    getDashboard: () => request('/seller/dashboard'),
  },

  admin: {
    getMetrics: () => request('/admin/metrics'),
    getUsers: () => request('/admin/users'),
    toggleSuspend: (userId) =>
      request(`/admin/users/${userId}/toggle-suspend`, {
        method: 'POST',
      }),
    getAuditLogs: () => request('/admin/audit-logs'),
  },
};

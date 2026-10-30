import { User, Auction, Category, Notification, Order } from '../types/index.ts';

const TOKEN_KEY = 'bidxchange_auth_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
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

  return data as T;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (data: { email: string; password: string; name: string; role?: string }) =>
      request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMe: () => request<{ user: User }>('/auth/me'),
    toggleRole: () =>
      request<{ user: User }>('/auth/toggle-role', {
        method: 'POST',
      }),
  },

  categories: {
    list: () => request<{ categories: Category[] }>('/categories'),
  },

  auctions: {
    list: (params?: {
      category?: string;
      status?: string;
      search?: string;
      sort?: string;
      minPrice?: number;
      maxPrice?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.sort) searchParams.set('sort', params.sort);
      if (params?.minPrice) searchParams.set('minPrice', params.minPrice.toString());
      if (params?.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());
      const query = searchParams.toString();
      return request<{ auctions: Auction[]; total: number }>(`/auctions${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => request<{ auction: Auction }>(`/auctions/${id}`),

    create: (data: any) =>
      request<{ auction: Auction }>('/auctions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    cancel: (id: string) =>
      request<{ success: boolean; auction: Auction }>(`/auctions/${id}/cancel`, {
        method: 'POST',
      }),

    placeBid: (auctionId: string, amount: number, idempotencyKey?: string) =>
      request<{
        success: boolean;
        bid: any;
        auction: Auction;
        timeExtended: boolean;
        newEndTime?: string;
        message: string;
      }>(`/auctions/${auctionId}/bids`, {
        method: 'POST',
        body: JSON.stringify({ amount, idempotencyKey }),
      }),
  },

  watchlist: {
    get: () => request<{ watchlist: Auction[] }>('/watchlist'),
    toggle: (auctionId: string) =>
      request<{ isWatchlisted: boolean }>('/watchlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ auctionId }),
      }),
  },

  notifications: {
    list: () => request<{ notifications: Notification[] }>('/notifications'),
    markRead: (id?: string) =>
      request<{ success: boolean }>('/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ id }),
      }),
  },

  buyer: {
    getDashboard: () =>
      request<{
        activeBids: any[];
        wonAuctions: any[];
        lostAuctions: any[];
        watchlist: Auction[];
      }>('/buyer/dashboard'),

    checkout: (data: { auctionId: string; shippingAddress?: string; paymentMethod?: string }) =>
      request<{ success: boolean; order: Order; message: string }>('/buyer/checkout', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  seller: {
    getDashboard: () =>
      request<{
        stats: {
          totalAuctions: number;
          activeCount: number;
          completedCount: number;
          pendingPaymentCount: number;
          cancelledCount: number;
          totalGrossRevenue: number;
          totalBidsReceived: number;
          totalViews: number;
        };
        auctions: {
          active: Auction[];
          completed: Auction[];
          pendingPayment: Auction[];
          cancelled: Auction[];
        };
      }>('/seller/dashboard'),
  },

  admin: {
    getMetrics: () =>
      request<{
        totalUsers: number;
        activeAuctions: number;
        totalAuctions: number;
        totalBidsPlaced: number;
        grossMerchandiseVolume: number;
        suspendedUsers: number;
      }>('/admin/metrics'),

    getUsers: () => request<{ users: User[] }>('/admin/users'),

    toggleSuspend: (userId: string) =>
      request<{ user: User }>(`/admin/users/${userId}/toggle-suspend`, {
        method: 'POST',
      }),

    getAuditLogs: () => request<{ logs: any[] }>('/admin/audit-logs'),
  },
};

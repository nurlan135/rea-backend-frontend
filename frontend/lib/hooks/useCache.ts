'use client';

import useSWR, { mutate } from 'swr';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface CacheStats {
  total_keys: number;
  categories: Record<string, number>;
  memory_usage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

interface CacheKeysResponse {
  keys: string[];
  total: number;
  showing: number;
}

// Fetcher function with authentication
const fetcher = async (url: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
};

// API functions
const cacheAPI = {
  async invalidateCategories(categories: string[]) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/cache/invalidate`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categories }),
    });
    return response.json();
  },

  async deleteKey(key: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/cache/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    return response.json();
  },

  async deletePattern(pattern: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/cache/pattern/${encodeURIComponent(pattern)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    return response.json();
  },

  async flushAll() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/cache`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    return response.json();
  },

  async warmup(categories: string[]) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/cache/warmup`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categories }),
    });
    return response.json();
  }
};

// Custom hooks
export function useCacheStats() {
  const { data, error, isLoading, mutate: refreshStats } = useSWR<CacheStats>(
    '/cache/stats',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
    }
  );

  return {
    stats: data,
    error,
    isLoading,
    refreshStats,
  };
}

export function useCacheKeys(pattern = '*', limit = 100) {
  const { data, error, isLoading, mutate: refreshKeys } = useSWR<CacheKeysResponse>(
    `/cache/keys?pattern=${encodeURIComponent(pattern)}&limit=${limit}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    keys: data,
    error,
    isLoading,
    refreshKeys,
  };
}

export function useCacheValue(key: string | null) {
  const { data, error, isLoading } = useSWR(
    key ? `/cache/${encodeURIComponent(key)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    value: data,
    error,
    isLoading,
  };
}

// Cache management actions
export function useCacheActions() {
  const invalidateCategories = async (categories: string[]) => {
    try {
      const result = await cacheAPI.invalidateCategories(categories);
      // Refresh stats after invalidation
      mutate('/cache/stats');
      return result;
    } catch (error) {
      throw new Error(`Failed to invalidate cache categories: ${error}`);
    }
  };

  const deleteKey = async (key: string) => {
    try {
      const result = await cacheAPI.deleteKey(key);
      // Refresh related data
      mutate('/cache/stats');
      mutate((key: string) => key.startsWith('/cache/keys'));
      return result;
    } catch (error) {
      throw new Error(`Failed to delete cache key: ${error}`);
    }
  };

  const deletePattern = async (pattern: string) => {
    try {
      const result = await cacheAPI.deletePattern(pattern);
      // Refresh related data
      mutate('/cache/stats');
      mutate((key: string) => key.startsWith('/cache/keys'));
      return result;
    } catch (error) {
      throw new Error(`Failed to delete cache pattern: ${error}`);
    }
  };

  const flushAll = async () => {
    try {
      const result = await cacheAPI.flushAll();
      // Refresh all cache-related data
      mutate('/cache/stats');
      mutate((key: string) => key.startsWith('/cache/keys'));
      return result;
    } catch (error) {
      throw new Error(`Failed to flush cache: ${error}`);
    }
  };

  const warmupCache = async (categories: string[]) => {
    try {
      const result = await cacheAPI.warmup(categories);
      // Refresh stats after warmup
      mutate('/cache/stats');
      return result;
    } catch (error) {
      throw new Error(`Failed to warm up cache: ${error}`);
    }
  };

  return {
    invalidateCategories,
    deleteKey,
    deletePattern,
    flushAll,
    warmupCache,
  };
}

// Utility to invalidate all cache data in SWR
export function invalidateAllSWRCache() {
  mutate(() => true, undefined, { revalidate: false });
}
import type {
  Settings,
  Language,
  KiwixStatus,
  ZimEntry,
  PaginatedDownloads,
} from './types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  settings: {
    get: () => request<Settings>('/settings'),
    update: (data: Partial<Settings>) =>
      request<Settings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  languages: {
    list: () => request<Language[]>('/languages'),
    create: (data: { code: string; name: string; withImages?: boolean }) =>
      request<Language>('/languages', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Language>) =>
      request<Language>(`/languages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      request<void>(`/languages/${id}`, { method: 'DELETE' }),
  },

  downloads: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<PaginatedDownloads>(`/downloads${qs}`);
    },
    trigger: () =>
      request<void>('/downloads/trigger', { method: 'POST' }),
    activate: (id: number) =>
      request<void>(`/downloads/${id}/activate`, { method: 'POST' }),
    remove: (id: number) =>
      request<void>(`/downloads/${id}`, { method: 'DELETE' }),
  },

  kiwix: {
    status: () => request<KiwixStatus>('/kiwix/status'),
  },

  zim: {
    available: (lang: string) =>
      request<ZimEntry[]>(`/zim/available?lang=${lang}`),
  },
};

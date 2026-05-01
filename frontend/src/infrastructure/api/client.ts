const rawBackendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '';
const backendUrl = rawBackendUrl.trim().replace(/\/+$/, '');

const buildApiUrl = (url: string): string => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (!backendUrl) {
    return url;
  }

  const path = url.startsWith('/') ? url : `/${url}`;
  return `${backendUrl}${path}`;
};

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildApiUrl(url), init);

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${init?.method ?? 'GET'} ${url} failed with ${response.status}${detail ? `: ${detail}` : ''}`);
  }

  return (await response.json()) as T;
};

export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    return request<T>(url);
  },
  put: async <T>(url: string, body: unknown): Promise<T> => {
    return request<T>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }
};

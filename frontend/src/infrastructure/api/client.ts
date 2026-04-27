export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GET ${url} failed with ${response.status}`);
    }
    return (await response.json()) as T;
  }
};

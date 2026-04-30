const toHttps = (url: string): string => {
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  if (/^http:\/\//i.test(url)) {
    return url.replace(/^http:\/\//i, 'https://');
  }

  return url;
};

export const normalizeMediaUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return toHttps(trimmed);
};

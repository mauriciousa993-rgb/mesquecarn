export type CloudinaryResourceType = 'image' | 'video';

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  resourceType: string;
}

const getCloudinaryConfig = () => {
  const folder = (import.meta.env.VITE_CLOUDINARY_FOLDER as string | undefined) ?? 'mes-que-carn';
  const backendUrl = ((import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '').trim();

  return { folder, backendUrl };
};

const buildBackendApiUrl = (baseUrl: string, path: string): string => {
  if (!baseUrl.trim()) {
    return path;
  }

  return `${baseUrl.replace(/\/+$/, '')}${path}`;
};

export const isCloudinaryConfigured = (): boolean => {
  const { backendUrl } = getCloudinaryConfig();
  return Boolean(backendUrl);
};

export const uploadToCloudinary = async (
  file: File,
  resourceType: CloudinaryResourceType
): Promise<CloudinaryUploadResult> => {
  const { folder, backendUrl } = getCloudinaryConfig();

  if (!backendUrl) {
    throw new Error('Cloudinary no configurado. Define VITE_BACKEND_URL.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('resourceType', resourceType);
  formData.append('folder', folder);

  const response = await fetch(buildBackendApiUrl(backendUrl, '/api/cloudinary/upload'), {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Backend Cloudinary upload failed (${response.status}): ${raw || 'empty response'}`);
  }

  return (await response.json()) as CloudinaryUploadResult;
};

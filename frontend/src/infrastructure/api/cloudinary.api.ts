export type CloudinaryResourceType = 'image' | 'video';

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  resourceType: string;
}

interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
}

const getCloudinaryConfig = () => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
  const folder = (import.meta.env.VITE_CLOUDINARY_FOLDER as string | undefined) ?? 'mes-que-carn';
  const backendUrl = ((import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '').trim();

  return { cloudName, uploadPreset, folder, backendUrl };
};

const buildBackendApiUrl = (baseUrl: string, path: string): string => {
  if (!baseUrl.trim()) {
    return path;
  }

  return `${baseUrl.replace(/\/+$/, '')}${path}`;
};

const getCloudinarySignature = async (
  backendUrl: string,
  payload: { folder: string; uploadPreset: string }
): Promise<CloudinarySignatureResponse> => {
  const response = await fetch(buildBackendApiUrl(backendUrl, '/api/cloudinary/signature'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Cloudinary signature failed (${response.status})`);
  }

  return (await response.json()) as CloudinarySignatureResponse;
};

export const isCloudinaryConfigured = (): boolean => {
  const { uploadPreset, backendUrl } = getCloudinaryConfig();
  return Boolean(uploadPreset && backendUrl);
};

export const uploadToCloudinary = async (
  file: File,
  resourceType: CloudinaryResourceType
): Promise<CloudinaryUploadResult> => {
  const { cloudName, uploadPreset, folder, backendUrl } = getCloudinaryConfig();

  if (!uploadPreset) {
    throw new Error('Cloudinary no configurado. Define VITE_CLOUDINARY_UPLOAD_PRESET.');
  }
  if (!backendUrl) {
    throw new Error('Cloudinary no configurado. Define VITE_BACKEND_URL con la URL del backend.');
  }

  const signature = await getCloudinarySignature(backendUrl, {
    folder,
    uploadPreset
  });
  const resolvedCloudName = signature.cloudName || cloudName;

  if (!resolvedCloudName) {
    throw new Error('Cloudinary no configurado. Define CLOUDINARY_CLOUD_NAME en backend.');
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${resolvedCloudName}/${resourceType}/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('signature', signature.signature);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed (${response.status})`);
  }

  const data = (await response.json()) as {
    secure_url: string;
    public_id: string;
    resource_type: string;
  };

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type
  };
};

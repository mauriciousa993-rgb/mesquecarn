export type CloudinaryResourceType = 'image' | 'video';

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  resourceType: string;
}

const getCloudinaryConfig = () => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
  const folder = (import.meta.env.VITE_CLOUDINARY_FOLDER as string | undefined) ?? 'mes-que-carn';

  return { cloudName, uploadPreset, folder };
};

export const isCloudinaryConfigured = (): boolean => {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  return Boolean(cloudName && uploadPreset);
};

export const uploadToCloudinary = async (
  file: File,
  resourceType: CloudinaryResourceType
): Promise<CloudinaryUploadResult> => {
  const { cloudName, uploadPreset, folder } = getCloudinaryConfig();

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary no configurado. Define VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET.');
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const formData = new FormData();
  formData.append('file', file);
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

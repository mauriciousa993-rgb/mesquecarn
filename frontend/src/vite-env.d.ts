/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
  readonly VITE_CLOUDINARY_FOLDER?: string;
  readonly VITE_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

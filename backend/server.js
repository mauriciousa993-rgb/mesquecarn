import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import multer from 'multer';

const app = express();
const PORT = process.env.PORT || 10000;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const DEFAULT_CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'mes-que-carn';
const upload = multer({ storage: multer.memoryStorage() });

const normalizeOriginValue = (value) => value.trim().replace(/\/+$/, '');

const allowedOrigins = FRONTEND_URL.split(',')
  .map((value) => normalizeOriginValue(value))
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  const normalizedOrigin = normalizeOriginValue(origin);

  if (allowedOrigins.includes('*')) {
    return true;
  }

  return allowedOrigins.some((rule) => {
    const normalizedRule = normalizeOriginValue(rule);

    if (rule.includes('*')) {
      const regex = new RegExp(
        `^${normalizedRule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*')}$`
      );
      return regex.test(normalizedOrigin);
    }
    return normalizedRule === normalizedOrigin;
  });
};

const signCloudinaryParams = (params, apiSecret) => {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex');
};

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    }
  })
);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'mesquecarn-backend' });
});

app.get('/api/catalog', (_req, res) => {
  res.json({
    message: 'Catalog endpoint placeholder. The frontend currently uses local data/state.'
  });
});

app.post('/api/orders', (req, res) => {
  const payload = req.body;
  res.status(201).json({
    orderId: `MQC-${Date.now()}`,
    received: true,
    payload
  });
});

app.post('/api/cloudinary/signature', (req, res) => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return res.status(500).json({
      error:
        'Cloudinary backend no configurado. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.'
    });
  }

  const rawFolder = typeof req.body?.folder === 'string' ? req.body.folder.trim() : '';
  const rawUploadPreset = typeof req.body?.uploadPreset === 'string' ? req.body.uploadPreset.trim() : '';
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    timestamp
  };

  if (rawFolder) {
    paramsToSign.folder = rawFolder;
  }

  if (rawUploadPreset) {
    paramsToSign.upload_preset = rawUploadPreset;
  }

  const signature = signCloudinaryParams(paramsToSign, CLOUDINARY_API_SECRET);

  return res.json({
    signature,
    timestamp,
    apiKey: CLOUDINARY_API_KEY,
    cloudName: CLOUDINARY_CLOUD_NAME
  });
});

app.post('/api/cloudinary/upload', upload.single('file'), async (req, res) => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return res.status(500).json({
      error:
        'Cloudinary backend no configurado. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.'
    });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Archivo requerido en campo "file".' });
  }

  const resourceType = req.body?.resourceType === 'video' ? 'video' : 'image';
  const rawFolder = typeof req.body?.folder === 'string' ? req.body.folder.trim() : '';
  const folder = rawFolder || DEFAULT_CLOUDINARY_FOLDER;
  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign = {
    folder,
    timestamp
  };
  const signature = signCloudinaryParams(paramsToSign, CLOUDINARY_API_SECRET);
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', new Blob([req.file.buffer]), req.file.originalname || 'upload.bin');
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });
    const raw = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Cloudinary upload failed (${response.status})`,
        detail: raw
      });
    }

    const data = JSON.parse(raw);
    return res.status(201).json({
      secureUrl: data.secure_url,
      publicId: data.public_id,
      resourceType: data.resource_type
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ error: 'No se pudo subir a Cloudinary.', detail });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

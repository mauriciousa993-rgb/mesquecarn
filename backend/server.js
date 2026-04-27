import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 10000;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const allowedOrigins = FRONTEND_URL.split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (allowedOrigins.includes('*')) {
    return true;
  }

  return allowedOrigins.some((rule) => {
    if (rule.includes('*')) {
      const regex = new RegExp(`^${rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*')}$`);
      return regex.test(origin);
    }
    return rule === origin;
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

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

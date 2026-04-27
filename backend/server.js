import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 10000;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const signCloudinaryParams = (params, apiSecret) => {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex');
};

app.use(express.json());
app.use(cors({ origin: FRONTEND_URL === '*' ? true : FRONTEND_URL }));

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

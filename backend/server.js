import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 10000;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

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

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

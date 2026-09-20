import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting — 100 req/min per IP
const limiter = rateLimit({ windowMs: 60_000, max: 100 });
app.use(limiter);

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', ts: new Date() });
});

// ---------------------------------------------------------------------------
// Service proxies
// ---------------------------------------------------------------------------
const services: Record<string, string> = {
  '/auth':         process.env.AUTH_SERVICE_URL         || 'http://auth-service:3001',
  '/content':      process.env.CONTENT_SERVICE_URL      || 'http://content-service:3002',
  '/learner':      process.env.LEARNER_SERVICE_URL      || 'http://learner-service:3003',
  '/notification': process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004',
};

for (const [path, target] of Object.entries(services)) {
  app.use(path, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^${path}`]: '' },
    on: {
      error: (err, _req, res: any) => {
        console.error(`[gateway] ${path} error:`, err.message);
        res.status(502).json({ error: 'Service unavailable', path });
      }
    }
  }));
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`[api-gateway] Running on port ${PORT}`);
  console.log(`[api-gateway] Routes: ${Object.keys(services).join(', ')}`);
});

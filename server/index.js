/**
 * AdBlitz API Proxy Server
 *
 * 代理前端的 API 请求到 OpenAI / fal.ai，API Key 只存在服务端。
 * 部署到 Railway，前端在 Netlify 通过 VITE_API_BASE_URL 指向此服务。
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, cb) => {
    // 允许无 origin（如 curl / 服务端调用）
    if (!origin || ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
      cb(null, true);
    } else {
      cb(null, true); // 宽松模式，生产环境可改为 false
    }
  },
}));

app.use(express.json({ limit: '50mb' }));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 可用模型配置 ──────────────────────────────────────────────
app.get('/api/config', (_req, res) => {
  res.json({
    hasOpenai: !!process.env.OPENAI_API_KEY,
    hasFal: !!process.env.FAL_API_KEY,
    hasCreatify: !!process.env.CREATIFY_API_ID,
  });
});

// ── GPT Proxy ─────────────────────────────────────────────────
// POST /api/gpt  →  https://api.openai.com/v1/responses
app.post('/api/gpt', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  try {
    const response = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('GPT proxy error:', err.message);
    res.status(502).json({ error: `Proxy error: ${err.message}` });
  }
});

// ── fal.ai Proxy ──────────────────────────────────────────────
// POST /api/fal/:model(*)  →  https://fal.run/:model
app.post('/api/fal/*', async (req, res) => {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'FAL_API_KEY not configured' });

  const model = req.params[0]; // 通配符捕获的路径
  const falUrl = `https://fal.run/${model}`;

  try {
    const controller = new AbortController();
    // fal.run 是同步接口，可能需要几分钟
    const timeout = setTimeout(() => controller.abort(), 10 * 60 * 1000);

    const response = await fetch(falUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`,
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('fal.ai proxy error:', err.message);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'fal.ai request timeout (10min)' });
    }
    res.status(502).json({ error: `Proxy error: ${err.message}` });
  }
});

// ── Sora Proxy ────────────────────────────────────────────────
// POST /api/sora/videos  →  https://api.openai.com/v1/videos
app.post('/api/sora/videos', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  try {
    const response = await fetch(`${baseUrl}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Sora proxy error:', err.message);
    res.status(502).json({ error: `Proxy error: ${err.message}` });
  }
});

// GET /api/sora/videos/:id  →  https://api.openai.com/v1/videos/:id
app.get('/api/sora/videos/:id', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  try {
    const response = await fetch(`${baseUrl}/videos/${req.params.id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Sora status proxy error:', err.message);
    res.status(502).json({ error: `Proxy error: ${err.message}` });
  }
});

// GET /api/sora/videos/:id/content  →  forward binary
app.get('/api/sora/videos/:id/content', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  try {
    const response = await fetch(`${baseUrl}/videos/${req.params.id}/content`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: response.statusText });
    }

    res.set('Content-Type', response.headers.get('content-type') || 'video/mp4');
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error('Sora content proxy error:', err.message);
    res.status(502).json({ error: `Proxy error: ${err.message}` });
  }
});

// ── Web Fetch Proxy（替代 CORS 第三方代理） ───────────────────
app.get('/api/fetch-url', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'text/html,application/xhtml+xml,*/*' },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: response.statusText });
    }

    const html = await response.text();
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Fetch proxy error:', err.message);
    res.status(502).json({ error: `Fetch error: ${err.message}` });
  }
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`AdBlitz API server running on port ${PORT}`);
  console.log(`  OpenAI: ${process.env.OPENAI_API_KEY ? 'configured' : 'NOT configured'}`);
  console.log(`  fal.ai: ${process.env.FAL_API_KEY ? 'configured' : 'NOT configured'}`);
});

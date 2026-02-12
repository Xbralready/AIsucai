/**
 * GPT API 客户端
 * 支持纯文本和多模态（文本+图片）输入
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL; // 后端代理地址（生产环境）
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';

/** 是否使用后端代理模式 */
export const useProxy = !!API_BASE;

export function isAPIKeyConfigured(): boolean {
  return useProxy || !!OPENAI_API_KEY;
}

/** 图片输入项 */
export interface ImageInput {
  dataUrl: string;  // data:image/jpeg;base64,... 格式
}

/** 调用 GPT Responses API（支持多模态） */
export async function callGPT<T>(params: {
  systemPrompt: string;
  userContent: string;
  images?: ImageInput[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  tools?: Array<{ type: string }>;
}): Promise<T> {
  if (!API_BASE && !OPENAI_API_KEY) {
    throw new Error('请在 .env 文件中配置 VITE_OPENAI_API_KEY 或 VITE_API_BASE_URL');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    params.timeoutMs || 60000
  );

  try {
    const body: Record<string, unknown> = {
      model: 'gpt-5.2',
      instructions: params.systemPrompt,
      max_output_tokens: params.maxTokens || 4096,
      temperature: params.temperature || 0.3,
    };

    // 有图片时用多模态格式，否则用纯文本
    if (params.images && params.images.length > 0) {
      const content: Array<Record<string, unknown>> = [
        { type: 'input_text', text: params.userContent },
      ];
      for (const img of params.images) {
        content.push({
          type: 'input_image',
          image_url: img.dataUrl,
        });
      }
      body.input = [{ role: 'user', content }];
    } else {
      body.input = params.userContent;
    }

    if (params.tools && params.tools.length > 0) {
      body.tools = params.tools;
    }

    const url = API_BASE ? `${API_BASE}/api/gpt` : `${OPENAI_BASE_URL}/responses`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!API_BASE) {
      headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`GPT API 错误: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // 从 output 数组中找到 message 类型的内容
    let content = '';
    for (const item of data.output || []) {
      if (item.type === 'message') {
        for (const c of item.content || []) {
          if (c.type === 'output_text' && c.text) {
            content = c.text;
            break;
          }
        }
        if (content) break;
      }
    }

    // fallback: 旧格式
    if (!content) {
      content = data.output?.[0]?.content?.[0]?.text || data.output_text || '';
    }

    if (!content) {
      throw new Error('GPT 返回内容为空');
    }

    return parseJsonResponse<T>(content);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/** 解析 JSON 响应（处理 markdown 代码块） */
function parseJsonResponse<T>(content: string): T {
  let jsonStr = content.trim();

  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }

  // 如果内容包含 JSON 块但前后有文字（web_search 场景），提取 JSON 部分
  // 支持对象 {...} 和数组 [...]
  const trimmed = jsonStr.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    const arrMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (objMatch) {
      jsonStr = objMatch[0];
    } else if (arrMatch) {
      jsonStr = arrMatch[0];
    }
  }

  try {
    return JSON.parse(jsonStr.trim()) as T;
  } catch {
    console.error('JSON 解析失败:', content);
    throw new Error('GPT 返回的 JSON 格式无效');
  }
}

/** 将 File 转为 data URL */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * CORS 代理抓取网页内容
 */
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://proxy.corsfix.com/?${encodeURIComponent(url)}`,
];

export interface WebPageContent {
  text: string;
  images: string[];
}

export async function fetchWebContent(url: string): Promise<WebPageContent> {
  // 使用后端代理时，优先走自有服务器（不受 CORS 限制）
  const proxies = API_BASE
    ? [(u: string) => `${API_BASE}/api/fetch-url?url=${encodeURIComponent(u)}`, ...CORS_PROXIES]
    : CORS_PROXIES;

  for (let i = 0; i < proxies.length; i++) {
    const proxyUrl = proxies[i](url);
    try {
      const response = await fetch(proxyUrl, {
        headers: { 'Accept': 'text/html,application/xhtml+xml,*/*' },
      });
      if (!response.ok) continue;

      const html = await response.text();
      if (!html || html.length < 100) continue;

      // 先提取产品图片（在 strip tags 之前）
      const images = extractProductImages(html, url);

      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
        .replace(/\s+/g, ' ')
        .trim();

      return { text: textContent.slice(0, 8000), images };
    } catch {
      continue;
    }
  }
  return { text: '', images: [] };
}

/** 从 HTML 中提取产品图片 URL */
function extractProductImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  const addImage = (src: string) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    images.push(src);
  };

  // 1. og:image（最可靠的产品主图）
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch) addImage(ogMatch[1]);

  // 2. twitter:image
  const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (twMatch) addImage(twMatch[1]);

  // 3. img 标签 — 提取 src 和 data-src
  const imgRegex = /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    let src = match[1];

    // 处理相对路径
    if (src.startsWith('//')) {
      src = 'https:' + src;
    } else if (src.startsWith('/')) {
      try { src = new URL(src, baseUrl).href; } catch { continue; }
    }

    // 过滤掉明显不是产品图的
    const lower = src.toLowerCase();
    if (lower.includes('pixel') || lower.includes('tracking') ||
        lower.includes('icon') || lower.includes('.svg') ||
        lower.includes('logo') || lower.includes('sprite') ||
        lower.includes('1x1') || lower.includes('blank') ||
        lower.includes('spacer') || lower.includes('placeholder') ||
        lower.includes('avatar') || lower.includes('flag') ||
        lower.startsWith('data:')) continue;

    // 只要 http/https 图片
    if (src.startsWith('http')) addImage(src);
  }

  return images.slice(0, 8);
}

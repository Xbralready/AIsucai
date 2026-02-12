/**
 * Creatify AI 数字人口播视频生成适配器
 * 使用 Lipsync V1 端点：文本 → 数字人口播视频
 *
 * 价格：Standard 5 credits/30s，约 $0.90/条（API Starter $299/月 2000 credits）
 * 文档：https://docs.creatify.ai/api-reference/lipsyncs
 */

import type {
  VideoGeneratorBackend,
  GenerateVideoParams,
  VideoJobStatus,
} from './interface';

const CREATIFY_API_ID = import.meta.env.VITE_CREATIFY_API_ID;
const CREATIFY_API_KEY = import.meta.env.VITE_CREATIFY_API_KEY;
const CREATIFY_BASE = 'https://api.creatify.ai/api';

/** Creatify 专用参数 */
export interface CreatifyOptions {
  avatarId?: string;
  voiceId?: string;
}

/** 语言代码 → Creatify 语音筛选条件 */
const LANGUAGE_VOICE_MAP: Record<string, { gender: string; accents: string[] }> = {
  es: { gender: 'female', accents: ['Spanish', 'Mexican', 'Latin American'] },
  pt: { gender: 'female', accents: ['Portuguese', 'Brazilian'] },
  en: { gender: 'female', accents: ['American', 'British'] },
  zh: { gender: 'female', accents: ['Chinese', 'Mandarin'] },
};

/** 缓存（按语言键存） */
const voiceCache = new Map<string, string>();
let cachedAvatarId: string | null = null;

function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-API-ID': CREATIFY_API_ID,
    'X-API-KEY': CREATIFY_API_KEY,
  };
}

/** 将 aspectRatio 转为 Creatify 格式 */
function toCreatifyAspectRatio(ratio: '9:16' | '16:9' | '1:1'): string {
  switch (ratio) {
    case '9:16': return '9x16';
    case '16:9': return '16x9';
    case '1:1': return '1x1';
    default: return '9x16';
  }
}

/** 获取第一个可用的数字人 ID */
async function getDefaultAvatarId(): Promise<string> {
  if (cachedAvatarId) return cachedAvatarId;

  const response = await fetch(`${CREATIFY_BASE}/personas/`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`获取数字人列表失败: ${response.statusText}`);
  }

  const personas = await response.json();
  if (!Array.isArray(personas) || personas.length === 0) {
    throw new Error('没有可用的数字人，请在 Creatify 后台添加');
  }

  // 优先选 active 的
  const preferred = personas.find(
    (p: { is_active: boolean }) => p.is_active
  ) || personas[0];

  cachedAvatarId = preferred.id;
  console.log('Creatify: 默认数字人:', preferred.creator_name || preferred.id);
  return cachedAvatarId!;
}

/** 根据语言获取匹配的语音 ID */
async function getVoiceForLanguage(language: string): Promise<string> {
  const cacheKey = language || 'en';
  if (voiceCache.has(cacheKey)) return voiceCache.get(cacheKey)!;

  const response = await fetch(`${CREATIFY_BASE}/voices/`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`获取语音列表失败: ${response.statusText}`);
  }

  const voices = await response.json();
  if (!Array.isArray(voices) || voices.length === 0) {
    throw new Error('没有可用的语音');
  }

  const pref = LANGUAGE_VOICE_MAP[cacheKey] || LANGUAGE_VOICE_MAP['en'];

  // 策略1: 精确匹配 gender + accent
  for (const voice of voices) {
    if (voice.gender === pref.gender && voice.accents?.length > 0) {
      for (const targetAccent of pref.accents) {
        const match = voice.accents.find(
          (a: { accent_name: string }) =>
            a.accent_name.toLowerCase().includes(targetAccent.toLowerCase())
        );
        if (match) {
          voiceCache.set(cacheKey, match.id);
          console.log(`Creatify: 语音匹配 [${cacheKey}]:`, voice.name, match.accent_name, match.id);
          return match.id;
        }
      }
    }
  }

  // 策略2: 只匹配 accent（不限 gender）
  for (const voice of voices) {
    if (voice.accents?.length > 0) {
      for (const targetAccent of pref.accents) {
        const match = voice.accents.find(
          (a: { accent_name: string }) =>
            a.accent_name.toLowerCase().includes(targetAccent.toLowerCase())
        );
        if (match) {
          voiceCache.set(cacheKey, match.id);
          console.log(`Creatify: 语音备选 [${cacheKey}]:`, voice.name, match.accent_name, match.id);
          return match.id;
        }
      }
    }
  }

  // 策略3: 取第一个有 accent 的语音
  const fallback = voices.find((v: { accents: unknown[] }) => v.accents?.length > 0);
  if (fallback) {
    const id = fallback.accents[0].id;
    voiceCache.set(cacheKey, id);
    console.warn(`Creatify: 未找到 ${cacheKey} 语音，使用默认:`, fallback.name, id);
    return id;
  }

  throw new Error(`没有可用的语音（目标语言: ${cacheKey}）`);
}

export class CreatifyBackend implements VideoGeneratorBackend {
  name = 'Creatify';

  private options: CreatifyOptions;

  constructor(options?: CreatifyOptions) {
    this.options = options || {};
  }

  async generateVideo(params: GenerateVideoParams): Promise<VideoJobStatus> {
    if (!CREATIFY_API_ID || !CREATIFY_API_KEY) {
      throw new Error('请配置 VITE_CREATIFY_API_ID 和 VITE_CREATIFY_API_KEY');
    }

    // 获取数字人和语音 ID（语音按语言匹配）
    const avatarId = this.options.avatarId || await getDefaultAvatarId();
    const voiceId = this.options.voiceId || await getVoiceForLanguage(params.language || 'en');

    const requestBody = {
      text: params.prompt,          // 脚本文本作为口播内容
      creator: avatarId,
      accent: voiceId,
      aspect_ratio: toCreatifyAspectRatio(params.aspectRatio),
      model_version: 'standard',
      no_caption: false,
      no_music: true,
    };

    console.log(`Creatify: 提交口播任务, 数字人: ${avatarId}, 语音: ${voiceId}, 语言: ${params.language || 'en'}`);

    const response = await fetch(`${CREATIFY_BASE}/lipsyncs/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Creatify API 错误: ${error.detail || error.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Creatify: 任务创建成功, ID:', data.id);

    return {
      id: data.id,
      status: 'queued',
      progress: 0,
    };
  }

  async getJobStatus(jobId: string): Promise<VideoJobStatus> {
    const response = await fetch(`${CREATIFY_BASE}/lipsyncs/${jobId}/`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Creatify 状态查询失败: ${response.statusText}`);
    }

    const data = await response.json();

    const statusMap: Record<string, VideoJobStatus['status']> = {
      'pending': 'queued',
      'in_queue': 'queued',
      'running': 'processing',
      'done': 'completed',
      'failed': 'failed',
    };

    return {
      id: jobId,
      status: statusMap[data.status] || 'queued',
      progress: data.status === 'done' ? 100 : data.status === 'running' ? 50 : 0,
      videoUrl: data.status === 'done' ? data.output : undefined,
      error: data.failed_reason || undefined,
    };
  }

  async waitForCompletion(
    jobId: string,
    onProgress?: (status: VideoJobStatus) => void
  ): Promise<VideoJobStatus> {
    const pollInterval = 8000;   // 8 秒
    const timeout = 600000;      // 10 分钟
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getJobStatus(jobId);
      onProgress?.(status);

      if (status.status === 'completed') return status;
      if (status.status === 'failed') {
        throw new Error(`Creatify 生成失败: ${status.error || '未知错误'}`);
      }

      await new Promise(r => setTimeout(r, pollInterval));
    }

    throw new Error('Creatify 生成超时');
  }
}

/** 获取可用数字人列表（供 UI 选择） */
export async function listAvatars() {
  const response = await fetch(`${CREATIFY_BASE}/personas/`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('获取数字人列表失败');
  return response.json();
}

/** 获取可用语音列表（供 UI 选择） */
export async function listVoices() {
  const response = await fetch(`${CREATIFY_BASE}/voices/`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('获取语音列表失败');
  return response.json();
}

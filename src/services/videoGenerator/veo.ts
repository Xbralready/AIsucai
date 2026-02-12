/**
 * Google Veo 3.1 视频生成适配器
 * 通过 fal.ai 第三方接入
 *
 * 使用同步接口 fal.run（避免 queue API 的 CORS 问题）
 * POST 一次，阻塞等待结果返回
 *
 * 价格（Veo 3.1 Fast）：
 *   无音频 $0.10/秒 | 有音频 $0.15/秒
 *   720p 默认 | 1080p 同价 | 4K $0.35/秒
 *
 * 文档：https://fal.ai/models/fal-ai/veo3.1/fast
 */

import type {
  VideoGeneratorBackend,
  GenerateVideoParams,
  VideoJobStatus,
} from './interface';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;
const FAL_RUN_URL = 'https://fal.run';

/** fal.ai 支持的 Veo 模型 */
const VEO_MODELS = {
  fast: 'fal-ai/veo3.1/fast',
  fastImage: 'fal-ai/veo3.1/fast/image-to-video',
  standard: 'fal-ai/veo3.1',
} as const;

/** 将 aspectRatio 转为 fal.ai 格式 */
function toFalAspectRatio(ratio: '9:16' | '16:9' | '1:1'): string {
  switch (ratio) {
    case '9:16': return '9:16';
    case '16:9': return '16:9';
    case '1:1': return '1:1';
    default: return '16:9';
  }
}

/** 将秒数转为 fal.ai 支持的时长（仅支持 4s/6s/8s） */
function toFalDuration(seconds: number): string {
  if (seconds <= 4) return '4s';
  if (seconds <= 6) return '6s';
  return '8s';
}

function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Key ${FAL_API_KEY}`,
  };
}

/** 待执行的任务参数缓存 */
interface PendingJob {
  model: string;
  input: Record<string, unknown>;
}

export class VeoBackend implements VideoGeneratorBackend {
  name = 'Veo 3.1';

  /** 缓存待执行的任务参数（generateVideo 存入，waitForCompletion 执行） */
  private pendingJobs = new Map<string, PendingJob>();
  /** 缓存已完成的结果 */
  private completedResults = new Map<string, string>();

  async generateVideo(params: GenerateVideoParams): Promise<VideoJobStatus> {
    if (!API_BASE && !FAL_API_KEY) {
      throw new Error('请配置 VITE_FAL_API_KEY（从 fal.ai/dashboard/keys 获取）');
    }

    const model = params.imageUrl ? VEO_MODELS.fastImage : VEO_MODELS.fast;

    const input: Record<string, unknown> = {
      prompt: params.prompt,
      aspect_ratio: toFalAspectRatio(params.aspectRatio),
      duration: toFalDuration(params.duration),
      resolution: params.resolution || '720p',
      generate_audio: params.generateAudio ?? false,
    };

    if (params.imageUrl) {
      input.image_url = params.imageUrl;
    }

    // 生成一个本地 ID，把参数缓存起来
    // 实际的 API 调用在 waitForCompletion 中执行（这样 UI 可以显示进度）
    const jobId = `veo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.pendingJobs.set(jobId, { model, input });

    console.log(`Veo: 任务准备就绪 [${model}] 音频:${input.generate_audio} 分辨率:${input.resolution} 时长:${input.duration}`);

    return {
      id: jobId,
      status: 'queued',
      progress: 0,
    };
  }

  async getJobStatus(jobId: string): Promise<VideoJobStatus> {
    // 检查是否已有缓存结果
    const videoUrl = this.completedResults.get(jobId);
    if (videoUrl) {
      return { id: jobId, status: 'completed', progress: 100, videoUrl };
    }

    // 还在等待中
    return { id: jobId, status: 'processing', progress: 50 };
  }

  async waitForCompletion(
    jobId: string,
    onProgress?: (status: VideoJobStatus) => void
  ): Promise<VideoJobStatus> {
    const pending = this.pendingJobs.get(jobId);
    if (!pending) {
      // 可能已经完成了
      const cached = this.completedResults.get(jobId);
      if (cached) {
        return { id: jobId, status: 'completed', progress: 100, videoUrl: cached };
      }
      throw new Error('找不到任务');
    }

    // 启动模拟进度
    // image-to-video + 音频：可能需要 3-5 分钟；纯文字：30-120 秒
    const hasImage = !!pending.input.image_url;
    const hasAudio = !!pending.input.generate_audio;
    const isLongTask = hasImage && hasAudio;
    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      let progress: number;
      if (isLongTask) {
        // image-to-video + audio：8 分钟内缓慢推进到 99%
        if (elapsed < 60) {
          progress = 10 + (elapsed / 60) * 25;           // 10% → 35%
        } else if (elapsed < 120) {
          progress = 35 + ((elapsed - 60) / 60) * 20;    // 35% → 55%
        } else if (elapsed < 200) {
          progress = 55 + ((elapsed - 120) / 80) * 20;   // 55% → 75%
        } else if (elapsed < 300) {
          progress = 75 + ((elapsed - 200) / 100) * 15;  // 75% → 90%
        } else {
          progress = 90 + Math.min(9, ((elapsed - 300) / 180) * 9); // 90% → 99%（再 3 分钟）
        }
      } else {
        // 纯文字/短任务：4 分钟内到 99%
        if (elapsed < 30) {
          progress = 10 + (elapsed / 30) * 30;            // 10% → 40%
        } else if (elapsed < 60) {
          progress = 40 + ((elapsed - 30) / 30) * 30;     // 40% → 70%
        } else if (elapsed < 120) {
          progress = 70 + ((elapsed - 60) / 60) * 20;     // 70% → 90%
        } else {
          progress = 90 + Math.min(9, ((elapsed - 120) / 120) * 9); // 90% → 99%（再 2 分钟）
        }
      }
      onProgress?.({
        id: jobId,
        status: 'processing',
        progress: Math.round(progress),
      });
    }, 2000);

    try {
      // 使用同步接口 fal.run（单次 POST，阻塞等到完成）
      // 这样避免了 queue API 的 CORS 轮询问题
      const timeout = isLongTask ? 8 * 60 * 1000 : 4 * 60 * 1000; // 长任务 8 分钟，短任务 4 分钟
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      console.log(`Veo: 开始生成 [${pending.model}]${isLongTask ? '（长任务，预计 3-5 分钟）' : ''}，等待完成...`);

      const url = API_BASE
        ? `${API_BASE}/api/fal/${pending.model}`
        : `${FAL_RUN_URL}/${pending.model}`;
      const headers = API_BASE
        ? { 'Content-Type': 'application/json' }
        : getHeaders();

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(pending.input),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      clearInterval(progressTimer);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const msg = error.detail || error.message || response.statusText;
        throw new Error(`Veo API 错误 (${response.status}): ${msg}`);
      }

      const result = await response.json();
      const videoUrl = result.video?.url || result.data?.video?.url;

      if (!videoUrl) {
        console.warn('Veo: 完成但未找到视频 URL:', JSON.stringify(result).slice(0, 300));
        throw new Error('生成完成但未返回视频地址');
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Veo: 生成完成! 耗时 ${elapsed}s, URL: ${videoUrl.slice(0, 80)}...`);

      // 缓存结果，清理待执行
      this.completedResults.set(jobId, videoUrl);
      this.pendingJobs.delete(jobId);

      const status: VideoJobStatus = {
        id: jobId,
        status: 'completed',
        progress: 100,
        videoUrl,
      };
      onProgress?.(status);
      return status;

    } catch (error) {
      clearInterval(progressTimer);
      this.pendingJobs.delete(jobId);
      if (error instanceof DOMException && error.name === 'AbortError') {
        const mins = isLongTask ? 8 : 4;
        throw new Error(`生成超时（${mins} 分钟未返回），请稍后重试`);
      }
      throw error;
    }
  }
}

/**
 * 计算 Veo 预估成本
 */
export function estimateVeoCost(durationSec: number, withAudio: boolean): number {
  const ratePerSec = withAudio ? 0.15 : 0.10;
  return durationSec * ratePerSec;
}

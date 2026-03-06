/**
 * Google Veo 3.1 视频生成适配器
 * 通过 fal.ai 接入
 *
 * 两种模式：
 *   A) 有后端代理（API_BASE）→ POST /api/fal/* 同步代理（10 分钟超时）
 *   B) 有 FAL_API_KEY → 使用 @fal-ai/client SDK（WebSocket，无 CORS / 超时）
 *
 * 价格（Veo 3.1 Fast）：
 *   无音频 $0.10/秒 | 有音频 $0.15/秒
 *   720p 默认 | 1080p 同价 | 4K $0.35/秒
 *
 * 文档：https://fal.ai/models/fal-ai/veo3.1/fast
 */

import { fal } from '@fal-ai/client';
import type {
  VideoGeneratorBackend,
  GenerateVideoParams,
  VideoJobStatus,
} from './interface';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;

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

/** SDK 任务 */
interface SdkJob {
  promise: Promise<string>;
  lastProgress: number;
}

/** 后端代理任务 */
interface PendingJob {
  model: string;
  input: Record<string, unknown>;
  isLongTask: boolean;
}

export class VeoBackend implements VideoGeneratorBackend {
  name = 'Veo 3.1';

  private sdkJobs = new Map<string, SdkJob>();
  private pendingJobs = new Map<string, PendingJob>();
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

    const jobId = `veo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const isLongTask = !!params.imageUrl && !!params.generateAudio;

    if (FAL_API_KEY) {
      // 模式 B：fal SDK（WebSocket，无超时）
      const sdkJob: SdkJob = { promise: null!, lastProgress: 0 };
      sdkJob.promise = this.callFalSdk(model, input, isLongTask, (p) => { sdkJob.lastProgress = p; });
      this.sdkJobs.set(jobId, sdkJob);
      console.log(`Veo: fal SDK 调用 [${model}] 音频:${input.generate_audio} 分辨率:${input.resolution} 时长:${input.duration}`);
    } else {
      // 模式 A：后端代理
      this.pendingJobs.set(jobId, { model, input, isLongTask });
      console.log(`Veo: 任务准备就绪 [${model}] 音频:${input.generate_audio} 分辨率:${input.resolution} 时长:${input.duration}`);
    }

    return { id: jobId, status: 'queued', progress: 0 };
  }

  async getJobStatus(jobId: string): Promise<VideoJobStatus> {
    const videoUrl = this.completedResults.get(jobId);
    if (videoUrl) {
      return { id: jobId, status: 'completed', progress: 100, videoUrl };
    }
    return { id: jobId, status: 'processing', progress: 50 };
  }

  async waitForCompletion(
    jobId: string,
    onProgress?: (status: VideoJobStatus) => void
  ): Promise<VideoJobStatus> {
    const cached = this.completedResults.get(jobId);
    if (cached) {
      return { id: jobId, status: 'completed', progress: 100, videoUrl: cached };
    }

    // 模式 B：fal SDK
    const sdkJob = this.sdkJobs.get(jobId);
    if (sdkJob) {
      return this.waitForSdkCompletion(jobId, sdkJob, onProgress);
    }

    // 模式 A：后端代理同步调用
    const pending = this.pendingJobs.get(jobId);
    if (pending) {
      return this.waitForProxyCompletion(jobId, pending, onProgress);
    }

    throw new Error('找不到任务');
  }

  // ── 模式 B：fal SDK ──

  private async callFalSdk(
    model: string,
    input: Record<string, unknown>,
    isLongTask: boolean,
    onSdkProgress: (progress: number) => void
  ): Promise<string> {
    const startTime = Date.now();

    const result = await fal.subscribe(model, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        const elapsed = (Date.now() - startTime) / 1000;

        if (update.status === 'IN_QUEUE') {
          const p = 5 + Math.min(15, elapsed / 10);
          onSdkProgress(Math.round(p));
        } else if (update.status === 'IN_PROGRESS') {
          let p: number;
          if (isLongTask) {
            if (elapsed < 60) p = 20 + (elapsed / 60) * 25;
            else if (elapsed < 180) p = 45 + ((elapsed - 60) / 120) * 30;
            else p = 75 + Math.min(20, ((elapsed - 180) / 120) * 20);
          } else {
            if (elapsed < 30) p = 20 + (elapsed / 30) * 30;
            else if (elapsed < 60) p = 50 + ((elapsed - 30) / 30) * 30;
            else p = 80 + Math.min(15, ((elapsed - 60) / 60) * 15);
          }
          onSdkProgress(Math.round(p));
        }
      },
    });

    const data = result.data as Record<string, any>;
    const videoUrl = data?.video?.url;

    if (!videoUrl) {
      console.warn('Veo SDK: 完成但未找到视频 URL:', JSON.stringify(data).slice(0, 300));
      throw new Error('生成完成但未返回视频地址');
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Veo SDK: 生成完成! 耗时 ${elapsed}s`);

    return videoUrl;
  }

  private async waitForSdkCompletion(
    jobId: string,
    sdkJob: SdkJob,
    onProgress?: (status: VideoJobStatus) => void
  ): Promise<VideoJobStatus> {
    let resolved = false;
    let videoUrl: string | null = null;
    let error: Error | null = null;

    sdkJob.promise
      .then(r => { videoUrl = r; resolved = true; })
      .catch(e => { error = e; resolved = true; });

    console.log('Veo: fal SDK 等待中（WebSocket 模式）...');

    while (!resolved) {
      onProgress?.({ id: jobId, status: 'processing', progress: sdkJob.lastProgress || 5 });
      await new Promise(r => setTimeout(r, 2000));
    }

    this.sdkJobs.delete(jobId);

    if (error) throw error;
    if (!videoUrl) throw new Error('未知错误');

    this.completedResults.set(jobId, videoUrl);

    const status: VideoJobStatus = { id: jobId, status: 'completed', progress: 100, videoUrl };
    onProgress?.(status);
    return status;
  }

  // ── 模式 A：后端代理 ──

  private async waitForProxyCompletion(
    jobId: string,
    pending: PendingJob,
    onProgress?: (status: VideoJobStatus) => void
  ): Promise<VideoJobStatus> {
    const startTime = Date.now();
    const { isLongTask } = pending;

    // 模拟进度
    const progressTimer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      let progress: number;
      if (isLongTask) {
        if (elapsed < 60) progress = 10 + (elapsed / 60) * 25;
        else if (elapsed < 120) progress = 35 + ((elapsed - 60) / 60) * 20;
        else if (elapsed < 200) progress = 55 + ((elapsed - 120) / 80) * 20;
        else if (elapsed < 300) progress = 75 + ((elapsed - 200) / 100) * 15;
        else progress = 90 + Math.min(9, ((elapsed - 300) / 180) * 9);
      } else {
        if (elapsed < 30) progress = 10 + (elapsed / 30) * 30;
        else if (elapsed < 60) progress = 40 + ((elapsed - 30) / 30) * 30;
        else if (elapsed < 120) progress = 70 + ((elapsed - 60) / 60) * 20;
        else progress = 90 + Math.min(9, ((elapsed - 120) / 120) * 9);
      }
      onProgress?.({ id: jobId, status: 'processing', progress: Math.round(progress) });
    }, 2000);

    try {
      const timeout = isLongTask ? 8 * 60 * 1000 : 4 * 60 * 1000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      console.log(`Veo: 开始生成 [${pending.model}]${isLongTask ? '（长任务）' : ''}，等待完成...`);

      const url = `${API_BASE}/api/fal/${pending.model}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pending.input),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      clearInterval(progressTimer);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Veo API 错误 (${response.status}): ${error.detail || error.message || response.statusText}`);
      }

      const result = await response.json();
      const videoUrl = result.video?.url || result.data?.video?.url;

      if (!videoUrl) {
        throw new Error('生成完成但未返回视频地址');
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Veo: 生成完成! 耗时 ${elapsed}s`);

      this.completedResults.set(jobId, videoUrl);
      this.pendingJobs.delete(jobId);

      const status: VideoJobStatus = { id: jobId, status: 'completed', progress: 100, videoUrl };
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

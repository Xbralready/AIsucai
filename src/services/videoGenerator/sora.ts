/**
 * Sora 2 视频生成适配器
 *
 * 两种模式：
 *   A) 有后端代理（API_BASE，无客户端 Key）→ 通过后端 /api/fal-queue/* 代理
 *   B) 有 FAL_API_KEY（本地开发）→ 使用 @fal-ai/client SDK（WebSocket，无 CORS / 超时问题）
 *
 * 端点：
 *   文生视频：fal-ai/sora-2/text-to-video
 *   Remix：fal-ai/sora-2/video-to-video/remix
 *
 * 价格：$0.10/秒
 * 时长：4s / 8s / 12s
 */

import { fal } from '@fal-ai/client';
import type {
  VideoGeneratorBackend,
  GenerateVideoParams,
  VideoJobStatus,
} from './interface';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;

// 初始化 fal client（仅在有 API Key 时）
if (FAL_API_KEY) {
  fal.config({ credentials: FAL_API_KEY });
}

const SORA_MODELS = {
  textToVideo: 'fal-ai/sora-2/text-to-video',
  remix: 'fal-ai/sora-2/video-to-video/remix',
} as const;

/** 将秒数转为 Sora 支持的时长（4/8/12） */
function toSoraDuration(seconds: number): number {
  if (seconds <= 6) return 4;
  if (seconds <= 10) return 8;
  return 12;
}

/** fal SDK 任务（模式 B） */
interface FalSdkJob {
  promise: Promise<{ videoUrl: string; videoId: string }>;
  lastProgress: number;
}

/** 队列任务（模式 A） */
interface QueuedJob {
  model: string;
  requestId: string;
}

export class SoraBackend implements VideoGeneratorBackend {
  name = 'Sora 2';

  private queuedJobs = new Map<string, QueuedJob>();
  private sdkJobs = new Map<string, FalSdkJob>();
  private completedResults = new Map<string, { videoUrl: string; videoId: string }>();

  async generateVideo(params: GenerateVideoParams): Promise<VideoJobStatus> {
    if (!API_BASE && !FAL_API_KEY) {
      throw new Error('请配置 VITE_FAL_API_KEY（从 fal.ai/dashboard/keys 获取）');
    }

    const aspectRatio = params.aspectRatio === '1:1' ? '16:9' : params.aspectRatio;
    const duration = toSoraDuration(params.duration);

    const input: Record<string, unknown> = {
      prompt: params.prompt,
      aspect_ratio: aspectRatio,
      duration,
    };

    const model = SORA_MODELS.textToVideo;
    const jobId = `sora_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (FAL_API_KEY) {
      // 模式 B：使用 fal SDK（WebSocket，无 CORS / 超时问题）
      const sdkJob: FalSdkJob = { promise: null!, lastProgress: 0 };
      sdkJob.promise = this.callFalSdk(model, input, (p) => { sdkJob.lastProgress = p; });
      this.sdkJobs.set(jobId, sdkJob);
      console.log(`Sora: fal SDK 调用 [text-to-video] 时长:${duration}s 比例:${aspectRatio}`);
    } else {
      // 模式 A：通过后端代理提交到队列
      const requestId = await this.submitToQueue(model, input);
      this.queuedJobs.set(jobId, { model, requestId });
      console.log(`Sora: 已提交队列 [text-to-video] 时长:${duration}s 比例:${aspectRatio} request_id:${requestId}`);
    }

    return { id: jobId, status: 'queued', progress: 0 };
  }

  async remixVideo(sourceVideoId: string, prompt: string): Promise<VideoJobStatus> {
    if (!API_BASE && !FAL_API_KEY) {
      throw new Error('请配置 VITE_FAL_API_KEY');
    }

    const input: Record<string, unknown> = {
      video_id: sourceVideoId,
      prompt,
    };

    const model = SORA_MODELS.remix;
    const jobId = `sora_remix_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (FAL_API_KEY) {
      const sdkJob: FalSdkJob = { promise: null!, lastProgress: 0 };
      sdkJob.promise = this.callFalSdk(model, input, (p) => { sdkJob.lastProgress = p; });
      this.sdkJobs.set(jobId, sdkJob);
      console.log(`Sora: fal SDK Remix 调用`);
    } else {
      const requestId = await this.submitToQueue(model, input);
      this.queuedJobs.set(jobId, { model, requestId });
      console.log(`Sora: Remix 已提交队列 [video_id: ${sourceVideoId.slice(0, 20)}...]`);
    }

    return { id: jobId, status: 'queued', progress: 0 };
  }

  async getJobStatus(jobId: string): Promise<VideoJobStatus> {
    const result = this.completedResults.get(jobId);
    if (result) {
      return { id: result.videoId, status: 'completed', progress: 100, videoUrl: result.videoUrl };
    }
    return { id: jobId, status: 'processing', progress: 50 };
  }

  async waitForCompletion(
    jobId: string,
    onProgress?: (status: VideoJobStatus) => void
  ): Promise<VideoJobStatus> {
    const cached = this.completedResults.get(jobId);
    if (cached) {
      return { id: cached.videoId, status: 'completed', progress: 100, videoUrl: cached.videoUrl };
    }

    // 模式 B：fal SDK
    const sdkJob = this.sdkJobs.get(jobId);
    if (sdkJob) {
      return this.waitForSdkCompletion(jobId, sdkJob, onProgress);
    }

    // 模式 A：队列轮询
    const queued = this.queuedJobs.get(jobId);
    if (queued) {
      return this.waitForQueueCompletion(jobId, queued, onProgress);
    }

    throw new Error('找不到任务');
  }

  // ── 模式 B：fal SDK（浏览器直连，WebSocket） ──

  /** 使用 fal.subscribe 调用（内部用 WebSocket 轮询，无 CORS / 超时） */
  private async callFalSdk(
    model: string,
    input: Record<string, unknown>,
    onSdkProgress: (progress: number) => void
  ): Promise<{ videoUrl: string; videoId: string }> {
    const startTime = Date.now();

    const result = await fal.subscribe(model, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        const elapsed = (Date.now() - startTime) / 1000;

        if (update.status === 'IN_QUEUE') {
          const p = 5 + Math.min(15, elapsed / 10);
          onSdkProgress(Math.round(p));
          console.log(`Sora SDK: 排队中... ${Math.round(p)}%`);
        } else if (update.status === 'IN_PROGRESS') {
          let p: number;
          if (elapsed < 60) {
            p = 20 + (elapsed / 60) * 30;
          } else if (elapsed < 180) {
            p = 50 + ((elapsed - 60) / 120) * 30;
          } else {
            p = 80 + Math.min(15, ((elapsed - 180) / 120) * 15);
          }
          onSdkProgress(Math.round(p));
          console.log(`Sora SDK: 生成中... ${Math.round(p)}%`);
        }
      },
    });

    const data = result.data as Record<string, any>;
    const videoUrl = data?.video?.url;
    const videoId = data?.video_id || `sdk_${Date.now()}`;

    if (!videoUrl) {
      console.warn('Sora SDK: 完成但未找到视频 URL:', JSON.stringify(data).slice(0, 300));
      throw new Error('生成完成但未返回视频地址');
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Sora SDK: 生成完成! 耗时 ${elapsed}s, video_id: ${videoId}`);

    return { videoUrl, videoId };
  }

  /** 等待 fal SDK 完成 */
  private async waitForSdkCompletion(
    jobId: string,
    sdkJob: FalSdkJob,
    onProgress?: (status: VideoJobStatus) => void
  ): Promise<VideoJobStatus> {
    let resolved = false;
    let result: { videoUrl: string; videoId: string } | null = null;
    let error: Error | null = null;

    sdkJob.promise
      .then(r => { result = r; resolved = true; })
      .catch(e => { error = e; resolved = true; });

    console.log('Sora: fal SDK 等待中（WebSocket 模式）...');

    while (!resolved) {
      onProgress?.({
        id: jobId,
        status: 'processing',
        progress: sdkJob.lastProgress || 5,
      });
      await new Promise(r => setTimeout(r, 2000));
    }

    this.sdkJobs.delete(jobId);

    if (error) throw error;
    if (!result) throw new Error('未知错误');

    const { videoUrl, videoId } = result;
    this.completedResults.set(jobId, { videoUrl, videoId });

    const status: VideoJobStatus = { id: videoId, status: 'completed', progress: 100, videoUrl };
    onProgress?.(status);
    return status;
  }

  // ── 模式 A：队列方法（通过后端代理） ──

  private async submitToQueue(model: string, input: Record<string, unknown>): Promise<string> {
    const url = `${API_BASE}/api/fal-queue/${model}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Sora 提交失败 (${response.status}): ${error.detail || error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.request_id;
  }

  private async pollQueueStatus(
    model: string,
    requestId: string
  ): Promise<{ status: string; error?: string }> {
    const url = `${API_BASE}/api/fal-queue/${model}/requests/${requestId}/status`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`状态查询失败 (${response.status})`);
    return response.json();
  }

  private async getQueueResult(
    model: string,
    requestId: string
  ): Promise<Record<string, any>> {
    const url = `${API_BASE}/api/fal-queue/${model}/requests/${requestId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`结果获取失败 (${response.status})`);
    return response.json();
  }

  private async waitForQueueCompletion(
    jobId: string,
    queued: QueuedJob,
    onProgress?: (status: VideoJobStatus) => void
  ): Promise<VideoJobStatus> {
    const startTime = Date.now();
    const maxWait = 15 * 60 * 1000; // 15 分钟
    const pollInterval = 3000;

    console.log(`Sora: 开始轮询 [${queued.model.includes('remix') ? 'remix' : 'text-to-video'}] request_id:${queued.requestId}`);

    while (Date.now() - startTime < maxWait) {
      const queueStatus = await this.pollQueueStatus(queued.model, queued.requestId);

      if (queueStatus.status === 'COMPLETED') {
        const result = await this.getQueueResult(queued.model, queued.requestId);
        const videoUrl = result.video?.url;
        const videoId = result.video_id;

        if (!videoUrl) {
          throw new Error('生成完成但未返回视频地址');
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`Sora: 生成完成! 耗时 ${elapsed}s, video_id: ${videoId}`);

        this.completedResults.set(jobId, { videoUrl, videoId });
        this.queuedJobs.delete(jobId);

        const status: VideoJobStatus = { id: videoId, status: 'completed', progress: 100, videoUrl };
        onProgress?.(status);
        return status;
      }

      if (queueStatus.status === 'FAILED') {
        this.queuedJobs.delete(jobId);
        throw new Error(`Sora 生成失败: ${queueStatus.error || '未知错误'}`);
      }

      const elapsed = (Date.now() - startTime) / 1000;
      let progress: number;
      if (queueStatus.status === 'IN_QUEUE') {
        progress = 5 + Math.min(15, elapsed / 10);
      } else {
        if (elapsed < 60) progress = 20 + (elapsed / 60) * 30;
        else if (elapsed < 180) progress = 50 + ((elapsed - 60) / 120) * 30;
        else progress = 80 + Math.min(15, ((elapsed - 180) / 120) * 15);
      }

      onProgress?.({ id: jobId, status: 'processing', progress: Math.round(progress) });
      await new Promise(r => setTimeout(r, pollInterval));
    }

    this.queuedJobs.delete(jobId);
    throw new Error('生成超时（15 分钟未返回），请稍后重试');
  }
}

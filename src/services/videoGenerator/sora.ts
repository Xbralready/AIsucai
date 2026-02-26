/**
 * Sora 2 视频生成适配器（通过 fal.ai）
 *
 * 使用同步接口 fal.run（与 Veo 一致，单次 POST 阻塞等待结果）
 *
 * 端点：
 *   文生视频：fal-ai/sora-2/text-to-video
 *   Remix：fal-ai/sora-2/video-to-video/remix
 *
 * 价格：$0.10/秒
 * 时长：4s / 8s / 12s
 *
 * 文档：https://fal.ai/models/fal-ai/sora-2/text-to-video/api
 */

import type {
  VideoGeneratorBackend,
  GenerateVideoParams,
  VideoJobStatus,
} from './interface';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;
const FAL_RUN_URL = 'https://fal.run';

/** fal.ai 上的 Sora 2 模型 */
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

export class SoraBackend implements VideoGeneratorBackend {
  name = 'Sora 2';

  /** 缓存待执行的任务参数（generateVideo 存入，waitForCompletion 执行） */
  private pendingJobs = new Map<string, PendingJob>();
  /** 缓存已完成的结果 */
  private completedResults = new Map<string, { videoUrl: string; videoId: string }>();

  async generateVideo(params: GenerateVideoParams): Promise<VideoJobStatus> {
    if (!API_BASE && !FAL_API_KEY) {
      throw new Error('请配置 VITE_FAL_API_KEY（从 fal.ai/dashboard/keys 获取）');
    }

    // Sora 2 on fal.ai only supports 9:16 and 16:9
    const aspectRatio = params.aspectRatio === '1:1' ? '16:9' : params.aspectRatio;

    const input: Record<string, unknown> = {
      prompt: params.prompt,
      aspect_ratio: aspectRatio,
      duration: toSoraDuration(params.duration),
    };

    const jobId = `sora_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.pendingJobs.set(jobId, { model: SORA_MODELS.textToVideo, input });

    console.log(`Sora: 任务准备就绪 [text-to-video] 时长:${input.duration}s 比例:${aspectRatio}`);

    return {
      id: jobId,
      status: 'queued',
      progress: 0,
    };
  }

  async remixVideo(sourceVideoId: string, prompt: string): Promise<VideoJobStatus> {
    if (!API_BASE && !FAL_API_KEY) {
      throw new Error('请配置 VITE_FAL_API_KEY');
    }

    const input: Record<string, unknown> = {
      video_id: sourceVideoId,
      prompt,
    };

    const jobId = `sora_remix_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.pendingJobs.set(jobId, { model: SORA_MODELS.remix, input });

    console.log(`Sora: Remix 任务准备就绪 [video_id: ${sourceVideoId.slice(0, 20)}...]`);

    return {
      id: jobId,
      status: 'queued',
      progress: 0,
    };
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
    const pending = this.pendingJobs.get(jobId);
    if (!pending) {
      const cached = this.completedResults.get(jobId);
      if (cached) {
        return { id: cached.videoId, status: 'completed', progress: 100, videoUrl: cached.videoUrl };
      }
      throw new Error('找不到任务');
    }

    // 模拟进度（同步调用，实际进度不可知）
    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      let progress: number;
      if (elapsed < 30) {
        progress = 10 + (elapsed / 30) * 30;            // 10% → 40%
      } else if (elapsed < 90) {
        progress = 40 + ((elapsed - 30) / 60) * 30;     // 40% → 70%
      } else if (elapsed < 180) {
        progress = 70 + ((elapsed - 90) / 90) * 20;     // 70% → 90%
      } else {
        progress = 90 + Math.min(9, ((elapsed - 180) / 120) * 9); // 90% → 99%
      }
      onProgress?.({
        id: jobId,
        status: 'processing',
        progress: Math.round(progress),
      });
    }, 2000);

    try {
      const timeout = 5 * 60 * 1000; // 5 分钟
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const isRemix = pending.model === SORA_MODELS.remix;
      console.log(`Sora: 开始生成 [${isRemix ? 'remix' : 'text-to-video'}]，等待完成...`);

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
        throw new Error(`Sora API 错误 (${response.status}): ${msg}`);
      }

      const result = await response.json();
      const videoUrl = result.video?.url;
      const videoId = result.video_id;

      if (!videoUrl) {
        console.warn('Sora: 完成但未找到视频 URL:', JSON.stringify(result).slice(0, 300));
        throw new Error('生成完成但未返回视频地址');
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Sora: 生成完成! 耗时 ${elapsed}s, video_id: ${videoId}`);

      this.completedResults.set(jobId, { videoUrl, videoId });
      this.pendingJobs.delete(jobId);

      // id 返回 fal 的 video_id，供后续 Remix 使用
      const status: VideoJobStatus = {
        id: videoId,
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
        throw new Error('生成超时（5 分钟未返回），请稍后重试');
      }
      throw error;
    }
  }
}

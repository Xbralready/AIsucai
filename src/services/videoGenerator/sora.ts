/**
 * Sora 2 视频生成适配器
 * 迁移自 AI素材营销制造 项目的 soraVideoGeneration.ts
 */

import type {
  VideoGeneratorBackend,
  GenerateVideoParams,
  VideoJobStatus,
} from './interface';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const SORA_API_KEY = import.meta.env.VITE_SORA_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
const SORA_API_BASE = import.meta.env.VITE_SORA_API_BASE || 'https://api.openai.com/v1';

/** 将 aspectRatio 转换为 Sora size 参数 */
function toSoraSize(ratio: '9:16' | '16:9' | '1:1'): string {
  switch (ratio) {
    case '9:16': return '720x1280';
    case '16:9': return '1280x720';
    case '1:1': return '1080x1080';
    default: return '720x1280';
  }
}

/** 将秒数转为 Sora 支持的时长（4/8/12） */
function toSoraDuration(seconds: number): string {
  if (seconds <= 6) return '4';
  if (seconds <= 10) return '8';
  return '12';
}

export class SoraBackend implements VideoGeneratorBackend {
  name = 'Sora 2';

  async generateVideo(params: GenerateVideoParams): Promise<VideoJobStatus> {
    if (!API_BASE && !SORA_API_KEY) {
      throw new Error('请配置 VITE_OPENAI_API_KEY');
    }

    const requestBody: Record<string, unknown> = {
      model: 'sora-2',
      prompt: params.prompt,
      size: toSoraSize(params.aspectRatio),
      seconds: toSoraDuration(params.duration),
    };

    const url = API_BASE ? `${API_BASE}/api/sora/videos` : `${SORA_API_BASE}/videos`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!API_BASE) {
      headers['Authorization'] = `Bearer ${SORA_API_KEY}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Sora API 错误: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: 'queued',
      progress: 0,
    };
  }

  async getJobStatus(jobId: string): Promise<VideoJobStatus> {
    const url = API_BASE ? `${API_BASE}/api/sora/videos/${jobId}` : `${SORA_API_BASE}/videos/${jobId}`;
    const headers: Record<string, string> = {};
    if (!API_BASE) {
      headers['Authorization'] = `Bearer ${SORA_API_KEY}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Sora API 错误: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // 如果已完成，获取视频内容
    if (data.status === 'completed') {
      const videoUrl = await this.getVideoContentUrl(jobId);
      return {
        id: data.id,
        status: 'completed',
        progress: 100,
        videoUrl,
      };
    }

    return {
      id: data.id,
      status: data.status === 'in_progress' ? 'processing' : data.status,
      progress: data.progress || 0,
      error: data.error?.message,
    };
  }

  async waitForCompletion(
    jobId: string,
    onProgress?: (status: VideoJobStatus) => void
  ): Promise<VideoJobStatus> {
    const pollInterval = 10000; // 10s
    const timeout = 600000;    // 10min
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getJobStatus(jobId);
      onProgress?.(status);

      if (status.status === 'completed') return status;
      if (status.status === 'failed') {
        throw new Error(`视频生成失败: ${status.error || '未知错误'}`);
      }

      await new Promise(r => setTimeout(r, pollInterval));
    }

    throw new Error('视频生成超时');
  }

  private async getVideoContentUrl(videoId: string): Promise<string> {
    const url = API_BASE
      ? `${API_BASE}/api/sora/videos/${videoId}/content`
      : `${SORA_API_BASE}/videos/${videoId}/content`;
    const headers: Record<string, string> = {};
    if (!API_BASE) {
      headers['Authorization'] = `Bearer ${SORA_API_KEY}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`获取视频内容失败: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
}

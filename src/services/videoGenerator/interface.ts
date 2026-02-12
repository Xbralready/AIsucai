/**
 * 视频生成抽象接口
 * 所有视频生成模型（Sora, Veo, Creatify 等）都实现此接口
 */

export interface GenerateVideoParams {
  prompt: string;
  duration: number;         // 秒
  aspectRatio: '9:16' | '16:9' | '1:1';
  language?: string;        // 脚本语言（es/en/zh/pt），Creatify 用于匹配语音
  imageUrl?: string;        // 可选的起始图片（图生视频）
  generateAudio?: boolean;  // 是否生成音频（默认 false，省钱）
  resolution?: '720p' | '1080p';  // 分辨率（默认 720p）
}

export interface VideoJobStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;         // 0-100
  videoUrl?: string;
  error?: string;
}

export interface VideoGeneratorBackend {
  name: string;
  /** 提交视频生成任务 */
  generateVideo(params: GenerateVideoParams): Promise<VideoJobStatus>;
  /** 查询任务状态 */
  getJobStatus(jobId: string): Promise<VideoJobStatus>;
  /** 等待任务完成 */
  waitForCompletion(
    jobId: string,
    onProgress?: (status: VideoJobStatus) => void
  ): Promise<VideoJobStatus>;
}

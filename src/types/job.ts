/** 单个视频生成任务 */
export interface VideoTask {
  id: string;
  scriptId: string;
  typeId: string;
  typeName: string;
  status: 'pending' | 'queued' | 'generating' | 'completed' | 'failed';
  progress: number;        // 0-100
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  backend: string;         // 使用的模型名称
  startedAt?: number;
  completedAt?: number;
}

/** 批量生成任务 */
export interface BatchJob {
  id: string;
  productName: string;
  tasks: VideoTask[];
  status: 'preparing' | 'generating' | 'completed' | 'partial' | 'failed';
  progress: number;        // 0-100
  createdAt: number;
  completedAt?: number;
}

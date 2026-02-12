/**
 * 批量任务管理器
 * 管理视频生成任务的提交、轮询、状态聚合
 * 支持按视频类型智能选择最佳生成模型
 */

import type { VideoScript } from '../types/script';
import type { BatchJob, VideoTask } from '../types/job';
import type { VideoModel } from '../types/recommendation';
import { getBackend } from './videoGenerator';

/** 生成选项（从 GenerationPlan 传入） */
export interface BatchGenerateOptions {
  aspectRatio: '9:16' | '16:9' | '1:1';
  videoModel: VideoModel;            // 用户选择的视频模型
  generateAudio: boolean;
  resolution: '720p' | '1080p';
  language: string;
  productImages: string[];  // 产品图片 URL 列表
}

/** 从脚本列表创建批量任务（使用用户选择的模型） */
export function createBatchJob(
  productName: string,
  scripts: VideoScript[],
  videoModel: VideoModel,
): BatchJob {
  const backend = getBackend(videoModel);
  const tasks: VideoTask[] = scripts.map((script) => ({
    id: `task_${script.id}`,
    scriptId: script.id,
    typeId: script.typeId,
    typeName: script.typeName,
    status: 'pending',
    progress: 0,
    backend: backend.name,
  }));

  return {
    id: `batch_${Date.now()}`,
    productName,
    tasks,
    status: 'preparing',
    progress: 0,
    createdAt: Date.now(),
  };
}

/** 执行批量生成（每个任务使用各自分配的模型） */
export async function executeBatchJob(
  job: BatchJob,
  scripts: VideoScript[],
  options: BatchGenerateOptions,
  onUpdate: (job: BatchJob) => void
): Promise<BatchJob> {
  const updatedJob: BatchJob = { ...job, status: 'generating' };
  onUpdate(updatedJob);

  const scriptMap = new Map(scripts.map(s => [s.id, s]));

  // 逐个提交任务（避免 rate limit）
  for (let i = 0; i < updatedJob.tasks.length; i++) {
    const task = updatedJob.tasks[i];
    const script = scriptMap.get(task.scriptId);

    if (!script) {
      task.status = 'failed';
      task.error = '找不到对应脚本';
      updateJobProgress(updatedJob);
      onUpdate({ ...updatedJob });
      continue;
    }

    // 选择 prompt：veoPrompt（口播）优先，否则用 soraPrompt（纯画面）
    const hasVeoLipsync = script.veoPrompt && options.videoModel === 'veo';
    const prompt = hasVeoLipsync ? script.veoPrompt : script.soraPrompt;

    if (!prompt) {
      task.status = 'failed';
      task.error = '缺少视频生成提示词';
      updateJobProgress(updatedJob);
      onUpdate({ ...updatedJob });
      continue;
    }

    // 使用用户选择的模型
    const backend = getBackend(options.videoModel);

    try {
      task.status = 'queued';
      task.startedAt = Date.now();
      onUpdate({ ...updatedJob });

      // Veo 口播必须开启音频（lip-sync 需要语音）
      const forceAudio = hasVeoLipsync ? true : options.generateAudio;

      // 所有类型都传产品图 → image-to-video 模式
      // 优先用公网 URL（更稳定），如果没有则用 data URL（base64）
      const productImageUrl = options.productImages.length > 0
        ? options.productImages.find(img => img.startsWith('http')) || options.productImages[0]
        : undefined;

      // 提交生成任务（传入完整选项）
      const jobStatus = await backend.generateVideo({
        prompt,
        duration: script.duration,
        aspectRatio: options.aspectRatio,
        generateAudio: forceAudio,
        resolution: options.resolution,
        language: options.language,
        imageUrl: productImageUrl,
      });

      task.status = 'generating';
      onUpdate({ ...updatedJob });

      // 等待完成
      const result = await backend.waitForCompletion(
        jobStatus.id,
        (status) => {
          task.progress = status.progress;
          updateJobProgress(updatedJob);
          onUpdate({ ...updatedJob });
        }
      );

      task.status = 'completed';
      task.progress = 100;
      task.videoUrl = result.videoUrl;
      task.completedAt = Date.now();
    } catch (error) {
      task.status = 'failed';
      task.error = String(error);
    }

    updateJobProgress(updatedJob);
    onUpdate({ ...updatedJob });
  }

  // 计算最终状态
  const allCompleted = updatedJob.tasks.every(t => t.status === 'completed');
  const allFailed = updatedJob.tasks.every(t => t.status === 'failed');

  updatedJob.status = allCompleted ? 'completed' : allFailed ? 'failed' : 'partial';
  updatedJob.completedAt = Date.now();
  onUpdate({ ...updatedJob });

  return updatedJob;
}

function updateJobProgress(job: BatchJob) {
  const total = job.tasks.length;
  if (total === 0) {
    job.progress = 0;
    return;
  }
  const completed = job.tasks.filter(t => t.status === 'completed').length;
  const inProgress = job.tasks.filter(t => t.status === 'generating');
  const inProgressAvg = inProgress.reduce((sum, t) => sum + t.progress, 0) / (total * 100);
  job.progress = Math.round(((completed / total) + inProgressAvg) * 100);
}

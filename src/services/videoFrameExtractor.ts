/**
 * 从视频中提取关键帧
 * 用于发送给 GPT-4 Vision 进行分析
 */

export interface ExtractedFrame {
  timestamp: number;
  dataUrl: string;
}

/**
 * 从视频 URL 或 File 中提取指定数量的关键帧
 */
export async function extractFrames(
  source: string | File,
  frameCount: number = 8
): Promise<ExtractedFrame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;

    // 设置视频源
    if (typeof source === 'string') {
      video.src = source;
    } else {
      video.src = URL.createObjectURL(source);
    }

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      const frames: ExtractedFrame[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }

      // 设置 canvas 尺寸（缩小以减少 API 调用大小）
      const maxWidth = 512;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      // 计算要提取的时间点
      const timestamps: number[] = [];
      for (let i = 0; i < frameCount; i++) {
        // 均匀分布，但避免第一帧（可能是黑屏）
        const t = (duration * (i + 0.5)) / frameCount;
        timestamps.push(t);
      }

      // 逐帧提取
      for (const timestamp of timestamps) {
        try {
          const frame = await extractFrameAtTime(video, canvas, ctx, timestamp);
          frames.push(frame);
        } catch (e) {
          console.warn(`Failed to extract frame at ${timestamp}s`, e);
        }
      }

      // 清理
      if (typeof source !== 'string') {
        URL.revokeObjectURL(video.src);
      }

      resolve(frames);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
  });
}

/**
 * 在指定时间点提取一帧
 */
function extractFrameAtTime(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  timestamp: number
): Promise<ExtractedFrame> {
  return new Promise((resolve, reject) => {
    video.currentTime = timestamp;

    video.onseeked = () => {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve({
          timestamp,
          dataUrl,
        });
      } catch (e) {
        reject(e);
      }
    };

    video.onerror = () => {
      reject(new Error(`Failed to seek to ${timestamp}s`));
    };
  });
}

/**
 * 获取视频元数据
 */
export async function getVideoMetadata(
  source: string | File
): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;

    if (typeof source === 'string') {
      video.src = source;
    } else {
      video.src = URL.createObjectURL(source);
    }

    video.onloadedmetadata = () => {
      const result = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      };

      if (typeof source !== 'string') {
        URL.revokeObjectURL(video.src);
      }

      resolve(result);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };
  });
}

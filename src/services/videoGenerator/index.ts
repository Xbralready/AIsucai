/**
 * 视频生成器注册中心
 * 可插拔的模型管理
 */

import type { VideoGeneratorBackend } from './interface';
import { SoraBackend } from './sora';
import { VeoBackend } from './veo';
import { CreatifyBackend } from './creatify';

export type { VideoGeneratorBackend, GenerateVideoParams, VideoJobStatus } from './interface';

const backends = new Map<string, VideoGeneratorBackend>();

// 注册所有模型
backends.set('sora', new SoraBackend());
backends.set('veo', new VeoBackend());
backends.set('creatify', new CreatifyBackend());

/** 获取指定模型 */
export function getBackend(name: string): VideoGeneratorBackend {
  const backend = backends.get(name);
  if (!backend) {
    throw new Error(`未知的视频生成模型: ${name}。可用: ${Array.from(backends.keys()).join(', ')}`);
  }
  return backend;
}

/** 注册新模型 */
export function registerBackend(name: string, backend: VideoGeneratorBackend) {
  backends.set(name, backend);
}

/** 列出所有可用模型 */
export function listBackends(): string[] {
  return Array.from(backends.keys());
}

/** 获取默认模型 */
export function getDefaultBackend(): VideoGeneratorBackend {
  return getBackend('sora');
}

/**
 * 根据视频类型智能选择最佳模型
 *
 * 优先级逻辑：
 * 1. 口播/talking-head 类 → 优先 Veo 3.1（lip-sync）
 * 2. 高质量场景类 → 优先 Veo 3.1
 * 3. 其他 → Sora 2
 *
 * 降级逻辑：Veo > Sora > Creatify
 */
export function selectBestBackend(typeId: string): VideoGeneratorBackend {
  const useProxy = !!import.meta.env.VITE_API_BASE_URL;
  const hasCreatify = useProxy || !!import.meta.env.VITE_CREATIFY_API_ID;
  const hasVeo = useProxy || !!import.meta.env.VITE_FAL_API_KEY;
  const hasSora = useProxy || !!import.meta.env.VITE_OPENAI_API_KEY;

  // 口播/talking-head 类型 → 优先 Veo（lip-sync 能力）
  const talkingHeadTypes = [
    'ugc-testimonial', 'reaction-review', 'faq-objection',
    'problem-solution', 'listicle', 'myth-busting',
    'social-proof', 'emotional-hook', 'quick-hack',
    'how-to-tutorial', 'countdown-reveal', 'feature-highlight',
  ];
  if (talkingHeadTypes.includes(typeId) && hasVeo) {
    return getBackend('veo');
  }

  // 高质量场景类型 → 优先 Veo
  const sceneTypes = [
    'story-narrative', 'day-in-life', 'unboxing-reveal',
    'before-after', 'challenge-trend',
  ];
  if (sceneTypes.includes(typeId) && hasVeo) {
    return getBackend('veo');
  }

  // 降级：Veo > Sora > Creatify
  if (hasVeo) return getBackend('veo');
  if (hasSora) return getBackend('sora');
  if (hasCreatify) return getBackend('creatify');

  throw new Error('没有可用的视频生成模型，请在 .env 中配置至少一个 API Key');
}

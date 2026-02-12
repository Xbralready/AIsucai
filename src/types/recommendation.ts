import type { ProductionFormat } from './videoType';

/** AI 推荐的视频类型方案 */
export interface TypeRecommendation {
  typeId: string;
  typeName: string;
  typeNameZh: string;
  score: number;           // 推荐分数 0-1
  reason: string;          // 推荐理由
  suggestedCount: number;  // 建议生成数量
  suggestedDuration: number;
  suggestedFormat: ProductionFormat;
  estimatedCost: number;   // 预估成本 USD
}

/** 支持的视频生成模型 */
export type VideoModel = 'veo' | 'sora';

/** 完整的生成计划 */
export interface GenerationPlan {
  productId: string;
  recommendations: TypeRecommendation[];
  language: string;
  aspectRatio: '9:16' | '16:9' | '1:1';
  videoModel: VideoModel;            // 用户选择的视频生成模型
  generateAudio: boolean;            // 是否生成音频（关闭可省 33% Veo 成本）
  resolution: '720p' | '1080p';      // 视频分辨率
  totalEstimatedCost: number;
  totalVideoCount: number;
}

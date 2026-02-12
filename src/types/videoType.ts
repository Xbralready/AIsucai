/** 视频创意类型 */
export interface VideoCreativeType {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  /** 适合的行业/品类 */
  bestFor: string[];
  /** 推荐的制作格式 */
  suggestedFormats: ProductionFormat[];
  /** 示例钩子 */
  exampleHooks: string[];
  /** 推荐时长（秒） */
  suggestedDuration: number;
}

/** 视频制作格式 */
export type ProductionFormat =
  | 'talking-head'      // 真人/数字人口播
  | 'screen-recording'  // 屏幕录制
  | 'kinetic-text'      // 动态文字
  | 'slideshow'         // 图片轮播
  | 'live-action'       // 实拍场景
  | 'animation'         // 动画
  | 'mixed-media'       // 混合媒体
  | 'split-screen'      // 分屏对比
  | 'ai-generated';     // AI 生成画面

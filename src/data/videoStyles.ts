/** 视频风格预设 — 两个模式（从零生成 / 复刻爆款）共享 */

export type VideoStyleKey =
  | 'auto'
  | 'energetic'
  | 'professional'
  | 'casual'
  | 'warm'
  | 'inspirational'
  | 'persuasive'
  | 'minimal';

export interface VideoStyleOption {
  value: VideoStyleKey;
  labelZh: string;
  labelEn: string;
  description: string;
  /** 注入到 GPT prompt 中的风格指令 */
  promptDirective: string;
}

export const VIDEO_STYLES: VideoStyleOption[] = [
  {
    value: 'auto',
    labelZh: '自动匹配',
    labelEn: 'Auto',
    description: 'AI 根据产品和目标用户自动选择最佳风格',
    promptDirective: '请根据产品类型、目标用户和投放平台，自动选择最适合的语气和视觉风格。',
  },
  {
    value: 'energetic',
    labelZh: '活力热情',
    labelEn: 'Energetic',
    description: '快节奏、高能量、年轻化',
    promptDirective: '风格：活力热情。语气兴奋有感染力，节奏快，用感叹句和反问句，适合年轻受众。视觉上色彩鲜明、动感强、转场快。',
  },
  {
    value: 'professional',
    labelZh: '专业正式',
    labelEn: 'Professional',
    description: '商务感、权威、信赖',
    promptDirective: '风格：专业正式。语气权威可信，用数据和事实说话，措辞严谨。视觉上干净利落、配色沉稳、字体正式。',
  },
  {
    value: 'casual',
    labelZh: '轻松对话',
    labelEn: 'Casual',
    description: '像朋友聊天、亲近感',
    promptDirective: '风格：轻松对话。语气像朋友聊天，口语化，用日常用语和缩写。视觉上自然随意、生活化场景、暖色调。',
  },
  {
    value: 'warm',
    labelZh: '友好温暖',
    labelEn: 'Warm',
    description: '温情、关怀、治愈',
    promptDirective: '风格：友好温暖。语气温柔有关怀感，用"我们""一起"等词，传递温暖和安全感。视觉上柔光、暖色、慢节奏。',
  },
  {
    value: 'inspirational',
    labelZh: '励志鼓舞',
    labelEn: 'Inspirational',
    description: '激励人心、正能量',
    promptDirective: '风格：励志鼓舞。语气积极向上，用激励性语言，讲述改变和成长。视觉上大气、光感强、配乐振奋。',
  },
  {
    value: 'persuasive',
    labelZh: '直接说服',
    labelEn: 'Persuasive',
    description: '强 CTA、紧迫感、限时',
    promptDirective: '风格：直接说服。语气果断有紧迫感，强调限时优惠和稀缺性，CTA 明确有力。视觉上对比强、重点突出、倒计时感。',
  },
  {
    value: 'minimal',
    labelZh: '极简高级',
    labelEn: 'Minimal',
    description: '少即是多、留白、质感',
    promptDirective: '风格：极简高级。语气克制优雅，用短句和留白，不过度推销。视觉上大量留白、单色调、细节质感、慢镜头。',
  },
];

/** 根据 key 获取风格定义 */
export function getStyleByKey(key: VideoStyleKey): VideoStyleOption {
  return VIDEO_STYLES.find(s => s.value === key) || VIDEO_STYLES[0];
}

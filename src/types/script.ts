/** 单条视频脚本 */
export interface VideoScript {
  id: string;
  typeId: string;          // 对应的视频创意类型 ID
  typeName: string;
  title: string;
  duration: number;        // 目标时长（秒）
  language: string;
  hook: string;            // 开场钩子
  body: string;            // 主体内容
  cta: string;             // 行动号召
  fullScript: string;      // 完整脚本文本（口播台词）
  visualDirection: string; // 画面方向描述
  soraPrompt?: string;     // Sora/Veo 纯画面提示词（英文）
  veoPrompt?: string;      // Veo 口播提示词（英文，带 lip-sync 格式）
}

/** 批量脚本生成结果 */
export interface BatchScripts {
  productName: string;
  scripts: VideoScript[];
  generatedAt: number;
}

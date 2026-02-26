/**
 * 视频脚本生成服务（复刻爆款流程）
 * 根据产品映射结构生成 Sora2 视频脚本
 * 通过 callGPT 代理（支持后端代理 + 直连两种模式）
 */

import type { ProductFittedStructure } from '../types/cloneProductMapping';
import { callGPT } from './gptClient';
import { mockVideoScript } from '../mock/videoScript';

/**
 * 视频脚本类型定义
 */
export interface VideoScript {
  title: string;
  total_duration: number;
  character?: {
    description: string;
    name?: string;
    age?: string;
    gender?: string;
    appearance?: string;
    clothing?: string;
  };
  style: {
    visual_tone: string;
    color_palette: string[];
    camera_style: string;
  };
  scenes: SceneScript[];
  global_audio: {
    bgm_style: string;
    bgm_tempo: string;
    voice_style: string;
  };
}

export interface SceneScript {
  scene_id: string;
  segment_type: string;
  duration: number;
  time_range: { start: number; end: number };
  sora_prompt: string;
  visual: {
    setting: string;
    subject: string;
    action: string;
    camera_movement: string;
    lighting: string;
  };
  copy: {
    voiceover: string;
    subtitle: string;
    text_overlay?: string;
  };
  transition: {
    type: string;
    duration: number;
  };
}

// 语言配置
const LANGUAGE_CONFIG: Record<string, { name: string; instruction: string }> = {
  zh: { name: '中文', instruction: '所有旁白、字幕、对白必须使用中文' },
  en: { name: 'English', instruction: 'All voiceover, subtitles, and dialogue must be in English' },
  es: { name: 'Español', instruction: 'Todo el narración, subtítulos y diálogos deben estar en español' },
  pt: { name: 'Português', instruction: 'Toda a narração, legendas e diálogos devem estar em português' },
  ja: { name: '日本語', instruction: 'すべてのナレーション、字幕、セリフは日本語で' },
  ko: { name: '한국어', instruction: '모든 내레이션, 자막, 대사는 한국어로' },
};

/**
 * 生成视频脚本
 */
export async function generateVideoScript(
  fittedStructure: ProductFittedStructure,
  options?: {
    style?: 'professional' | 'casual' | 'energetic' | 'minimal';
    duration?: number;
    language?: string;
  },
  onProgress?: (stage: string) => void
): Promise<VideoScript> {
  onProgress?.('正在生成视频脚本...');

  const style = options?.style || 'professional';
  const targetDuration = options?.duration || 30;
  const language = options?.language || 'zh';
  const langConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['zh'];

  const systemPrompt = `你是 Sora2 视频脚本专家。根据产品信息生成符合 Sora2 官方格式的视频脚本。

⚠️ 重要时长限制：Sora2 API 只支持 4、8、12 秒三种时长！
每个场景的 duration 必须是 4、8 或 12（整数），不能是其他值！

⚠️ 角色一致性（极其重要）：
- 必须先定义主角的详细外貌特征（性别、年龄、发型、发色、肤色、面部特征、体型、服装）
- 每个 sora_prompt 的开头都必须包含完全相同的角色描述文本
- 这样才能确保 Sora 生成的人物在各场景中保持一致

sora_prompt 必须使用以下格式：
"""
[角色描述 - 每个场景必须完全相同]: A [age] year old [gender] with [hair description], [skin tone], [facial features], wearing [detailed clothing description].

[场景环境描述]

Cinematography:
Camera shot: [镜头类型]
Mood: [画面氛围]

Actions:
- [动作描述]

Lighting: [光线描述]
Color palette: [颜色]
"""

返回 JSON：
{
  "title": "脚本标题",
  "total_duration": 28,
  "character": {
    "description": "详细的角色外貌描述（英文），这段描述会被复制到每个 sora_prompt 开头",
    "name": "角色名称",
    "age": "年龄",
    "gender": "性别",
    "appearance": "外貌特征",
    "clothing": "服装描述"
  },
  "style": { "visual_tone": "风格", "color_palette": ["#hex1","#hex2","#hex3"], "camera_style": "镜头风格" },
  "scenes": [{
    "scene_id": "scene_1",
    "segment_type": "hook",
    "duration": 4,
    "time_range": { "start": 0, "end": 4 },
    "sora_prompt": "必须以 character.description 开头，然后是场景描述",
    "visual": { "setting": "场景", "subject": "主体", "action": "动作", "camera_movement": "镜头", "lighting": "光线" },
    "copy": { "voiceover": "旁白", "subtitle": "字幕" },
    "transition": { "type": "cut", "duration": 0.5 }
  }],
  "global_audio": { "bgm_style": "音乐风格", "bgm_tempo": "medium", "voice_style": "配音风格" }
}

重要：
1. 每个场景的 duration 必须是 4、8 或 12 秒（Sora API 硬性限制）
2. 每个 sora_prompt 必须以相同的角色描述开头，确保人物一致性
3. 角色描述必须非常具体：发型颜色、肤色、五官特征、具体服装颜色款式
4. sora_prompt 必须用英文（Sora 模型要求）
5. voiceover、subtitle 等文案内容使用指定的语言
6. 只返回 JSON，不要有其他内容`;

  const simplifiedStructure = {
    product: fittedStructure.product_context,
    segments: fittedStructure.mapped_structure.map(s => ({
      type: s.type,
      slot: s.product_mapping.slot,
      direction: s.product_mapping.example_direction,
      time_ratio: s.structure.time_ratio,
    })),
  };

  const userContent = `产品: ${fittedStructure.product_context.product_name}
类别: ${fittedStructure.product_context.category}
卖点: ${fittedStructure.product_context.core_benefit.join('、')}
风格: ${style}
目标总时长: 约${targetDuration}秒（由多个 4/8/12 秒场景组合）
风险敏感: ${fittedStructure.product_context.risk_sensitive ? '是' : '否'}

⚠️ 语言要求: ${langConfig.name}
${langConfig.instruction}
（注意：sora_prompt 保持英文，但 voiceover、subtitle、text_overlay 使用 ${langConfig.name}）

结构:
${JSON.stringify(simplifiedStructure.segments, null, 2)}

为每个 segment 生成一个 scene，包含详细的 sora_prompt。
⚠️ 每个场景的 duration 必须是 4、8 或 12 秒！`;

  try {
    return await callGPT<VideoScript>({
      systemPrompt,
      userContent,
      maxTokens: 4096,
      temperature: 0.5,
      timeoutMs: 60000,
    });
  } catch (error) {
    console.warn('generateVideoScript: API 调用失败，回退到 mock 数据', error);
    onProgress?.('API 不可用，使用演示数据...');
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockVideoScript;
  }
}

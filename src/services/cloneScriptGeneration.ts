/**
 * 视频脚本生成服务（复刻爆款流程）
 * 根据产品映射结构生成 Sora2 视频脚本
 * 通过 callGPT 代理（支持后端代理 + 直连两种模式）
 */

import type { ProductFittedStructure } from '../types/cloneProductMapping';
import { callGPT } from './gptClient';
import { mockVideoScript } from '../mock/videoScript';
import { getStyleByKey } from '../data/videoStyles';
import type { VideoStyleKey } from '../data/videoStyles';

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
    style?: VideoStyleKey;
    duration?: number;
    language?: string;
  },
  onProgress?: (stage: string) => void
): Promise<VideoScript> {
  onProgress?.('正在生成视频脚本...');

  const styleOption = getStyleByKey(options?.style || 'auto');
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
风格: ${styleOption.labelZh}
${styleOption.promptDirective}
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

// ── 批量脚本变体 ──

export interface BatchScriptResult {
  label: string;
  script: VideoScript;
}

/**
 * 批量生成多个脚本变体
 * 基于同一个产品映射结构，生成 N 个差异化脚本（不同 Hook/角度/CTA/角色）
 */
export async function generateBatchVideoScripts(
  fittedStructure: ProductFittedStructure,
  options: {
    style?: VideoStyleKey;
    duration?: number;
    language?: string;
    count: number;
  },
  onProgress?: (stage: string) => void
): Promise<BatchScriptResult[]> {
  const count = options.count;
  const batchSize = 5;
  const batches = Math.ceil(count / batchSize);
  const allResults: BatchScriptResult[] = [];

  for (let batch = 0; batch < batches; batch++) {
    const countInBatch = Math.min(batchSize, count - allResults.length);
    onProgress?.(`正在生成第 ${batch + 1}/${batches} 批脚本 (${countInBatch} 套)...`);

    const results = await generateBatchCall(
      fittedStructure,
      { ...options, count: countInBatch },
      onProgress
    );
    allResults.push(...results);
  }

  return allResults;
}

/**
 * 单次 GPT 调用生成 N 个脚本变体
 */
async function generateBatchCall(
  fittedStructure: ProductFittedStructure,
  options: {
    style?: VideoStyleKey;
    duration?: number;
    language?: string;
    count: number;
  },
  onProgress?: (stage: string) => void
): Promise<BatchScriptResult[]> {
  const styleOption = getStyleByKey(options.style || 'auto');
  const targetDuration = options.duration || 30;
  const language = options.language || 'zh';
  const langConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['zh'];
  const count = options.count;

  const systemPrompt = `你是 Sora2 视频脚本专家。你需要一次性生成 ${count} 个不同的视频脚本变体。

每个变体必须基于相同的产品映射结构，但在以下维度上有明显差异：
1. **Hook 手法**：每个变体使用不同的开场策略（痛点提问、惊人数据、情境代入、反转开场、直接利益等）
2. **脚本角度**：侧重不同的产品卖点或使用场景
3. **CTA 风格**：不同的行动号召方式（紧迫感、好奇心、社交证明、限时优惠等）
4. **角色差异**：每个变体可以有不同的主角设定（不同性别、年龄、场景）
5. **语气风格**：轻松幽默、专业权威、情感共鸣、生活化等

⚠️ 重要时长限制：Sora2 API 只支持 4、8、12 秒三种时长！
每个场景的 duration 必须是 4、8 或 12（整数），不能是其他值！

⚠️ 角色一致性（每个变体内部极其重要）：
- 每个变体内部，必须先定义主角的详细外貌特征
- 同一变体内每个 sora_prompt 的开头都必须包含完全相同的角色描述文本
- 不同变体之间角色可以不同

sora_prompt 格式：
"""
[角色描述]: A [age] year old [gender] with [hair], [skin tone], [features], wearing [clothing].

[场景环境描述]

Cinematography:
Camera shot: [镜头类型]
Mood: [画面氛围]

Actions:
- [动作描述]

Lighting: [光线描述]
Color palette: [颜色]
"""

返回 JSON 数组：
[
  {
    "label": "变体简要描述（如：情感共鸣+紧迫CTA）",
    "script": {
      "title": "脚本标题",
      "total_duration": 28,
      "character": {
        "description": "角色外貌描述（英文）",
        "name": "角色名称",
        "age": "年龄",
        "gender": "性别",
        "appearance": "外貌特征",
        "clothing": "服装描述"
      },
      "style": { "visual_tone": "风格", "color_palette": ["#hex1","#hex2","#hex3"], "camera_style": "镜头风格" },
      "scenes": [...],
      "global_audio": { "bgm_style": "音乐风格", "bgm_tempo": "medium", "voice_style": "配音风格" }
    }
  },
  ...
]

重要：
1. 必须返回恰好 ${count} 个变体
2. 每个场景的 duration 必须是 4、8 或 12 秒
3. 每个变体内部角色描述保持一致，不同变体之间需要有明显差异
4. sora_prompt 用英文，voiceover/subtitle 用指定语言
5. 只返回 JSON 数组，不要有其他内容
6. label 用中文，简明描述该变体的创意策略`;

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
风格: ${styleOption.labelZh}
${styleOption.promptDirective}
目标总时长: 约${targetDuration}秒（由多个 4/8/12 秒场景组合）
风险敏感: ${fittedStructure.product_context.risk_sensitive ? '是' : '否'}

⚠️ 语言要求: ${langConfig.name}
${langConfig.instruction}
（注意：sora_prompt 保持英文，但 voiceover、subtitle、text_overlay 使用 ${langConfig.name}）

结构:
${JSON.stringify(simplifiedStructure.segments, null, 2)}

请为以上结构生成 ${count} 个不同的脚本变体，每个变体内为每个 segment 生成一个 scene。
⚠️ 每个场景的 duration 必须是 4、8 或 12 秒！`;

  try {
    return await callGPT<BatchScriptResult[]>({
      systemPrompt,
      userContent,
      maxTokens: count * 3000,
      temperature: 0.8,
      timeoutMs: count * 30000,
    });
  } catch (error) {
    console.warn('generateBatchVideoScripts: API 调用失败，回退到 mock 数据', error);
    onProgress?.('API 不可用，使用演示数据...');
    await new Promise(resolve => setTimeout(resolve, 800));
    const hookStyles = ['痛点提问+紧迫CTA', '情境代入+情感共鸣', '数据冲击+理性说服', '反转开场+好奇心', '生活场景+轻松口吻'];
    return Array.from({ length: count }, (_, i) => ({
      label: hookStyles[i % hookStyles.length],
      script: { ...mockVideoScript, title: `${mockVideoScript.title} - 变体${i + 1}` },
    }));
  }
}

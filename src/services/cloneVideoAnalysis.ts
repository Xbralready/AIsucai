/**
 * 视频分析服务（复刻爆款流程）
 * 使用 GPT Vision 分析视频帧，识别结构模式
 * 通过 callGPT 代理（支持后端代理 + 直连两种模式）
 */

import type { AnalysisResult } from '../types/analysis';
import { callGPT, type ImageInput } from './gptClient';
import { extractFrames, getVideoMetadata } from './videoFrameExtractor';

/**
 * 分析视频并返回结构化结果
 */
export async function analyzeVideo(
  source: string | File,
  onProgress?: (stage: string) => void
): Promise<AnalysisResult> {
  // 1. 获取视频元数据
  onProgress?.('正在读取视频信息...');
  const metadata = await getVideoMetadata(source);

  // 2. 提取关键帧（5 帧）
  onProgress?.('正在提取视频关键帧...');
  const frames = await extractFrames(source, 5);

  // 3. 构建多模态输入
  onProgress?.('正在分析视频结构...');

  const images: ImageInput[] = frames.map(f => ({ dataUrl: f.dataUrl }));

  const userContent = `请分析这个短视频广告。视频时长 ${metadata.duration.toFixed(1)} 秒，分辨率 ${metadata.width}x${metadata.height}。

以下是从视频中均匀提取的 ${frames.length} 帧关键画面（按时间顺序）：
${frames.map((f, i) => `第 ${i + 1} 帧 (${f.timestamp.toFixed(1)}s)`).join('\n')}

请根据以上画面分析视频结构，返回符合 JSON Schema 的分析结果。只返回 JSON，不要有其他文字。`;

  const systemPrompt = `你是一个专业的短视频广告分析专家。你需要分析用户提供的视频帧，识别视频的结构模式、各个片段的功能、以及可复刻的要素。

你必须返回一个严格符合以下 JSON Schema 的结果：

{
  "_schema": { "version": "v0.1", "status": "exploratory", "note": "Analysis result" },
  "video_meta": {
    "duration_seconds": number,
    "resolution": "宽x高",
    "orientation": "vertical" | "horizontal" | "square"
  },
  "pattern": {
    "pattern_id": "模式ID如 dialogue_ugc_with_proof",
    "pattern_name": "模式名称如 对话式UGC口播+证明叠层",
    "core_formula": "核心公式如 旁人提问 → 主角回答 → 产品演示 → 品牌收尾",
    "confidence": 0-1的置信度
  },
  "segments": [
    {
      "segment_id": "seg_1",
      "type": "hook" | "explain" | "proof" | "end_card" | "transition",
      "structure": {
        "function": "功能描述如 hook_question",
        "time": { "start": 秒数, "end": 秒数 },
        "time_ratio": { "start": 0-1, "end": 0-1 },
        "variable_slot": "可变槽位名称或null"
      },
      "evidence": {
        "scene_observation": "场景观察",
        "camera_observation": "镜头观察或null",
        "performance_observation": "表演观察或null",
        "voiceover_raw": "画外音原文或null",
        "subtitle_main_raw": "主字幕原文或null",
        "subtitle_secondary_raw": "次字幕原文或null",
        "overlay_detected": "检测到的叠层或null"
      },
      "insights": [
        { "point": "洞察点", "explanation": "解释", "confidence": 0-1 }
      ]
    }
  ],
  "layers": {
    "_type": "observed_implementation",
    "_note": "For analysis explanation only",
    "confidence": 0-1,
    "items": [
      {
        "layer_id": "layer_xxx",
        "name": "图层名称",
        "position": "位置如 top_center",
        "style": { "color": "#FFFFFF", "size": "small" },
        "appears_in": ["seg_1", "seg_2"]
      }
    ]
  },
  "variables": {
    "变量名": {
      "current_value": "当前值",
      "is_example": true,
      "description": "描述",
      "type": "text" | "image" | "image_sequence" | "video_clip",
      "confidence": 0-1
    }
  },
  "audio": {
    "_type": "observed_implementation",
    "bgm": { "type": "类型", "volume": "音量" },
    "voiceover": { "style": "风格", "pace": "节奏" }
  },
  "replicate_checklist": {
    "shooting": ["拍摄清单项1", "拍摄清单项2"],
    "editing": ["剪辑清单项1", "剪辑清单项2"]
  },
  "summary_insights": ["核心洞察1", "核心洞察2"],
  "replicability": {
    "structure_score": 0-1,
    "ip_dependency": 0-1,
    "difficulty": "easy" | "medium" | "hard",
    "overall_score": 0-1
  }
}

重要提示：
1. 仔细观察每一帧的画面内容、字幕、人物表演、叠层效果
2. 识别视频的营销模式（UGC口播、产品展示、对比展示等）
3. 将视频分割成 3-5 个功能片段（hook/explain/proof/trust/end_card）
4. 分析每个片段的作用和可复刻要素
5. 提供具体可执行的复刻清单`;

  const result = await callGPT<AnalysisResult>({
    systemPrompt,
    userContent,
    images,
    maxTokens: 4096,
    temperature: 0.3,
    timeoutMs: 90000,
  });

  // 补充/修正视频元数据
  result.video_meta = {
    duration_seconds: Math.round(metadata.duration * 10) / 10,
    resolution: `${metadata.width}x${metadata.height}`,
    orientation: metadata.height > metadata.width ? 'vertical' :
                 metadata.width > metadata.height ? 'horizontal' : 'square',
  };

  return result;
}

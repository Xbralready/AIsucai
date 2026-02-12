/**
 * 视频类型推荐引擎
 * 根据产品分析结果，推荐最适合的视频创意类型
 */

import type { ProductInfo } from '../types/product';
import type { TypeRecommendation } from '../types/recommendation';
import { VIDEO_CREATIVE_TYPES } from '../data/videoTypes';
import { callGPT } from './gptClient';

export async function recommendVideoTypes(
  product: ProductInfo,
  onProgress?: (msg: string) => void
): Promise<TypeRecommendation[]> {
  onProgress?.('AI 正在分析最佳视频类型...');

  const typeSummary = VIDEO_CREATIVE_TYPES.map(t => ({
    id: t.id,
    name: t.name,
    nameZh: t.nameZh,
    description: t.description,
    bestFor: t.bestFor,
    suggestedDuration: t.suggestedDuration,
  }));

  const systemPrompt = `你是一个视频营销专家。根据产品信息，从给定的 20 种视频创意类型中选出最适合的 3-5 种，并给出推荐理由。

可选的视频类型：
${JSON.stringify(typeSummary, null, 2)}

返回 JSON 数组（按推荐度从高到低排序）：
[
  {
    "typeId": "类型ID",
    "typeName": "英文名",
    "typeNameZh": "中文名",
    "score": 0.95,
    "reason": "推荐理由（中文，1-2句话）",
    "suggestedCount": 2,
    "suggestedDuration": 15,
    "suggestedFormat": "talking-head|kinetic-text|ai-generated|screen-recording|slideshow|live-action|mixed-media|split-screen|animation",
    "estimatedCost": 2.0
  }
]

推荐逻辑：
1. 根据产品类别匹配 bestFor
2. 根据产品卖点判断最适合的创意类型
3. 考虑类型多样性——推荐的类型应覆盖不同方向（情感型 + 功能型 + 社交证明型）
4. 每种类型建议 2 条变体
5. estimatedCost 按单条 $1.5 估算
6. suggestedFormat 根据产品特点选择最合适的制作格式
7. 只返回 JSON 数组，不要其他文字`;

  const userContent = `产品信息：
- 名称：${product.product_name}
- 类别：${product.category}
- 目标用户：${product.target_user}
- 核心痛点：${product.core_problem}
- 核心卖点：${product.core_benefits.join('、')}
- 关键功能：${product.key_features.join('、')}
- 差异化：${product.differentiators.join('、')}
- 风险敏感：${product.risk_sensitive ? '是（金融/医疗类）' : '否'}

请推荐最适合的 3-5 种视频创意类型。`;

  const result = await callGPT<TypeRecommendation[]>({
    systemPrompt,
    userContent,
    maxTokens: 2048,
    temperature: 0.4,
  });

  onProgress?.(`推荐完成，共 ${result.length} 种视频类型`);
  return result;
}

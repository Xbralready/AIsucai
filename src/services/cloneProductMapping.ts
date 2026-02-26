/**
 * 产品映射服务（复刻爆款流程）
 * 将产品信息映射到爆款视频结构
 * 通过 callGPT 代理（支持后端代理 + 直连两种模式）
 */

import type { AnalysisResult } from '../types/analysis';
import type { ProductInfoDraft, ProductFittedStructure } from '../types/cloneProductMapping';
import { callGPT, fetchWebContent } from './gptClient';

/**
 * 从产品 URL 或描述中解析产品信息
 */
export async function parseProductInfo(
  input: { url?: string; description?: string; prefetchedWebContent?: string },
  onProgress?: (stage: string) => void
): Promise<ProductInfoDraft> {
  let webContent = input.prefetchedWebContent || '';

  // 如果有 URL 且没有预抓取内容，才抓取
  if (input.url && !webContent) {
    onProgress?.('正在抓取网页内容...');
    const result = await fetchWebContent(input.url);
    webContent = result.text;
    if (!webContent) {
      onProgress?.('无法抓取网页（CORS），基于 URL 分析...');
    } else {
      onProgress?.('网页内容抓取成功...');
    }
  }

  onProgress?.('正在解析产品信息...');

  const systemPrompt = `你是一个专业的产品分析师。根据用户提供的产品信息（网页内容、URL 或描述），提取并返回结构化的产品信息。

你必须返回一个严格符合以下 JSON Schema 的结果：

{
  "product_name": "产品名称",
  "product_url": "产品URL（如有）",
  "category": "产品类别，如：金融/贷款、电商/购物、教育/学习",
  "target_user": "目标用户描述，如：25-45岁有资金需求的上班族",
  "core_problem": "用户核心痛点，如：传统贷款流程复杂、审批慢",
  "core_benefits": ["核心卖点1", "核心卖点2", "核心卖点3"],
  "key_features": ["关键功能1", "关键功能2"],
  "differentiators": ["差异化优势1", "差异化优势2"],
  "risk_sensitive": true/false (是否为风险敏感产品，如金融、医疗),
  "additional_notes": "其他备注"
}

重要提示：
1. 从网页内容中提取产品名称、核心卖点、目标用户等关键信息
2. 提取最能打动用户的核心卖点（3个以内）
3. 用简洁有力的语言描述痛点和卖点
4. 如果是金融、医疗、保健品等产品，risk_sensitive 设为 true
5. 只返回 JSON，不要有其他文字`;

  let userContent = '';
  if (input.url) {
    userContent += `产品 URL: ${input.url}\n\n`;
  }
  if (webContent) {
    userContent += `网页内容:\n${webContent}\n\n`;
  }
  if (input.description) {
    userContent += `补充说明:\n${input.description}\n\n`;
  }
  userContent += '请根据以上信息提取产品信息。';

  return callGPT<ProductInfoDraft>({
    systemPrompt,
    userContent,
    maxTokens: 2048,
    temperature: 0.3,
  });
}

/**
 * 从 URL 提取产品信息 + 网页图片，用于可编辑预览
 */
export async function extractProductPreview(
  url: string,
  onProgress?: (msg: string) => void
): Promise<{ draft: ProductInfoDraft; webImages: string[] }> {
  // 只抓取一次网页内容，传给 parseProductInfo 避免重复请求
  onProgress?.('正在抓取网页内容...');
  const webContent = await fetchWebContent(url);

  if (webContent.text) {
    onProgress?.('网页内容抓取成功，正在 AI 解析...');
  } else {
    onProgress?.('无法抓取网页，基于 URL 进行 AI 分析...');
  }

  const draft = await parseProductInfo(
    { url, prefetchedWebContent: webContent.text },
    onProgress
  );

  if (!draft.product_url) {
    draft.product_url = url;
  }

  return { draft, webImages: webContent.images };
}

/**
 * 将产品信息映射到爆款视频结构
 */
export async function mapProductToStructure(
  productInfo: ProductInfoDraft,
  analysisResult: AnalysisResult,
  onProgress?: (stage: string) => void
): Promise<ProductFittedStructure> {
  onProgress?.('正在生成产品版结构...');

  const systemPrompt = `你是一个专业的短视频营销专家。根据提供的产品信息和爆款视频结构，生成适配的产品版视频结构。

你必须返回一个严格符合以下 JSON Schema 的结果：

{
  "source_pattern_id": "原模式ID",
  "source_pattern_name": "原模式名称",
  "product_context": {
    "product_name": "产品名称",
    "category": "产品类别",
    "target_user": "目标用户",
    "core_problem": "核心痛点",
    "core_benefit": ["核心卖点数组"],
    "risk_sensitive": true/false
  },
  "slot_feasibility": {
    "hook_question": "strong/medium/weak/required/optional",
    "core_value_statement": "strong/medium/weak/required/optional",
    "proof": "strong/medium/weak/required/optional",
    "trust_objection": "strong/medium/weak/required/optional",
    "end_card": "strong/medium/weak/required/optional"
  },
  "slot_strategy": {
    "hook_question": "这个槽位的策略说明",
    "core_value_statement": "这个槽位的策略说明",
    "proof": "这个槽位的策略说明",
    "trust_objection": "这个槽位的策略说明",
    "end_card": "这个槽位的策略说明"
  },
  "mapped_structure": [
    {
      "segment_id": "seg_1",
      "type": "hook/explain/proof/trust/end_card",
      "structure": {
        "function": "功能描述",
        "time_ratio": { "start": 0.0, "end": 0.1 }
      },
      "product_mapping": {
        "slot": "槽位名称",
        "expression_strategy": "表达策略",
        "example_direction": "具体的文案/画面方向示例"
      }
    }
  ],
  "overall_fit_score": 0.0-1.0,
  "risk_warnings": ["风险提示1", "风险提示2"]
}

重要提示：
1. 根据原视频的片段结构，为每个片段生成适配产品的内容
2. example_direction 要具体、可执行，直接给出文案或画面建议
3. 如果产品是风险敏感的，必须在 risk_warnings 中添加合规提示
4. slot_feasibility 评估产品与每个槽位的适配程度
5. overall_fit_score 综合评估产品与整体结构的匹配度
6. 只返回 JSON，不要有其他文字`;

  const userContent = `## 产品信息
${JSON.stringify(productInfo, null, 2)}

## 爆款视频结构
模式: ${analysisResult.pattern.pattern_name}
公式: ${analysisResult.pattern.core_formula}

片段结构:
${analysisResult.segments.map((seg, i) => `
${i + 1}. ${seg.type} (${Math.round(seg.structure.time_ratio.start * 100)}%-${Math.round(seg.structure.time_ratio.end * 100)}%)
   - 功能: ${seg.structure.function}
   - 场景: ${seg.evidence.scene_observation}
   - 字幕: ${seg.evidence.subtitle_main_raw || '无'}
`).join('')}

请生成适配产品的视频结构。`;

  return callGPT<ProductFittedStructure>({
    systemPrompt,
    userContent,
    maxTokens: 4096,
    temperature: 0.4,
  });
}

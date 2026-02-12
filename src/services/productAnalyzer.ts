/**
 * 产品分析服务
 * 支持：URL 抓取、手动输入、图片识别
 */

import type { ProductInfo } from '../types/product';
import type { ImageInput, WebPageContent } from './gptClient';
import { callGPT, fetchWebContent } from './gptClient';

const ANALYSIS_SYSTEM_PROMPT = `你是一个专业的产品分析师。根据用户提供的产品信息（文字描述、网页内容、产品图片），提取并返回结构化的产品信息。

返回严格的 JSON：
{
  "product_name": "产品名称",
  "product_url": "产品URL（如有）",
  "category": "产品类别，如：金融/贷款、电商/购物、美妆/护肤、教育/课程、SaaS/工具、健康/保健、运动/鞋服、数码/电子",
  "target_user": "目标用户描述",
  "core_problem": "用户核心痛点",
  "core_benefits": ["核心卖点1", "核心卖点2", "核心卖点3"],
  "key_features": ["关键功能1", "关键功能2"],
  "differentiators": ["差异化优势1", "差异化优势2"],
  "risk_sensitive": true/false,
  "additional_notes": "其他备注",
  "images": ["产品图片URL1", "产品图片URL2"]
}

重要：
1. 如果提供了产品图片，仔细分析图片中的产品名称、包装、标签、文字信息
2. 结合图片和文字信息，提取最能打动用户的核心卖点（3个以内）
3. 用简洁有力的语言描述
4. 如果是金融、医疗、保健品，risk_sensitive 设为 true
5. images 字段：如果你通过 web_search 找到了产品图片 URL，填入此字段（公网可访问的 https 链接）；否则留空数组
6. 只返回 JSON，不要附加任何说明文字`;

export interface AnalyzeInput {
  url?: string;
  name?: string;
  description?: string;
  imageDataUrls?: string[];  // data:image/xxx;base64,... 格式
}

export async function analyzeProduct(
  input: AnalyzeInput,
  onProgress?: (msg: string) => void
): Promise<ProductInfo> {
  let webPage: WebPageContent = { text: '', images: [] };
  let useWebSearch = false;

  // 策略1：CORS 代理抓取
  if (input.url) {
    onProgress?.('正在抓取网页内容...');
    webPage = await fetchWebContent(input.url);

    if (webPage.text) {
      onProgress?.(`网页抓取成功（含 ${webPage.images.length} 张图片），正在分析...`);
    } else if (!input.description && !input.imageDataUrls?.length) {
      // 没有补充信息也没有图片，尝试 web_search
      onProgress?.('网页无法直接抓取，使用 AI 搜索...');
      useWebSearch = true;
    }
  }

  const hasImages = input.imageDataUrls && input.imageDataUrls.length > 0;
  onProgress?.(hasImages ? 'AI 正在识别产品图片...' : 'AI 正在分析产品信息...');

  // 构建文字内容
  let userContent = '';
  if (input.url) userContent += `产品 URL: ${input.url}\n\n`;
  if (webPage.text) userContent += `网页内容:\n${webPage.text}\n\n`;
  if (input.name) userContent += `产品名称: ${input.name}\n`;
  if (input.description) userContent += `产品描述:\n${input.description}\n\n`;
  if (hasImages) userContent += `\n用户上传了 ${input.imageDataUrls!.length} 张产品图片，请仔细分析图片内容。\n`;

  if (useWebSearch) {
    userContent += `\n注意：网页无法直接抓取，请使用 web search 搜索这个产品链接的信息，并尽量找到产品图片 URL 填入 images 字段。\n`;
  }

  userContent += '请提取产品信息，只返回 JSON。';

  // 构建图片输入
  const gptImages: ImageInput[] | undefined = hasImages
    ? input.imageDataUrls!.map(dataUrl => ({ dataUrl }))
    : undefined;

  const result = await callGPT<ProductInfo>({
    systemPrompt: ANALYSIS_SYSTEM_PROMPT,
    userContent,
    images: gptImages,
    maxTokens: 2048,
    temperature: 0.3,
    timeoutMs: hasImages ? 90000 : useWebSearch ? 90000 : 60000,
    tools: useWebSearch ? [{ type: 'web_search_preview' }] : undefined,
  });

  // 合并图片来源（优先级：用户上传 > 网页提取 > GPT 搜索）
  const allImages: string[] = [];
  // 1. 用户手动上传的图片（data URL）
  if (input.imageDataUrls?.length) {
    allImages.push(...input.imageDataUrls);
  }
  // 2. 从网页 HTML 提取的产品图片（公网 URL）
  if (webPage.images.length > 0) {
    allImages.push(...webPage.images);
  }
  // 3. GPT web_search 找到的图片（公网 URL）
  if (result.images?.length > 0) {
    for (const img of result.images) {
      if (img.startsWith('http') && !allImages.includes(img)) {
        allImages.push(img);
      }
    }
  }
  result.images = allImages;

  if (input.url && !result.product_url) {
    result.product_url = input.url;
  }

  console.log(`产品分析完成: ${result.product_name}, 图片数: ${result.images.length}`);
  onProgress?.('产品分析完成');
  return result;
}

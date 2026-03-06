/**
 * 复刻爆款 Pipeline 编排器
 * 串行执行三个阶段：分析 → 映射 → 脚本生成
 * 通过回调统一上报进度
 */

import type { AnalysisResult } from '../types/analysis';
import type { ProductInfoDraft, ProductFittedStructure } from '../types/cloneProductMapping';
import type { VideoScript } from './cloneScriptGeneration';
import type { CompiledWorldPrompt } from './soraPromptCompiler';

import { analyzeVideo } from './cloneVideoAnalysis';
import { parseProductInfo, mapProductToStructure } from './cloneProductMapping';
import { generateVideoScript, generateBatchVideoScripts } from './cloneScriptGeneration';
import { compileToMultipleWorlds } from './soraPromptCompiler';
import { mockAnalysisResult } from '../mock/analysisResult';
import { mockProductDraft, mockProductFittedStructure } from '../mock/productMapping';
import { mockVideoScript } from '../mock/videoScript';
import type { VideoStyleKey } from '../data/videoStyles';

export type ClonePipelinePhase = 'idle' | 'analyzing' | 'mapping' | 'scripting' | 'ready' | 'error';

export interface ClonePipelineInput {
  videoSource: string | File;
  productUrl?: string;
  productDescription?: string;
  preExtractedDraft?: ProductInfoDraft;
  language?: string;
  style?: VideoStyleKey;
  duration?: number;
  aspectRatio?: '9:16' | '16:9';
  batchCount?: number;
  mock?: boolean;
}

export interface CloneScriptVariation {
  label: string;
  script: VideoScript;
  compiledWorlds: CompiledWorldPrompt[];
}

export interface ClonePipelineResult {
  analysisResult: AnalysisResult;
  productDraft: ProductInfoDraft;
  fittedStructure: ProductFittedStructure;
  videoScript: VideoScript;
  compiledWorlds: CompiledWorldPrompt[];
  scriptVariations: CloneScriptVariation[];
}

export interface ClonePipelineCallbacks {
  onPhaseChange: (phase: ClonePipelinePhase) => void;
  onProgress: (message: string) => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
  onMappingComplete: (draft: ProductInfoDraft, structure: ProductFittedStructure) => void;
  onScriptComplete: (script: VideoScript, worlds: CompiledWorldPrompt[]) => void;
  onBatchScriptsComplete?: (variations: CloneScriptVariation[]) => void;
  onError: (error: string) => void;
}

/** 模拟延迟 */
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * 运行完整的复刻管线
 */
export async function runClonePipeline(
  input: ClonePipelineInput,
  callbacks: ClonePipelineCallbacks
): Promise<ClonePipelineResult | null> {
  // ── Mock 演示模式 ──
  if (input.mock) {
    return runMockPipeline(callbacks, input.batchCount);
  }

  try {
    // Phase 1: 分析视频
    callbacks.onPhaseChange('analyzing');
    callbacks.onProgress('正在分析爆款视频...');

    const analysisResult = await analyzeVideo(
      input.videoSource,
      (msg) => callbacks.onProgress(msg)
    );
    callbacks.onAnalysisComplete(analysisResult);

    // Phase 2: 映射产品
    callbacks.onPhaseChange('mapping');

    let productDraft: ProductInfoDraft;
    if (input.preExtractedDraft) {
      callbacks.onProgress('使用已编辑的产品信息...');
      productDraft = input.preExtractedDraft;
    } else {
      callbacks.onProgress('正在解析产品信息...');
      productDraft = await parseProductInfo(
        { url: input.productUrl, description: input.productDescription },
        (msg) => callbacks.onProgress(msg)
      );
    }

    callbacks.onProgress('正在生成产品 × 结构映射...');
    const fittedStructure = await mapProductToStructure(
      productDraft,
      analysisResult,
      (msg) => callbacks.onProgress(msg)
    );
    callbacks.onMappingComplete(productDraft, fittedStructure);

    // Phase 3: 生成脚本
    callbacks.onPhaseChange('scripting');
    const batchCount = input.batchCount || 1;

    if (batchCount <= 1) {
      // 单脚本路径（原有逻辑不变）
      callbacks.onProgress('正在生成视频脚本...');
      const videoScript = await generateVideoScript(
        fittedStructure,
        { style: input.style, duration: input.duration, language: input.language },
        (msg) => callbacks.onProgress(msg)
      );
      const compiledWorlds = compileToMultipleWorlds(videoScript);
      callbacks.onScriptComplete(videoScript, compiledWorlds);

      const variations: CloneScriptVariation[] = [{ label: '默认方案', script: videoScript, compiledWorlds }];
      callbacks.onBatchScriptsComplete?.(variations);

      callbacks.onPhaseChange('ready');
      callbacks.onProgress('复刻方案生成完成！');
      return { analysisResult, productDraft, fittedStructure, videoScript, compiledWorlds, scriptVariations: variations };
    } else {
      // 批量路径：生成 N 个脚本变体
      callbacks.onProgress(`正在生成 ${batchCount} 套脚本变体...`);
      const batchResults = await generateBatchVideoScripts(
        fittedStructure,
        { style: input.style, duration: input.duration, language: input.language, count: batchCount },
        (msg) => callbacks.onProgress(msg)
      );

      const variations: CloneScriptVariation[] = batchResults.map(r => ({
        label: r.label,
        script: r.script,
        compiledWorlds: compileToMultipleWorlds(r.script),
      }));

      // 第一个变体作为主脚本（向后兼容）
      const primary = variations[0];
      callbacks.onScriptComplete(primary.script, primary.compiledWorlds);
      callbacks.onBatchScriptsComplete?.(variations);

      callbacks.onPhaseChange('ready');
      callbacks.onProgress(`${batchCount} 套脚本变体生成完成！`);
      return {
        analysisResult, productDraft, fittedStructure,
        videoScript: primary.script, compiledWorlds: primary.compiledWorlds,
        scriptVariations: variations,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    callbacks.onPhaseChange('error');
    callbacks.onError(message);
    return null;
  }
}

/**
 * Mock 演示模式 — 用预置数据模拟完整流程
 */
async function runMockPipeline(
  callbacks: ClonePipelineCallbacks,
  batchCount = 1
): Promise<ClonePipelineResult> {
  // Phase 1: 模拟分析
  callbacks.onPhaseChange('analyzing');
  callbacks.onProgress('正在提取视频关键帧...');
  await delay(800);
  callbacks.onProgress('正在分析视频结构...');
  await delay(1200);
  callbacks.onAnalysisComplete(mockAnalysisResult);

  // Phase 2: 模拟映射
  callbacks.onPhaseChange('mapping');
  callbacks.onProgress('正在解析产品信息...');
  await delay(800);
  callbacks.onProgress('正在生成产品 × 结构映射...');
  await delay(1000);
  callbacks.onMappingComplete(mockProductDraft, mockProductFittedStructure);

  // Phase 3: 模拟脚本生成
  callbacks.onPhaseChange('scripting');
  const count = Math.max(1, batchCount);

  if (count <= 1) {
    callbacks.onProgress('正在生成视频脚本...');
    await delay(1200);
    const compiledWorlds = compileToMultipleWorlds(mockVideoScript);
    callbacks.onScriptComplete(mockVideoScript, compiledWorlds);
    const variations: CloneScriptVariation[] = [{ label: '默认方案', script: mockVideoScript, compiledWorlds }];
    callbacks.onBatchScriptsComplete?.(variations);

    callbacks.onPhaseChange('ready');
    callbacks.onProgress('复刻方案生成完成！（演示数据）');
    return { analysisResult: mockAnalysisResult, productDraft: mockProductDraft, fittedStructure: mockProductFittedStructure, videoScript: mockVideoScript, compiledWorlds, scriptVariations: variations };
  } else {
    callbacks.onProgress(`正在生成 ${count} 套脚本变体...`);
    await delay(1500);
    const hookStyles = ['痛点提问+紧迫CTA', '情境代入+情感共鸣', '数据冲击+理性说服', '反转开场+好奇心', '生活场景+轻松口吻'];
    const variations: CloneScriptVariation[] = Array.from({ length: count }, (_, i) => {
      const script = { ...mockVideoScript, title: `${mockVideoScript.title} - 变体${i + 1}` };
      return { label: hookStyles[i % hookStyles.length], script, compiledWorlds: compileToMultipleWorlds(script) };
    });
    const primary = variations[0];
    callbacks.onScriptComplete(primary.script, primary.compiledWorlds);
    callbacks.onBatchScriptsComplete?.(variations);

    callbacks.onPhaseChange('ready');
    callbacks.onProgress(`${count} 套脚本变体生成完成！（演示数据）`);
    return { analysisResult: mockAnalysisResult, productDraft: mockProductDraft, fittedStructure: mockProductFittedStructure, videoScript: primary.script, compiledWorlds: primary.compiledWorlds, scriptVariations: variations };
  }
}

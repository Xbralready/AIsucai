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
import { generateVideoScript } from './cloneScriptGeneration';
import { compileToMultipleWorlds } from './soraPromptCompiler';
import { mockAnalysisResult } from '../mock/analysisResult';
import { mockProductDraft, mockProductFittedStructure } from '../mock/productMapping';
import { mockVideoScript } from '../mock/videoScript';

export type ClonePipelinePhase = 'idle' | 'analyzing' | 'mapping' | 'scripting' | 'ready' | 'error';

export interface ClonePipelineInput {
  videoSource: string | File;
  productUrl?: string;
  productDescription?: string;
  preExtractedDraft?: ProductInfoDraft;
  language?: string;
  style?: 'professional' | 'casual' | 'energetic' | 'minimal';
  duration?: number;
  mock?: boolean;
}

export interface ClonePipelineResult {
  analysisResult: AnalysisResult;
  productDraft: ProductInfoDraft;
  fittedStructure: ProductFittedStructure;
  videoScript: VideoScript;
  compiledWorlds: CompiledWorldPrompt[];
}

export interface ClonePipelineCallbacks {
  onPhaseChange: (phase: ClonePipelinePhase) => void;
  onProgress: (message: string) => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
  onMappingComplete: (draft: ProductInfoDraft, structure: ProductFittedStructure) => void;
  onScriptComplete: (script: VideoScript, worlds: CompiledWorldPrompt[]) => void;
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
    return runMockPipeline(callbacks);
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
    callbacks.onProgress('正在生成视频脚本...');

    const videoScript = await generateVideoScript(
      fittedStructure,
      {
        style: input.style,
        duration: input.duration,
        language: input.language,
      },
      (msg) => callbacks.onProgress(msg)
    );

    // 编译成 Sora 连续世界 Prompt
    const compiledWorlds = compileToMultipleWorlds(videoScript);
    callbacks.onScriptComplete(videoScript, compiledWorlds);

    // Done
    callbacks.onPhaseChange('ready');
    callbacks.onProgress('复刻方案生成完成！');

    return {
      analysisResult,
      productDraft,
      fittedStructure,
      videoScript,
      compiledWorlds,
    };
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
  callbacks: ClonePipelineCallbacks
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
  callbacks.onProgress('正在生成视频脚本...');
  await delay(1200);

  const compiledWorlds = compileToMultipleWorlds(mockVideoScript);
  callbacks.onScriptComplete(mockVideoScript, compiledWorlds);

  // Done
  callbacks.onPhaseChange('ready');
  callbacks.onProgress('复刻方案生成完成！（演示数据）');

  return {
    analysisResult: mockAnalysisResult,
    productDraft: mockProductDraft,
    fittedStructure: mockProductFittedStructure,
    videoScript: mockVideoScript,
    compiledWorlds,
  };
}

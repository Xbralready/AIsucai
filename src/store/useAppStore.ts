import { create } from 'zustand';
import type { ProductInfo } from '../types/product';
import type { GenerationPlan, TypeRecommendation } from '../types/recommendation';
import type { VideoScript as CreateVideoScript } from '../types/script';
import type { BatchJob } from '../types/job';
import type { AnalysisResult } from '../types/analysis';
import type { ProductInfoDraft, ProductFittedStructure } from '../types/cloneProductMapping';
import type { VideoScript as CloneVideoScript } from '../services/cloneScriptGeneration';
import type { CompiledWorldPrompt } from '../services/soraPromptCompiler';
import type { ProductImage, SceneImageBinding } from '../types/productImage';
import type { ClonePipelinePhase } from '../services/clonePipeline';
import type { VideoJobStatus } from '../services/videoGenerator/interface';

// ── App Mode ──
export type AppMode = 'home' | 'create' | 'clone';
type Step = 'input' | 'plan' | 'generate';
export type CloneStep = 'input' | 'result';

/** 保存用户在输入页填写的原始数据，返回时恢复 */
export interface InputDraft {
  mode: 'url' | 'manual';
  url: string;
  name: string;
  description: string;
  imageDataUrls: string[];
}

// ── Clone 生成的视频状态 ──
export interface CloneGeneratedVideo {
  worldIndex: number;
  jobId: string;
  status: VideoJobStatus;
}

interface AppState {
  // ── App Mode ──
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;

  // ── Create Mode (existing) ──
  currentStep: Step;
  setStep: (step: Step) => void;

  product: ProductInfo | null;
  isAnalyzing: boolean;
  inputDraft: InputDraft | null;
  setProduct: (product: ProductInfo | null) => void;
  setIsAnalyzing: (v: boolean) => void;
  setInputDraft: (draft: InputDraft) => void;

  recommendations: TypeRecommendation[];
  plan: GenerationPlan | null;
  isRecommending: boolean;
  setRecommendations: (recs: TypeRecommendation[]) => void;
  setPlan: (plan: GenerationPlan | null) => void;
  setIsRecommending: (v: boolean) => void;

  scripts: CreateVideoScript[];
  batchJob: BatchJob | null;
  isGeneratingScripts: boolean;
  setScripts: (scripts: CreateVideoScript[]) => void;
  updateScript: (id: string, patch: Partial<CreateVideoScript>) => void;
  setBatchJob: (job: BatchJob | null) => void;
  setIsGeneratingScripts: (v: boolean) => void;

  // ── Clone Mode (new) ──
  cloneStep: CloneStep;
  setCloneStep: (step: CloneStep) => void;

  // Clone inputs
  videoSource: string | File | null;
  setVideoSource: (source: string | File | null) => void;
  cloneProductUrl: string;
  setCloneProductUrl: (url: string) => void;
  cloneProductDescription: string;
  setCloneProductDescription: (desc: string) => void;
  cloneLanguage: string;
  setCloneLanguage: (lang: string) => void;
  cloneProductImages: ProductImage[];
  setCloneProductImages: (images: ProductImage[]) => void;
  cloneExtractionDone: boolean;
  setCloneExtractionDone: (done: boolean) => void;
  cloneExtracting: boolean;
  setCloneExtracting: (v: boolean) => void;
  cloneExtractionProgress: string;
  setCloneExtractionProgress: (msg: string) => void;
  cloneExtractedWebImages: string[];
  setCloneExtractedWebImages: (images: string[]) => void;

  // Clone pipeline results
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  productDraft: ProductInfoDraft | null;
  setProductDraft: (draft: ProductInfoDraft | null) => void;
  fittedStructure: ProductFittedStructure | null;
  setFittedStructure: (structure: ProductFittedStructure | null) => void;
  cloneScript: CloneVideoScript | null;
  setCloneScript: (script: CloneVideoScript | null) => void;
  compiledWorlds: CompiledWorldPrompt[];
  setCompiledWorlds: (worlds: CompiledWorldPrompt[]) => void;
  cloneSceneImageBindings: SceneImageBinding[];
  setCloneSceneImageBindings: (bindings: SceneImageBinding[]) => void;

  // Clone pipeline state
  clonePipelinePhase: ClonePipelinePhase;
  setClonePipelinePhase: (phase: ClonePipelinePhase) => void;
  clonePipelineProgress: string;
  setClonePipelineProgress: (msg: string) => void;
  clonePipelineError: string;
  setClonePipelineError: (err: string) => void;

  // Clone video generation
  cloneGeneratedVideos: CloneGeneratedVideo[];
  setCloneGeneratedVideos: (videos: CloneGeneratedVideo[]) => void;
  updateCloneGeneratedVideo: (worldIndex: number, patch: Partial<CloneGeneratedVideo>) => void;

  // Clone accordion state
  accordionState: { analysis: boolean; mapping: boolean; script: boolean };
  toggleAccordion: (key: 'analysis' | 'mapping' | 'script') => void;

  // ── Resets ──
  resetCreate: () => void;
  resetClone: () => void;
  reset: () => void;
}

const createInitialState = {
  currentStep: 'input' as Step,
  product: null as ProductInfo | null,
  isAnalyzing: false,
  inputDraft: null as InputDraft | null,
  recommendations: [] as TypeRecommendation[],
  plan: null as GenerationPlan | null,
  isRecommending: false,
  scripts: [] as CreateVideoScript[],
  batchJob: null as BatchJob | null,
  isGeneratingScripts: false,
};

const cloneInitialState = {
  cloneStep: 'input' as CloneStep,
  videoSource: null as string | File | null,
  cloneProductUrl: '',
  cloneProductDescription: '',
  cloneLanguage: 'es',
  cloneProductImages: [] as ProductImage[],
  cloneExtractionDone: false,
  cloneExtracting: false,
  cloneExtractionProgress: '',
  cloneExtractedWebImages: [] as string[],
  analysisResult: null as AnalysisResult | null,
  productDraft: null as ProductInfoDraft | null,
  fittedStructure: null as ProductFittedStructure | null,
  cloneScript: null as CloneVideoScript | null,
  compiledWorlds: [] as CompiledWorldPrompt[],
  cloneSceneImageBindings: [] as SceneImageBinding[],
  clonePipelinePhase: 'idle' as ClonePipelinePhase,
  clonePipelineProgress: '',
  clonePipelineError: '',
  cloneGeneratedVideos: [] as CloneGeneratedVideo[],
  accordionState: { analysis: false, mapping: false, script: true },
};

export const useAppStore = create<AppState>((set) => ({
  // ── App Mode ──
  appMode: 'home',
  setAppMode: (appMode) => set({ appMode }),

  // ── Create Mode (existing) ──
  ...createInitialState,

  setStep: (step) => set({ currentStep: step }),

  setProduct: (product) => set({ product }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setInputDraft: (inputDraft) => set({ inputDraft }),

  setRecommendations: (recommendations) => set({ recommendations }),
  setPlan: (plan) => set({ plan }),
  setIsRecommending: (isRecommending) => set({ isRecommending }),

  setScripts: (scripts) => set({ scripts }),
  updateScript: (id, patch) => set((state) => ({
    scripts: state.scripts.map(s => s.id === id ? { ...s, ...patch } : s),
  })),
  setBatchJob: (batchJob) => set({ batchJob }),
  setIsGeneratingScripts: (isGeneratingScripts) => set({ isGeneratingScripts }),

  // ── Clone Mode (new) ──
  ...cloneInitialState,

  setCloneStep: (cloneStep) => set({ cloneStep }),

  setVideoSource: (videoSource) => set({ videoSource }),
  setCloneProductUrl: (cloneProductUrl) => set({ cloneProductUrl }),
  setCloneProductDescription: (cloneProductDescription) => set({ cloneProductDescription }),
  setCloneLanguage: (cloneLanguage) => set({ cloneLanguage }),
  setCloneProductImages: (cloneProductImages) => set({ cloneProductImages }),
  setCloneExtractionDone: (cloneExtractionDone) => set({ cloneExtractionDone }),
  setCloneExtracting: (cloneExtracting) => set({ cloneExtracting }),
  setCloneExtractionProgress: (cloneExtractionProgress) => set({ cloneExtractionProgress }),
  setCloneExtractedWebImages: (cloneExtractedWebImages) => set({ cloneExtractedWebImages }),

  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  setProductDraft: (productDraft) => set({ productDraft }),
  setFittedStructure: (fittedStructure) => set({ fittedStructure }),
  setCloneScript: (cloneScript) => set({ cloneScript }),
  setCompiledWorlds: (compiledWorlds) => set({ compiledWorlds }),
  setCloneSceneImageBindings: (cloneSceneImageBindings) => set({ cloneSceneImageBindings }),

  setClonePipelinePhase: (clonePipelinePhase) => set({ clonePipelinePhase }),
  setClonePipelineProgress: (clonePipelineProgress) => set({ clonePipelineProgress }),
  setClonePipelineError: (clonePipelineError) => set({ clonePipelineError }),

  setCloneGeneratedVideos: (cloneGeneratedVideos) => set({ cloneGeneratedVideos }),
  updateCloneGeneratedVideo: (worldIndex, patch) => set((state) => ({
    cloneGeneratedVideos: state.cloneGeneratedVideos.map(v =>
      v.worldIndex === worldIndex ? { ...v, ...patch } : v
    ),
  })),

  toggleAccordion: (key) => set((state) => ({
    accordionState: {
      ...state.accordionState,
      [key]: !state.accordionState[key],
    },
  })),

  // ── Resets ──
  resetCreate: () => set(createInitialState),
  resetClone: () => set(cloneInitialState),
  reset: () => set({
    appMode: 'home',
    ...createInitialState,
    ...cloneInitialState,
  }),
}));

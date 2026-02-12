import { create } from 'zustand';
import type { ProductInfo } from '../types/product';
import type { GenerationPlan, TypeRecommendation } from '../types/recommendation';
import type { VideoScript } from '../types/script';
import type { BatchJob } from '../types/job';

type Step = 'input' | 'plan' | 'generate';

/** 保存用户在输入页填写的原始数据，返回时恢复 */
export interface InputDraft {
  mode: 'url' | 'manual';
  url: string;
  name: string;
  description: string;
  imageDataUrls: string[];
}

interface AppState {
  // 当前步骤
  currentStep: Step;
  setStep: (step: Step) => void;

  // 步骤1: 产品信息
  product: ProductInfo | null;
  isAnalyzing: boolean;
  inputDraft: InputDraft | null;
  setProduct: (product: ProductInfo | null) => void;
  setIsAnalyzing: (v: boolean) => void;
  setInputDraft: (draft: InputDraft) => void;

  // 步骤2: 推荐方案
  recommendations: TypeRecommendation[];
  plan: GenerationPlan | null;
  isRecommending: boolean;
  setRecommendations: (recs: TypeRecommendation[]) => void;
  setPlan: (plan: GenerationPlan | null) => void;
  setIsRecommending: (v: boolean) => void;

  // 步骤3: 批量生成
  scripts: VideoScript[];
  batchJob: BatchJob | null;
  isGeneratingScripts: boolean;
  setScripts: (scripts: VideoScript[]) => void;
  updateScript: (id: string, patch: Partial<VideoScript>) => void;
  setBatchJob: (job: BatchJob | null) => void;
  setIsGeneratingScripts: (v: boolean) => void;

  // 重置
  reset: () => void;
}

const initialState = {
  currentStep: 'input' as Step,
  product: null,
  isAnalyzing: false,
  inputDraft: null,
  recommendations: [],
  plan: null,
  isRecommending: false,
  scripts: [],
  batchJob: null,
  isGeneratingScripts: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

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

  reset: () => set(initialState),
}));

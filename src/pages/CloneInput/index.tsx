import { useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { runClonePipeline } from '../../services/clonePipeline';
import { extractProductPreview } from '../../services/cloneProductMapping';
import { ProductInfoPreview } from '../../components/clone/ProductInfoPreview';
import { Upload, Link, Globe, Loader2, Play, Search, Smartphone, Monitor } from 'lucide-react';
import type { ProductInfoDraft } from '../../types/cloneProductMapping';
import { VIDEO_STYLES } from '../../data/videoStyles';
import type { VideoStyleKey } from '../../data/videoStyles';

type VideoInputMode = 'file' | 'url';
type ProductInputMode = 'url' | 'manual';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
];

const emptyDraft: ProductInfoDraft = {
  product_name: '',
  category: '',
  target_user: '',
  core_problem: '',
  core_benefits: [''],
  key_features: [''],
  differentiators: [''],
  risk_sensitive: false,
};

export default function CloneInput() {
  const store = useAppStore();
  const [videoInputMode, setVideoInputMode] = useState<VideoInputMode>('file');
  const [productInputMode, setProductInputMode] = useState<ProductInputMode>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFileName, setVideoFileName] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState('');
  const [extractionError, setExtractionError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      store.setVideoSource(file);
      setVideoFileName(file.name);
    }
  };

  // ── Extraction ──
  const handleExtract = async () => {
    if (!store.cloneProductUrl.trim()) return;
    setIsExtracting(true);
    setExtractionError('');
    setExtractionProgress('');

    try {
      const { draft, webImages } = await extractProductPreview(
        store.cloneProductUrl,
        (msg) => setExtractionProgress(msg)
      );
      store.setProductDraft(draft);
      store.setCloneExtractedWebImages(webImages);
      store.setCloneExtractionDone(true);
    } catch (err) {
      setExtractionError(err instanceof Error ? err.message : '提取失败');
    } finally {
      setIsExtracting(false);
      setExtractionProgress('');
    }
  };

  const handleReExtract = () => {
    store.setCloneExtractionDone(false);
    store.setProductDraft(null);
    store.setCloneExtractedWebImages([]);
    store.setCloneProductImages([]);
  };

  const handleProductModeSwitch = (mode: ProductInputMode) => {
    setProductInputMode(mode);
    if (mode === 'manual') {
      store.setCloneExtractionDone(false);
      store.setCloneExtractedWebImages([]);
      if (!store.productDraft) {
        store.setProductDraft({ ...emptyDraft });
      }
    } else {
      if (!store.cloneExtractionDone) {
        store.setProductDraft(null);
      }
    }
  };

  // ── Validation ──
  const hasVideoSource = store.videoSource !== null || videoUrl.trim().length > 0;
  const hasProductInfo =
    (productInputMode === 'url' && store.productDraft !== null) ||
    (productInputMode === 'manual' && !!store.productDraft?.product_name?.trim());
  const canStart = hasVideoSource && hasProductInfo && !isRunning;

  // ── Pipeline callbacks ──
  const pipelineCallbacks = {
    onPhaseChange: (phase: import('../../services/clonePipeline').ClonePipelinePhase) => store.setClonePipelinePhase(phase),
    onProgress: (msg: string) => store.setClonePipelineProgress(msg),
    onAnalysisComplete: (result: import('../../types/analysis').AnalysisResult) => store.setAnalysisResult(result),
    onMappingComplete: (draft: import('../../types/cloneProductMapping').ProductInfoDraft, structure: import('../../types/cloneProductMapping').ProductFittedStructure) => {
      store.setProductDraft(draft);
      store.setFittedStructure(structure);
    },
    onScriptComplete: (script: import('../../services/cloneScriptGeneration').VideoScript, worlds: import('../../services/soraPromptCompiler').CompiledWorldPrompt[]) => {
      store.setCloneScript(script);
      store.setCompiledWorlds(worlds);
    },
    onBatchScriptsComplete: (variations: import('../../services/clonePipeline').CloneScriptVariation[]) => {
      store.setCloneScriptVariations(variations);
      store.setActiveVariationIndex(0);
    },
    onError: (err: string) => store.setClonePipelineError(err),
  };

  const handleStart = async () => {
    if (!canStart) return;
    setIsRunning(true);

    const source = videoInputMode === 'url' ? videoUrl : store.videoSource;
    if (!source) return;

    store.setCloneStep('result');

    await runClonePipeline(
      {
        videoSource: source,
        preExtractedDraft: store.productDraft || undefined,
        productUrl: store.cloneProductUrl || undefined,
        productDescription: store.cloneProductDescription || undefined,
        language: store.cloneLanguage,
        duration: store.cloneDuration,
        aspectRatio: store.cloneAspectRatio,
        style: store.cloneStyle,
        batchCount: store.cloneBatchCount,
      },
      pipelineCallbacks
    );

    setIsRunning(false);
  };

  const handleDemo = async () => {
    setIsRunning(true);
    store.setCloneStep('result');

    await runClonePipeline(
      {
        videoSource: 'demo',
        mock: true,
        batchCount: store.cloneBatchCount,
      },
      pipelineCallbacks
    );

    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Video Source */}
      <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">1. 爆款视频素材</h3>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setVideoInputMode('file')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              videoInputMode === 'file'
                ? 'bg-emerald-50 text-emerald-600 font-medium'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Upload size={14} />
            本地文件
          </button>
          <button
            onClick={() => setVideoInputMode('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              videoInputMode === 'url'
                ? 'bg-emerald-50 text-emerald-600 font-medium'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Link size={14} />
            视频链接
          </button>
        </div>

        {/* File upload */}
        {videoInputMode === 'file' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-emerald-300 rounded-xl p-8 text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {videoFileName ? (
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Upload className="text-emerald-600" size={20} />
                </div>
                <p className="text-sm font-medium text-slate-700">{videoFileName}</p>
                <p className="text-xs text-slate-400">点击更换视频</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-lg bg-slate-50 flex items-center justify-center">
                  <Upload className="text-slate-400" size={20} />
                </div>
                <p className="text-sm text-slate-500">点击上传或拖拽视频文件</p>
                <p className="text-xs text-slate-400">支持 MP4, WebM, MOV</p>
              </div>
            )}
          </div>
        )}

        {/* URL input */}
        {videoInputMode === 'url' && (
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="粘贴视频 URL（如 TikTok, YouTube 等）"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        )}
      </section>

      {/* Section 2: Product Info */}
      <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">2. 你的产品信息</h3>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleProductModeSwitch('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              productInputMode === 'url'
                ? 'bg-emerald-50 text-emerald-600 font-medium'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Globe size={14} />
            产品链接
          </button>
          <button
            onClick={() => handleProductModeSwitch('manual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              productInputMode === 'manual'
                ? 'bg-emerald-50 text-emerald-600 font-medium'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            手动输入
          </button>
        </div>

        {/* URL mode: before extraction */}
        {productInputMode === 'url' && !store.cloneExtractionDone && (
          <div className="space-y-3">
            <input
              type="url"
              value={store.cloneProductUrl}
              onChange={(e) => store.setCloneProductUrl(e.target.value)}
              placeholder="粘贴产品官网或应用商店链接"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <button
              onClick={handleExtract}
              disabled={!store.cloneProductUrl.trim() || isExtracting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !store.cloneProductUrl.trim() || isExtracting
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isExtracting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {extractionProgress || '提取中...'}
                </>
              ) : (
                <>
                  <Search size={14} />
                  提取产品信息
                </>
              )}
            </button>
            {extractionError && (
              <p className="text-xs text-red-500">{extractionError}</p>
            )}
          </div>
        )}

        {/* URL mode: after extraction */}
        {productInputMode === 'url' && store.cloneExtractionDone && store.productDraft && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              <Globe size={12} className="flex-shrink-0" />
              <span className="truncate flex-1">{store.cloneProductUrl}</span>
              <button
                onClick={handleReExtract}
                className="text-emerald-600 hover:text-emerald-700 font-medium flex-shrink-0"
              >
                重新提取
              </button>
            </div>
            <ProductInfoPreview
              draft={store.productDraft}
              onDraftChange={(d) => store.setProductDraft(d)}
              webImages={store.cloneExtractedWebImages}
              productImages={store.cloneProductImages}
              onProductImagesChange={(imgs) => store.setCloneProductImages(imgs)}
            />
          </div>
        )}

        {/* Manual mode: always show structured fields */}
        {productInputMode === 'manual' && store.productDraft && (
          <ProductInfoPreview
            draft={store.productDraft}
            onDraftChange={(d) => store.setProductDraft(d)}
            webImages={[]}
            productImages={store.cloneProductImages}
            onProductImagesChange={(imgs) => store.setCloneProductImages(imgs)}
          />
        )}

        {/* Video params */}
        <div className="mt-4 space-y-3">
          {/* Row 1: Model + Language + Duration + Style */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">视频模型</label>
              <select
                value={store.cloneVideoModel}
                onChange={(e) => store.setCloneVideoModel(e.target.value as 'veo' | 'sora')}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {(!!import.meta.env.VITE_API_BASE_URL || !!import.meta.env.VITE_FAL_API_KEY) && (
                  <option value="veo">Veo 3.1（推荐，快）</option>
                )}
                {(!!import.meta.env.VITE_API_BASE_URL || !!import.meta.env.VITE_FAL_API_KEY) && (
                  <option value="sora">Sora 2（慢，支持 Remix）</option>
                )}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">脚本语言</label>
              <select
                value={store.cloneLanguage}
                onChange={(e) => store.setCloneLanguage(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">视频时长</label>
              <select
                value={store.cloneDuration}
                onChange={(e) => store.setCloneDuration(Number(e.target.value))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {[4, 8, 12, 16, 24].map(s => (
                  <option key={s} value={s}>{s}s</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">风格</label>
              <select
                value={store.cloneStyle}
                onChange={(e) => store.setCloneStyle(e.target.value as VideoStyleKey)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {VIDEO_STYLES.map(s => (
                  <option key={s.value} value={s.value}>{s.labelZh}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">生成数量</label>
              <select
                value={store.cloneBatchCount}
                onChange={(e) => store.setCloneBatchCount(Number(e.target.value))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {[1, 3, 5, 10].map(n => (
                  <option key={n} value={n}>{n} 套脚本</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Aspect ratio toggle */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">画面比例</label>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {([
                { value: '9:16' as const, icon: Smartphone, desc: '竖屏 9:16' },
                { value: '16:9' as const, icon: Monitor, desc: '横屏 16:9' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => store.setCloneAspectRatio(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                    store.cloneAspectRatio === opt.value
                      ? 'bg-emerald-50 text-emerald-600 font-medium'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <opt.icon size={12} />
                  {opt.desc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="sticky bottom-4 z-10 space-y-3">
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full py-4 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2 shadow-lg ${
            canStart
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              正在分析中...
            </>
          ) : (
            '一键复刻'
          )}
        </button>

        {!isRunning && (
          <button
            onClick={handleDemo}
            className="w-full py-3 rounded-xl text-sm font-medium border-2 border-dashed border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
          >
            <Play size={14} />
            演示模式（使用预置数据，不消耗 API）
          </button>
        )}
      </div>
    </div>
  );
}

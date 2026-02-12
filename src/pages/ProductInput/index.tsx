import { useState, useMemo, useRef } from 'react';
import { Link2, ImagePlus, ArrowRight, Loader2, AlertTriangle, Upload, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../../components/common/useToast';
import { analyzeProduct } from '../../services/productAnalyzer';
import { fileToDataUrl } from '../../services/gptClient';

type InputMode = 'url' | 'manual';

/** 检测是否为国内电商链接 */
function isChineseEcommerce(url: string): boolean {
  const domains = [
    'taobao.com', 'tmall.com', 'jd.com', 'pinduoduo.com',
    'tb.cn', 'detail.tmall', 'item.jd', 'yangkeduo.com',
    'suning.com', 'vip.com', '1688.com', 'douyin.com',
  ];
  return domains.some(d => url.includes(d));
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProductInput() {
  const { setProduct, setStep, setIsAnalyzing, isAnalyzing, inputDraft, setInputDraft } = useAppStore();
  const { showToast } = useToast();

  const [mode, setMode] = useState<InputMode>(inputDraft?.mode || 'url');
  const [url, setUrl] = useState(inputDraft?.url || '');
  const [name, setName] = useState(inputDraft?.name || '');
  const [description, setDescription] = useState(inputDraft?.description || '');
  const [progress, setProgress] = useState('');
  const [imageDataUrls, setImageDataUrls] = useState<string[]>(inputDraft?.imageDataUrls || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCnEcom = useMemo(() => isChineseEcommerce(url), [url]);

  const handleAddImages = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - imageDataUrls.length;
    if (remaining <= 0) {
      showToast(`最多上传 ${MAX_IMAGES} 张图片`, 'error');
      return;
    }

    const newImages: string[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        showToast(`${file.name} 不是图片文件`, 'error');
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast(`${file.name} 超过 5MB 限制`, 'error');
        continue;
      }
      const dataUrl = await fileToDataUrl(file);
      newImages.push(dataUrl);
    }

    setImageDataUrls(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setImageDataUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (mode === 'url' && !url.trim()) {
      showToast('请输入产品链接', 'error');
      return;
    }
    if (mode === 'manual' && !name.trim() && imageDataUrls.length === 0) {
      showToast('请输入产品名称或上传产品图片', 'error');
      return;
    }
    // 国内电商链接没有补充描述和图片时提示
    if (mode === 'url' && isCnEcom && !description.trim() && imageDataUrls.length === 0) {
      showToast('该平台无法直接抓取，请补充产品信息或上传产品图片', 'error');
      return;
    }

    setIsAnalyzing(true);
    try {
      const product = await analyzeProduct(
        {
          url: mode === 'url' ? url.trim() : undefined,
          name: mode === 'manual' ? name.trim() : undefined,
          description: description.trim() || undefined,
          imageDataUrls: imageDataUrls.length > 0 ? imageDataUrls : undefined,
        },
        setProgress
      );
      setProduct(product);
      setInputDraft({ mode, url, name, description, imageDataUrls });
      setStep('plan');
      showToast('产品分析完成');
    } catch (error) {
      showToast(`分析失败: ${error}`, 'error');
    } finally {
      setIsAnalyzing(false);
      setProgress('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">奇富AI视频生产平台</h1>
        <p className="text-base text-slate-500 mb-6">输入产品信息</p>
        <p className="text-sm text-slate-400">
          粘贴产品链接、手动填写或上传产品图片，AI 将自动分析
        </p>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('url')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'url'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-500 hover:text-slate-900'
          }`}
        >
          <Link2 size={16} />
          产品链接
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-500 hover:text-slate-900'
          }`}
        >
          <ImagePlus size={16} />
          手动填写
        </button>
      </div>

      {/* 表单 */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
        {mode === 'url' ? (
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              产品链接
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/product/..."
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              disabled={isAnalyzing}
            />
            <p className="mt-2 text-xs text-slate-400">
              支持 Amazon、独立站等链接自动抓取；国内电商请在下方补充产品信息
            </p>
            {isCnEcom && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">检测到国内电商链接</p>
                  <p className="text-amber-600 text-xs mt-1">
                    淘宝/天猫/京东等平台无法直接抓取，请在下方补充产品信息或上传商品截图
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                产品名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：Nike Air Jordan 1 Low 男子运动鞋"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                disabled={isAnalyzing}
              />
            </div>
          </div>
        )}

        {/* 补充描述 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-600 mb-2">
            {mode === 'url' && isCnEcom ? (
              <>产品信息 <span className="text-amber-600">*</span></>
            ) : mode === 'manual' ? (
              '产品描述'
            ) : (
              '补充说明（可选）'
            )}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              mode === 'url' && isCnEcom
                ? '请从商品页复制粘贴：产品标题、核心卖点、价格区间、目标人群等...'
                : '描述产品的功能、卖点、目标用户...'
            }
            rows={mode === 'url' && isCnEcom ? 4 : 3}
            className={`w-full px-4 py-3 bg-white rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none resize-none ${
              mode === 'url' && isCnEcom && !description.trim() && imageDataUrls.length === 0
                ? 'border-2 border-amber-400 focus:border-amber-500'
                : 'border border-slate-300 focus:border-emerald-500'
            }`}
            disabled={isAnalyzing}
          />
        </div>

        {/* 图片上传区域 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-600 mb-2">
            产品图片
            {mode === 'url' && isCnEcom && !description.trim() && (
              <span className="text-amber-600 ml-1">*</span>
            )}
            <span className="text-slate-400 font-normal ml-2">
              （截图或产品主图，最多 {MAX_IMAGES} 张）
            </span>
          </label>

          {/* 已上传的图片预览 */}
          {imageDataUrls.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {imageDataUrls.map((dataUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={dataUrl}
                    alt={`产品图 ${index + 1}`}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 上传按钮 */}
          {imageDataUrls.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className={`w-full py-4 border-2 border-dashed rounded-lg flex flex-col items-center gap-2 transition-colors ${
                mode === 'url' && isCnEcom && !description.trim() && imageDataUrls.length === 0
                  ? 'border-amber-400 text-amber-600 hover:border-amber-500 hover:bg-amber-50'
                  : 'border-slate-300 text-slate-400 hover:border-slate-400 hover:bg-slate-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Upload size={20} />
              <span className="text-sm">
                点击上传产品图片
              </span>
              <span className="text-xs text-slate-400">
                支持 JPG/PNG/WebP，单张不超过 5MB
              </span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleAddImages(e.target.files)}
          />
        </div>
      </div>

      {/* 分析按钮 */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {progress || '分析中...'}
            </>
          ) : (
            <>
              AI 分析产品
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

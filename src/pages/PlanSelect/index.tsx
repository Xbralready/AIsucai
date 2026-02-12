import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../../components/common/useToast';
import { recommendVideoTypes } from '../../services/typeRecommender';
import type { TypeRecommendation, VideoModel } from '../../types/recommendation';

export default function PlanSelect() {
  const {
    product, recommendations, setRecommendations,
    isRecommending, setIsRecommending,
    setStep, setPlan,
  } = useAppStore();
  const { showToast } = useToast();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [language, setLanguage] = useState('en');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [videoModel, setVideoModel] = useState<VideoModel>('veo');
  const [generateAudio, setGenerateAudio] = useState(false);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [progress, setProgress] = useState('');

  // 如果没有推荐数据，自动获取
  useEffect(() => {
    if (product && recommendations.length === 0 && !isRecommending) {
      handleRecommend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // 推荐加载完成后默认选择得分最高的
  useEffect(() => {
    if (recommendations.length > 0 && selected.size === 0) {
      const best = recommendations.reduce((a, b) => a.score > b.score ? a : b);
      setSelected(new Set([best.typeId]));
    }
  }, [recommendations, selected.size]);

  const handleRecommend = async () => {
    if (!product) return;
    setIsRecommending(true);
    try {
      const recs = await recommendVideoTypes(product, setProgress);
      setRecommendations(recs);
    } catch (error) {
      showToast(`推荐失败: ${error}`, 'error');
    } finally {
      setIsRecommending(false);
      setProgress('');
    }
  };

  const toggleSelect = (typeId: string) => {
    const next = new Set(selected);
    if (next.has(typeId)) {
      next.delete(typeId);
    } else {
      next.add(typeId);
    }
    setSelected(next);
  };

  const handleNext = () => {
    if (selected.size === 0) {
      showToast('请至少选择一种视频类型', 'error');
      return;
    }

    const selectedRecs = recommendations.filter(r => selected.has(r.typeId));
    const totalCount = selectedRecs.reduce((sum, r) => sum + r.suggestedCount, 0);
    const totalCost = selectedRecs.reduce((sum, r) => sum + r.estimatedCost * r.suggestedCount, 0);

    setPlan({
      productId: product!.product_name,
      recommendations: selectedRecs,
      language,
      aspectRatio,
      videoModel,
      generateAudio,
      resolution,
      totalEstimatedCost: totalCost,
      totalVideoCount: totalCount,
    });

    setStep('generate');
  };

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">请先完成产品分析</p>
        <button
          onClick={() => setStep('input')}
          className="mt-4 text-emerald-600 hover:text-emerald-500"
        >
          返回上一步
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 产品摘要 */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* 产品图片 */}
          {product.images.length > 0 && (
            <div className="flex-shrink-0 flex gap-2">
              {product.images.slice(0, 3).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${product.product_name} ${i + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ))}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{product.product_name}</h2>
                <p className="text-sm text-slate-500">{product.category} | {product.target_user}</p>
              </div>
              <button
                onClick={() => setStep('input')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={14} />
                修改产品
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.core_benefits.map((b, i) => (
                <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded">
                  {b}
                </span>
              ))}
            </div>
            {product.images.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                未获取到产品图片，建议返回上一步上传产品图以提升视频质量
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          <Sparkles size={20} className="inline mr-2 text-yellow-400" />
          AI 推荐视频方案
        </h1>
        <p className="text-slate-500 text-sm">
          基于产品分析，AI 推荐了以下最适合的视频类型
        </p>
      </div>

      {/* 加载状态 */}
      {isRecommending && (
        <div className="text-center py-12">
          <Loader2 size={32} className="animate-spin text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-500">{progress || 'AI 正在分析最佳方案...'}</p>
        </div>
      )}

      {/* 推荐卡片 */}
      {!isRecommending && recommendations.length > 0 && (
        <>
          <div className="grid gap-4 mb-8">
            {recommendations.map((rec, idx) => {
              const isBest = idx === 0 || rec.score === Math.max(...recommendations.map(r => r.score));
              return (
                <TypeCard
                  key={rec.typeId}
                  recommendation={rec}
                  isSelected={selected.has(rec.typeId)}
                  onToggle={() => toggleSelect(rec.typeId)}
                  isBest={isBest}
                />
              );
            })}
          </div>

          {/* 配置选项 */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-6">
            <h3 className="text-sm font-medium text-slate-600 mb-3">生成配置</h3>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-6">
              <div>
                <label className="block text-xs text-slate-400 mb-1">视频模型</label>
                <select
                  value={videoModel}
                  onChange={(e) => setVideoModel(e.target.value as VideoModel)}
                  className="w-full sm:w-auto bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  {(!!import.meta.env.VITE_API_BASE_URL || !!import.meta.env.VITE_FAL_API_KEY) && (
                    <option value="veo">Veo 3.1（推荐）</option>
                  )}
                  {(!!import.meta.env.VITE_API_BASE_URL || !!import.meta.env.VITE_OPENAI_API_KEY) && (
                    <option value="sora">Sora 2</option>
                  )}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  {videoModel === 'veo' ? '支持口播 + 纯画面' : '纯画面生成'}
                </p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">语言</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full sm:w-auto bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="es">Espanol</option>
                  <option value="pt">Portugues</option>
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">画面比例</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as '9:16' | '16:9' | '1:1')}
                  className="w-full sm:w-auto bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="9:16">9:16 竖屏</option>
                  <option value="16:9">16:9 横屏</option>
                  <option value="1:1">1:1 方形</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">分辨率</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
                  className="w-full sm:w-auto bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="720p">720p（省钱）</option>
                  <option value="1080p">1080p 高清</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">AI 音频</label>
                <button
                  onClick={() => setGenerateAudio(!generateAudio)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                    generateAudio
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  <span className={`w-8 h-4 rounded-full relative transition-colors ${
                    generateAudio ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                      generateAudio ? 'left-4' : 'left-0.5'
                    }`} />
                  </span>
                  {generateAudio ? '开启' : '关闭'}
                </button>
                <p className="text-xs text-slate-400 mt-1">
                  {generateAudio ? 'Veo +50% 费用' : '关闭省 33%'}
                </p>
              </div>
            </div>
          </div>

          {/* 占位，防止吸底栏遮挡内容 */}
          <div className="h-20" />

          {/* 汇总 & 下一步（吸底） */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-t border-slate-200">
            <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                已选 {selected.size} 种类型，
                预计 {recommendations.filter(r => selected.has(r.typeId)).reduce((s, r) => s + r.suggestedCount, 0)} 条视频
              </div>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              >
                开始生成
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TypeCard({
  recommendation: rec,
  isSelected,
  onToggle,
  isBest,
}: {
  recommendation: TypeRecommendation;
  isSelected: boolean;
  onToggle: () => void;
  isBest: boolean;
}) {
  return (
    <div
      onClick={onToggle}
      className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'bg-emerald-50 border-emerald-500'
          : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
      }`}
    >
      {/* 勾选标记 */}
      <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center ${
        isSelected ? 'bg-emerald-600' : 'bg-slate-200'
      }`}>
        {isSelected && <Check size={14} className="text-white" />}
      </div>

      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-slate-900 font-medium">{rec.typeNameZh}</h3>
          <span className="text-xs text-slate-400">{rec.typeName}</span>
          {isBest && (
            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded">
              最优推荐
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-2">{rec.reason}</p>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>{rec.suggestedDuration}s</span>
          <span>{rec.suggestedCount} 条变体</span>
          <span>{rec.suggestedFormat}</span>
          <span>~${(rec.estimatedCost * rec.suggestedCount).toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

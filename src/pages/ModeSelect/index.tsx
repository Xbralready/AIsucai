import { useAppStore } from '../../store/useAppStore';
import { Plus, Copy } from 'lucide-react';

export default function ModeSelect() {
  const { setAppMode } = useAppStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          欢迎使用 QI<span className="text-emerald-600">FU</span> AI
        </h2>
        <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto">
          AI 驱动的批量视频广告生成平台，从零创建或一键复刻爆款
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl">
        {/* Create from scratch */}
        <button
          onClick={() => setAppMode('create')}
          className="group relative bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-2xl p-6 sm:p-8 text-left transition-all hover:shadow-lg hover:shadow-emerald-100"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
            <Plus className="text-emerald-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">从零创建</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            输入产品信息，AI 推荐视频类型，自动生成脚本并批量生产视频
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 bg-slate-50 text-slate-400 rounded">产品分析</span>
            <span className="text-xs px-2 py-1 bg-slate-50 text-slate-400 rounded">脚本生成</span>
            <span className="text-xs px-2 py-1 bg-slate-50 text-slate-400 rounded">批量生产</span>
          </div>
        </button>

        {/* Clone viral video */}
        <button
          onClick={() => setAppMode('clone')}
          className="group relative bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-2xl p-6 sm:p-8 text-left transition-all hover:shadow-lg hover:shadow-emerald-100"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
            <Copy className="text-emerald-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">复刻爆款</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            上传竞品爆款视频 + 你的产品信息，AI 自动分析结构并生成适配脚本
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 bg-slate-50 text-slate-400 rounded">视频分析</span>
            <span className="text-xs px-2 py-1 bg-slate-50 text-slate-400 rounded">结构复刻</span>
            <span className="text-xs px-2 py-1 bg-slate-50 text-slate-400 rounded">Sora 生成</span>
          </div>
        </button>
      </div>
    </div>
  );
}

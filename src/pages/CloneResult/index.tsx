import { useAppStore } from '../../store/useAppStore';
import { CloneAccordionSection } from '../../components/clone/CloneAccordionSection';
import { CloneVideoGenerator } from '../../components/clone/CloneVideoGenerator';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function CloneResult() {
  const {
    clonePipelinePhase,
    clonePipelineProgress,
    clonePipelineError,
    analysisResult,
    productDraft,
    fittedStructure,
    cloneScript,
    compiledWorlds,
    accordionState,
    toggleAccordion,
    setCloneStep,
  } = useAppStore();

  const isRunning = ['analyzing', 'mapping', 'scripting'].includes(clonePipelinePhase);

  // Phase progress bar
  const phaseOrder = ['analyzing', 'mapping', 'scripting', 'ready'];
  const phaseIndex = phaseOrder.indexOf(clonePipelinePhase);
  const progressPercent = clonePipelinePhase === 'ready'
    ? 100
    : clonePipelinePhase === 'error'
      ? 0
      : Math.max(5, (phaseIndex / 3) * 100);

  return (
    <div className="space-y-4">
      {/* Progress overlay */}
      {isRunning && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 size={18} className="animate-spin text-emerald-600" />
            <span className="text-sm font-medium text-slate-700">{clonePipelineProgress}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span className={phaseIndex >= 0 ? 'text-emerald-600' : ''}>分析视频</span>
            <span className={phaseIndex >= 1 ? 'text-emerald-600' : ''}>映射产品</span>
            <span className={phaseIndex >= 2 ? 'text-emerald-600' : ''}>生成脚本</span>
          </div>
        </div>
      )}

      {/* Error */}
      {clonePipelinePhase === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">生成失败</p>
            <p className="text-xs text-red-600 mt-1">{clonePipelineError}</p>
            <button
              onClick={() => setCloneStep('input')}
              className="mt-2 flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
            >
              <ArrowLeft size={12} />
              返回修改
            </button>
          </div>
        </div>
      )}

      {/* Analysis accordion */}
      {analysisResult && (
        <CloneAccordionSection
          title="视频结构分析"
          subtitle={analysisResult.pattern.pattern_name}
          badge={`${Math.round(analysisResult.replicability.overall_score * 100)}% 可复刻`}
          isOpen={accordionState.analysis}
          onToggle={() => toggleAccordion('analysis')}
        >
          <div className="pt-4 space-y-4">
            {/* Pattern */}
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">识别模式</p>
              <p className="text-sm text-slate-800">{analysisResult.pattern.pattern_name}</p>
              <p className="text-xs text-slate-500 mt-1">{analysisResult.pattern.core_formula}</p>
            </div>

            {/* Segments */}
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">片段结构</p>
              <div className="space-y-2">
                {analysisResult.segments.map((seg) => (
                  <div key={seg.segment_id} className="flex items-start gap-2 bg-slate-50 rounded-lg p-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      seg.type === 'hook' ? 'bg-orange-50 text-orange-600' :
                      seg.type === 'explain' ? 'bg-blue-50 text-blue-600' :
                      seg.type === 'proof' ? 'bg-purple-50 text-purple-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {seg.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700">{seg.evidence.scene_observation}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {seg.structure.time.start.toFixed(1)}s - {seg.structure.time.end.toFixed(1)}s
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">核心洞察</p>
              <ul className="space-y-1">
                {analysisResult.summary_insights.map((insight, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CloneAccordionSection>
      )}

      {/* Mapping accordion */}
      {fittedStructure && (
        <CloneAccordionSection
          title="产品 × 结构映射"
          subtitle={`${productDraft?.product_name || ''} × ${fittedStructure.source_pattern_name}`}
          badge={`适配度 ${Math.round(fittedStructure.overall_fit_score * 100)}%`}
          isOpen={accordionState.mapping}
          onToggle={() => toggleAccordion('mapping')}
        >
          <div className="pt-4 space-y-4">
            {/* Mapped segments */}
            <div className="space-y-2">
              {fittedStructure.mapped_structure.map((seg) => (
                <div key={seg.segment_id} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      seg.type === 'hook' ? 'bg-orange-50 text-orange-600' :
                      seg.type === 'explain' ? 'bg-blue-50 text-blue-600' :
                      seg.type === 'proof' ? 'bg-purple-50 text-purple-600' :
                      seg.type === 'trust' ? 'bg-green-50 text-green-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {seg.type}
                    </span>
                    <span className="text-xs text-slate-400">{seg.product_mapping.slot}</span>
                  </div>
                  <p className="text-xs text-slate-700">{seg.product_mapping.expression_strategy}</p>
                  <p className="text-xs text-slate-500 mt-1 italic">"{seg.product_mapping.example_direction}"</p>
                </div>
              ))}
            </div>

            {/* Risk warnings */}
            {fittedStructure.risk_warnings.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-600 mb-1">合规提示</p>
                <ul className="space-y-1">
                  {fittedStructure.risk_warnings.map((w, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">⚠</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CloneAccordionSection>
      )}

      {/* Script accordion */}
      {cloneScript && (
        <CloneAccordionSection
          title="视频脚本"
          subtitle={`${cloneScript.scenes.length} 场景 · ${cloneScript.total_duration}s`}
          badge={`${compiledWorlds.length} 段视频`}
          isOpen={accordionState.script}
          onToggle={() => toggleAccordion('script')}
        >
          <div className="pt-4 space-y-4">
            {/* Character */}
            {cloneScript.character && (
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs font-medium text-emerald-700 mb-1">角色设定</p>
                <p className="text-xs text-emerald-800">{cloneScript.character.description}</p>
              </div>
            )}

            {/* Scenes */}
            <div className="space-y-3">
              {cloneScript.scenes.map((scene, i) => (
                <div key={scene.scene_id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">#{i + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        scene.segment_type === 'hook' ? 'bg-orange-50 text-orange-600' :
                        scene.segment_type === 'explain' ? 'bg-blue-50 text-blue-600' :
                        scene.segment_type === 'proof' ? 'bg-purple-50 text-purple-600' :
                        scene.segment_type === 'trust' ? 'bg-green-50 text-green-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {scene.segment_type}
                      </span>
                      <span className="text-xs text-slate-400">{scene.duration}s</span>
                    </div>
                  </div>

                  {/* Visual */}
                  <div className="mb-2">
                    <p className="text-xs text-slate-500 mb-0.5">画面</p>
                    <p className="text-xs text-slate-700">{scene.visual.setting}</p>
                    <p className="text-xs text-slate-600">{scene.visual.action}</p>
                  </div>

                  {/* Copy */}
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">文案</p>
                    {scene.copy.voiceover && (
                      <p className="text-xs text-slate-700">🎙 {scene.copy.voiceover}</p>
                    )}
                    {scene.copy.subtitle && (
                      <p className="text-xs text-slate-500 mt-0.5">📝 {scene.copy.subtitle}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CloneAccordionSection>
      )}

      {/* Video Generator */}
      {clonePipelinePhase === 'ready' && compiledWorlds.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <CloneVideoGenerator />
        </div>
      )}

      {/* Back button (when not running) */}
      {!isRunning && clonePipelinePhase !== 'idle' && (
        <div className="text-center">
          <button
            onClick={() => setCloneStep('input')}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← 返回修改输入
          </button>
        </div>
      )}
    </div>
  );
}

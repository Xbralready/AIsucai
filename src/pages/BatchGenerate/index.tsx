import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, Download, Loader2, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Pencil, Eye } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../../components/common/useToast';
import { generateAllScripts } from '../../services/scriptGenerator';
import { createBatchJob, executeBatchJob } from '../../services/jobManager';
import type { BatchGenerateOptions } from '../../services/jobManager';
import type { VideoScript } from '../../types/script';
import type { VideoTask } from '../../types/job';

type Phase = 'scripts' | 'generating' | 'done';

export default function BatchGenerate() {
  const {
    product, plan, scripts, setScripts, updateScript,
    batchJob, setBatchJob,
    isGeneratingScripts, setIsGeneratingScripts,
    setStep, setPlan,
  } = useAppStore();
  const { showToast } = useToast();

  const [phase, setPhase] = useState<Phase>('scripts');
  const [scriptProgress, setScriptProgress] = useState('');

  // 自动生成脚本
  useEffect(() => {
    if (product && plan && scripts.length === 0 && !isGeneratingScripts) {
      handleGenerateScripts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, plan]);

  const handleGenerateScripts = async () => {
    if (!product || !plan) return;
    setIsGeneratingScripts(true);
    try {
      const result = await generateAllScripts(
        product,
        plan.recommendations,
        { language: plan.language, countPerType: 2, videoModel: plan.videoModel },
        setScriptProgress
      );
      setScripts(result);
      setPhase('scripts');
      showToast(`已生成 ${result.length} 条脚本`);
    } catch (error) {
      showToast(`脚本生成失败: ${error}`, 'error');
    } finally {
      setIsGeneratingScripts(false);
      setScriptProgress('');
    }
  };

  const handleStartGeneration = useCallback(async () => {
    if (!product || !plan || scripts.length === 0) return;

    let job: ReturnType<typeof createBatchJob>;
    try {
      job = createBatchJob(product.product_name, scripts, plan.videoModel);
    } catch (error) {
      showToast(`创建任务失败: ${error}`, 'error');
      return;
    }

    setBatchJob(job);
    setPhase('generating');

    // 让 React 先渲染进度页面，再开始长任务
    await new Promise(resolve => setTimeout(resolve, 50));

    const options: BatchGenerateOptions = {
      aspectRatio: plan.aspectRatio,
      videoModel: plan.videoModel,
      generateAudio: plan.generateAudio,
      resolution: plan.resolution,
      language: plan.language,
      productImages: product.images || [],
    };

    try {
      const result = await executeBatchJob(
        job,
        scripts,
        options,
        (updated) => setBatchJob({ ...updated })
      );
      setBatchJob(result);
      setPhase('done');
      showToast(
        result.status === 'completed'
          ? '全部视频生成完成!'
          : '部分视频生成完成'
      );
    } catch (error) {
      showToast(`生成出错: ${error}`, 'error');
    }
  }, [product, plan, scripts, setBatchJob, showToast]);

  if (!product || !plan) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">请先完成产品分析和方案选择</p>
        <button onClick={() => setStep('input')} className="mt-4 text-emerald-600 hover:text-emerald-500">
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            setScripts([]);
            setBatchJob(null);
            setPlan(null);
            setStep('plan');
          }}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={14} />
          返回方案
        </button>
        <div className="text-sm text-slate-500 hidden sm:block">
          {product.product_name} | {plan.videoModel === 'veo' ? 'Veo 3.1' : 'Sora 2'} | {plan.recommendations.length} 种类型 | {plan.language.toUpperCase()} | {plan.resolution}
        </div>
      </div>

      {/* 脚本生成中 */}
      {isGeneratingScripts && (
        <div className="text-center py-16">
          <Loader2 size={40} className="animate-spin text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">正在生成脚本</h2>
          <p className="text-slate-500">{scriptProgress || '请稍候...'}</p>
        </div>
      )}

      {/* 脚本预览 */}
      {phase === 'scripts' && !isGeneratingScripts && scripts.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            脚本预览 ({scripts.length} 条)
          </h2>
          <div className="space-y-4 mb-6">
            {scripts.map((script, i) => (
              <ScriptCard
                key={script.id || i}
                script={script}
                onUpdate={(patch) => updateScript(script.id, patch)}
              />
            ))}
          </div>

          {/* 占位，防止吸底栏遮挡内容 */}
          <div className="h-20" />

          {/* 开始生成视频（吸底） */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-t border-slate-200">
            <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 flex justify-center">
              <button
                onClick={handleStartGeneration}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              >
                <Play size={18} />
                开始生成视频 ({scripts.length} 条)
              </button>
            </div>
          </div>
        </>
      )}

      {/* 生成进度 */}
      {(phase === 'generating' || phase === 'done') && batchJob && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              {phase === 'generating' ? '生成中...' : '生成完成'}
            </h2>
            <span className="text-sm text-slate-400">
              {batchJob.progress}%
            </span>
          </div>

          {/* 进度条 */}
          <div className="w-full h-2 bg-slate-200 rounded-full mb-6">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                batchJob.status === 'completed' ? 'bg-emerald-500' :
                batchJob.status === 'failed' ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${batchJob.progress}%` }}
            />
          </div>

          {/* 任务列表 */}
          <div className="space-y-4">
            {batchJob.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 脚本卡片（可展开、可编辑） ─────────────────────────────────

function ScriptCard({
  script,
  onUpdate,
}: {
  script: VideoScript;
  onUpdate: (patch: Partial<VideoScript>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  // 视频 Prompt：veoPrompt 和 soraPrompt 只会有一个（由选的模型决定）
  const videoPromptKey: keyof VideoScript = script.veoPrompt ? 'veoPrompt' : 'soraPrompt';

  const promptFields: { key: keyof VideoScript; label: string }[] = [
    { key: 'fullScript', label: '口播台词' },
    { key: videoPromptKey, label: '视频生成 Prompt' },
    { key: 'visualDirection', label: '画面方向（参考）' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 标题栏 */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs rounded shrink-0">
              {script.typeName}
            </span>
            <span className="text-sm text-slate-900 font-medium truncate">{script.title}</span>
            <span className="text-xs text-slate-400 shrink-0">{script.duration}s</span>
          </div>
          {/* 收起时显示摘要 */}
          {!expanded && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              {script.hook}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {expanded ? (
            <ChevronUp size={16} className="text-slate-500" />
          ) : (
            <ChevronDown size={16} className="text-slate-500" />
          )}
        </div>
      </div>

      {/* 展开内容 */}
      {expanded && (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4 border-t border-slate-100">
          {/* 脚本结构 */}
          <div className="mt-3 space-y-2 text-sm">
            <div>
              <span className="text-slate-400">Hook: </span>
              <span className="text-slate-700">{script.hook}</span>
            </div>
            <div>
              <span className="text-slate-400">Body: </span>
              <span className="text-slate-600">{script.body}</span>
            </div>
            <div>
              <span className="text-slate-400">CTA: </span>
              <span className="text-slate-700">{script.cta}</span>
            </div>
          </div>

          {/* 分割线 */}
          <div className="border-t border-slate-100 my-3" />

          {/* 编辑/预览切换 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Prompts</span>
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(!editing); }}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors
                         text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              {editing ? <Eye size={12} /> : <Pencil size={12} />}
              {editing ? '预览' : '编辑'}
            </button>
          </div>

          {/* Prompt 字段 */}
          <div className="space-y-3">
            {promptFields.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                {editing ? (
                  <textarea
                    value={(script[key] as string) || ''}
                    onChange={(e) => onUpdate({ [key]: e.target.value })}
                    rows={key === 'veoPrompt' || key === 'fullScript' ? 5 : 3}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2
                               text-sm text-slate-700 placeholder-slate-400
                               focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30
                               resize-y font-mono leading-relaxed"
                  />
                ) : (
                  <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600
                                  font-mono leading-relaxed whitespace-pre-wrap break-words">
                    {(script[key] as string) || '-'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 任务卡片（生成进度 + 视频预览） ────────────────────────────

/** Blob 下载（解决跨域 <a download> 无效问题） */
async function handleDownload(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // 降级：新标签页打开
    window.open(url, '_blank');
  }
}

function TaskCard({ task }: { task: VideoTask }) {
  const [expanded, setExpanded] = useState(task.status === 'completed');
  const [downloading, setDownloading] = useState(false);

  // 完成时自动展开
  useEffect(() => {
    if (task.status === 'completed') setExpanded(true);
  }, [task.status]);

  const statusIcon = {
    pending: <Clock size={16} className="text-slate-400" />,
    queued: <Loader2 size={16} className="text-yellow-500 animate-spin" />,
    generating: <Loader2 size={16} className="text-emerald-500 animate-spin" />,
    completed: <CheckCircle size={16} className="text-emerald-500" />,
    failed: <XCircle size={16} className="text-red-500" />,
  };

  const onDownload = async () => {
    if (!task.videoUrl || downloading) return;
    setDownloading(true);
    const filename = `${task.typeName}_${task.id}.mp4`;
    await handleDownload(task.videoUrl, filename);
    setDownloading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 标题栏 */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => task.status === 'completed' && setExpanded(!expanded)}
      >
        {statusIcon[task.status]}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-900 font-medium">{task.typeName}</span>
            <span className="text-xs text-slate-400">{task.backend}</span>
          </div>
          {task.error && (
            <p className="text-xs text-red-400 mt-1 truncate">{task.error}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {task.status === 'generating' && (
            <span className="text-xs text-slate-400">{task.progress}%</span>
          )}
          {task.status === 'completed' && task.videoUrl && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                disabled={downloading}
                className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
              >
                {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {downloading ? '下载中...' : '下载'}
              </button>
              {expanded ? (
                <ChevronUp size={16} className="text-slate-500" />
              ) : (
                <ChevronDown size={16} className="text-slate-500" />
              )}
            </>
          )}
        </div>
      </div>

      {/* 视频预览（展开时显示） */}
      {expanded && task.status === 'completed' && task.videoUrl && (
        <div className="px-4 pb-4">
          <video
            src={task.videoUrl}
            controls
            autoPlay
            muted
            playsInline
            className="w-full max-h-[260px] sm:max-h-[400px] rounded-lg bg-black"
          />
        </div>
      )}
    </div>
  );
}

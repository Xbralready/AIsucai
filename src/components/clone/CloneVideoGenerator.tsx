import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { SoraBackend } from '../../services/videoGenerator/sora';
import { Play, Download, Loader2 } from 'lucide-react';
import type { VideoJobStatus } from '../../services/videoGenerator/interface';

const sora = new SoraBackend();

export function CloneVideoGenerator() {
  const {
    compiledWorlds,
    cloneGeneratedVideos,
    setCloneGeneratedVideos,
    updateCloneGeneratedVideo,
  } = useAppStore();

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (compiledWorlds.length === 0) return;
    setIsGenerating(true);

    // Initialize video slots
    const initialVideos = compiledWorlds.map((_, i) => ({
      worldIndex: i,
      jobId: '',
      status: { id: '', status: 'queued' as const, progress: 0 },
    }));
    setCloneGeneratedVideos(initialVideos);

    let previousVideoId: string | null = null;

    for (let i = 0; i < compiledWorlds.length; i++) {
      const world = compiledWorlds[i];

      try {
        let jobStatus: VideoJobStatus;

        if (i === 0 || !previousVideoId) {
          // First world: generate from scratch
          jobStatus = await sora.generateVideo({
            prompt: world.compiledPrompt,
            duration: world.suggestedDuration,
            aspectRatio: '9:16',
          });
        } else {
          // Subsequent worlds: remix from previous
          if (sora.remixVideo) {
            jobStatus = await sora.remixVideo(previousVideoId, world.compiledPrompt);
          } else {
            // Fallback: generate independently
            jobStatus = await sora.generateVideo({
              prompt: world.compiledPrompt,
              duration: world.suggestedDuration,
              aspectRatio: '9:16',
            });
          }
        }

        updateCloneGeneratedVideo(i, { jobId: jobStatus.id, status: jobStatus });

        // Poll for completion
        const finalStatus = await sora.waitForCompletion(
          jobStatus.id,
          (status) => updateCloneGeneratedVideo(i, { status })
        );

        updateCloneGeneratedVideo(i, { status: finalStatus });
        previousVideoId = finalStatus.id;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '生成失败';
        updateCloneGeneratedVideo(i, {
          status: { id: '', status: 'failed', progress: 0, error: errMsg },
        });
        break; // Stop chain on failure
      }
    }

    setIsGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">
          视频生成 ({compiledWorlds.length} 段)
        </h4>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || compiledWorlds.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isGenerating || compiledWorlds.length === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Play size={14} />
              开始生成
            </>
          )}
        </button>
      </div>

      {/* Video grid */}
      {cloneGeneratedVideos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cloneGeneratedVideos.map((video) => (
            <div
              key={video.worldIndex}
              className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden"
            >
              {/* Video preview or placeholder */}
              <div className="aspect-[9/16] max-h-[300px] bg-slate-900 flex items-center justify-center relative">
                {video.status.status === 'completed' && video.status.videoUrl ? (
                  <video
                    src={video.status.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400 space-y-2">
                    {video.status.status === 'queued' && <p className="text-xs">等待中...</p>}
                    {video.status.status === 'processing' && (
                      <>
                        <Loader2 size={24} className="animate-spin mx-auto" />
                        <p className="text-xs">生成中 {video.status.progress}%</p>
                      </>
                    )}
                    {video.status.status === 'failed' && (
                      <p className="text-xs text-red-400">{video.status.error || '生成失败'}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Info bar */}
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  World {video.worldIndex + 1}
                  {compiledWorlds[video.worldIndex]?.isRemix ? ' (Remix)' : ' (First)'}
                </span>
                {video.status.status === 'completed' && video.status.videoUrl && (
                  <a
                    href={video.status.videoUrl}
                    download={`clone-world-${video.worldIndex + 1}.mp4`}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    <Download size={12} />
                    下载
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compiled prompts preview */}
      {compiledWorlds.length > 0 && cloneGeneratedVideos.length === 0 && (
        <div className="space-y-2">
          {compiledWorlds.map((world, i) => (
            <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-slate-600">
                  World {i + 1}
                </span>
                <span className="text-xs text-slate-400">
                  {world.isRemix ? 'Remix' : 'First'} · {world.suggestedDuration}s
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                {world.compiledPrompt.slice(0, 150)}...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

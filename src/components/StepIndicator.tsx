import { Package, Sparkles, Clapperboard, Video, FileCheck } from 'lucide-react';
import type { CloneStep } from '../store/useAppStore';

type CreateStep = 'input' | 'plan' | 'generate';

const createSteps = [
  { key: 'input' as CreateStep, label: '输入商品', icon: Package },
  { key: 'plan' as CreateStep, label: '选择方案', icon: Sparkles },
  { key: 'generate' as CreateStep, label: '批量生成', icon: Clapperboard },
];

const cloneSteps = [
  { key: 'input' as CloneStep, label: '输入素材', icon: Video },
  { key: 'result' as CloneStep, label: '复刻结果', icon: FileCheck },
];

interface StepIndicatorProps {
  mode: 'create' | 'clone';
  currentCreate?: CreateStep;
  currentClone?: CloneStep;
}

export function StepIndicator({ mode, currentCreate, currentClone }: StepIndicatorProps) {
  const steps = mode === 'create' ? createSteps : cloneSteps;
  const current = mode === 'create' ? currentCreate : currentClone;
  const currentIndex = steps.findIndex(s => s.key === current);

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;

        return (
          <div key={step.key} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && (
              <div className={`w-6 sm:w-12 h-0.5 ${isDone ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            )}
            <div className={`flex items-center gap-1.5 px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5 rounded-lg text-sm ${
              isActive
                ? 'bg-emerald-50 text-emerald-600 font-medium'
                : isDone
                  ? 'text-emerald-600'
                  : 'text-slate-400'
            }`}>
              <Icon size={16} />
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

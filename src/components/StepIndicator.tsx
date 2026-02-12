import { Package, Sparkles, Clapperboard } from 'lucide-react';

type Step = 'input' | 'plan' | 'generate';

const steps = [
  { key: 'input' as Step, label: '输入商品', icon: Package },
  { key: 'plan' as Step, label: '选择方案', icon: Sparkles },
  { key: 'generate' as Step, label: '批量生成', icon: Clapperboard },
];

interface StepIndicatorProps {
  current: Step;
}

export function StepIndicator({ current }: StepIndicatorProps) {
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
              <div className={`w-6 sm:w-12 h-0.5 ${isDone ? 'bg-blue-500' : 'bg-slate-200'}`} />
            )}
            <div className={`flex items-center gap-1.5 px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5 rounded-lg text-sm ${
              isActive
                ? 'bg-blue-50 text-blue-600 font-medium'
                : isDone
                  ? 'text-blue-600'
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

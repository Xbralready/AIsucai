import { useAppStore } from '../store/useAppStore';
import type { CloneStep } from '../store/useAppStore';
import { Home, Plus, Copy, RotateCcw, X } from 'lucide-react';

type CreateStep = 'input' | 'plan' | 'generate';

const NAV_ITEMS = [
  { mode: 'home' as const, label: '首页', icon: Home },
  { mode: 'create' as const, label: '从零创建', icon: Plus },
  { mode: 'clone' as const, label: '复刻爆款', icon: Copy },
];

const CREATE_STEPS = [
  { key: 'input' as CreateStep, label: '输入商品' },
  { key: 'plan' as CreateStep, label: '选择方案' },
  { key: 'generate' as CreateStep, label: '批量生成' },
];

const CLONE_STEPS = [
  { key: 'input' as CloneStep, label: '输入素材' },
  { key: 'result' as CloneStep, label: '复刻结果' },
];

export function Sidebar() {
  const {
    appMode, setAppMode,
    currentStep, cloneStep,
    resetCreate, resetClone, reset,
    sidebarOpen, setSidebarOpen,
  } = useAppStore();

  const handleNavClick = (mode: 'home' | 'create' | 'clone') => {
    if (mode === appMode) return;
    if (mode === 'home') {
      reset();
    } else {
      if (appMode === 'create') resetCreate();
      if (appMode === 'clone') resetClone();
      setAppMode(mode);
    }
    setSidebarOpen(false);
  };

  const handleReset = () => {
    if (appMode === 'create') resetCreate();
    else if (appMode === 'clone') resetClone();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center justify-between">
        <h1
          className="text-xl font-bold text-slate-900 tracking-tight cursor-pointer"
          onClick={() => { reset(); setSidebarOpen(false); }}
        >
          QI<span className="text-emerald-600">FU</span>
        </h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = appMode === item.mode;

          return (
            <div key={item.mode}>
              <button
                onClick={() => handleNavClick(item.mode)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                {item.label}
              </button>

              {/* Sub-steps for create mode */}
              {item.mode === 'create' && appMode === 'create' && (
                <div className="ml-9 mt-1 mb-2">
                  <VerticalSteps steps={CREATE_STEPS} currentStep={currentStep} />
                </div>
              )}

              {/* Sub-steps for clone mode */}
              {item.mode === 'clone' && appMode === 'clone' && (
                <div className="ml-9 mt-1 mb-2">
                  <VerticalSteps steps={CLONE_STEPS} currentStep={cloneStep} />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Reset button */}
      {appMode !== 'home' && (
        <div className="px-3 mb-2">
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw size={14} />
            重置当前流程
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">QIFU - AI Video Ad Generator</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 bg-white border-r border-slate-200 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-60 bg-white border-r border-slate-200 z-50
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

function VerticalSteps({ steps, currentStep }: {
  steps: { key: string; label: string }[];
  currentStep: string;
}) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        return (
          <div
            key={step.key}
            className={`text-xs py-1 pl-2 border-l-2 ${
              isActive
                ? 'border-emerald-500 text-emerald-600 font-medium'
                : isDone
                  ? 'border-emerald-300 text-emerald-500'
                  : 'border-slate-200 text-slate-400'
            }`}
          >
            {step.label}
          </div>
        );
      })}
    </div>
  );
}

import { useAppStore } from './store/useAppStore';
import { StepIndicator } from './components/StepIndicator';
import ProductInput from './pages/ProductInput';
import PlanSelect from './pages/PlanSelect';
import BatchGenerate from './pages/BatchGenerate';
import ModeSelect from './pages/ModeSelect';
import CloneInput from './pages/CloneInput';
import CloneResult from './pages/CloneResult';
import { RotateCcw, ArrowLeft } from 'lucide-react';

function App() {
  const {
    appMode, setAppMode,
    currentStep, reset,
    cloneStep,
    resetCreate, resetClone,
  } = useAppStore();

  const renderPage = () => {
    switch (appMode) {
      case 'home':
        return <ModeSelect />;

      case 'create':
        switch (currentStep) {
          case 'input': return <ProductInput />;
          case 'plan': return <PlanSelect />;
          case 'generate': return <BatchGenerate />;
          default: return <ProductInput />;
        }

      case 'clone':
        switch (cloneStep) {
          case 'input': return <CloneInput />;
          case 'result': return <CloneResult />;
          default: return <CloneInput />;
        }

      default:
        return <ModeSelect />;
    }
  };

  const handleBack = () => {
    if (appMode === 'create') {
      resetCreate();
    } else if (appMode === 'clone') {
      resetClone();
    }
    setAppMode('home');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {appMode !== 'home' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors mr-1"
                title="返回首页"
              >
                <ArrowLeft size={14} />
              </button>
            )}
            <h1
              className="text-xl font-bold text-slate-900 tracking-tight cursor-pointer"
              onClick={() => { reset(); }}
            >
              QI<span className="text-emerald-600">FU</span>
            </h1>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {appMode === 'clone' ? 'Clone Viral Video' : 'AI Video Ad Generator'}
            </span>
          </div>

          {appMode === 'create' && (
            <StepIndicator mode="create" currentCreate={currentStep} />
          )}
          {appMode === 'clone' && (
            <StepIndicator mode="clone" currentClone={cloneStep} />
          )}

          {appMode !== 'home' && (
            <button
              onClick={() => {
                if (appMode === 'create') resetCreate();
                else if (appMode === 'clone') resetClone();
              }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              title="重新开始"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">重置</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-10">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        QIFU - AI-Powered Batch Video Ad Generator
      </footer>
    </div>
  );
}

export default App;

import { useAppStore } from './store/useAppStore';
import { StepIndicator } from './components/StepIndicator';
import ProductInput from './pages/ProductInput';
import PlanSelect from './pages/PlanSelect';
import BatchGenerate from './pages/BatchGenerate';
import { RotateCcw } from 'lucide-react';

function App() {
  const { currentStep, reset } = useAppStore();

  const renderPage = () => {
    switch (currentStep) {
      case 'input': return <ProductInput />;
      case 'plan': return <PlanSelect />;
      case 'generate': return <BatchGenerate />;
      default: return <ProductInput />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              QI<span className="text-emerald-600">FU</span>
            </h1>
            <span className="text-xs text-slate-400 hidden sm:inline">AI Video Ad Generator</span>
          </div>

          <StepIndicator current={currentStep} />

          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            title="重新开始"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">重置</span>
          </button>
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

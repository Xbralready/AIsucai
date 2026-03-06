import { useAppStore } from './store/useAppStore';
import ProductInput from './pages/ProductInput';
import PlanSelect from './pages/PlanSelect';
import BatchGenerate from './pages/BatchGenerate';
import ModeSelect from './pages/ModeSelect';
import CloneInput from './pages/CloneInput';
import CloneResult from './pages/CloneResult';
import { Sidebar } from './components/Sidebar';
import { Menu } from 'lucide-react';

function App() {
  const {
    appMode,
    currentStep,
    cloneStep,
    toggleSidebar,
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={toggleSidebar}
            className="p-1.5 -ml-1.5 text-slate-500 hover:text-slate-700"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            QI<span className="text-emerald-600">FU</span>
          </h1>
          <span className="text-xs text-slate-400">
            {appMode === 'clone' ? 'Clone Viral Video' : 'AI Video Ad Generator'}
          </span>
        </div>
      </header>

      {/* Main content area */}
      <main className="lg:pl-60">
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;

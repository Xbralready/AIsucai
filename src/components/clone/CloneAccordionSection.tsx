import { ChevronDown } from 'lucide-react';

interface CloneAccordionSectionProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}

export function CloneAccordionSection({
  title,
  subtitle,
  isOpen,
  onToggle,
  badge,
  children,
}: CloneAccordionSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {badge && (
            <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">
              {badge}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-slate-400 hidden sm:inline">{subtitle}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-6 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

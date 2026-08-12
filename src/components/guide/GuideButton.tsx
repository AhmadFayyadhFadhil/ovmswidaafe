import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useGuide } from '@/hooks/useGuide';
import { getQuickTourForRole } from '@/guides';
import { useAuthContext } from '@/auth/authContext';

export function GuideButton() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthContext();
  const { availableTours, startTour, resetGuideProgress } = useGuide();

  const role = user?.role?.toLowerCase() || 'employee';
  const quickTour = getQuickTourForRole(role);
  const featureGuides = availableTours.filter(t => t.type === 'feature_guide');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTour = (tourId: string) => {
    setIsOpen(false);
    startTour(tourId);
  };

  const handleResetProgress = () => {
    setIsOpen(false);
    resetGuideProgress();
    if (quickTour) {
      startTour(quickTour.id);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Topbar Guide Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 sm:h-9 px-2.5 sm:px-3 bg-slate-100 hover:bg-slate-200 text-[#1e3a8a] text-[11px] sm:text-[12px] font-bold rounded-xl border border-slate-200/80 shadow-2xs transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95"
        title="Buka Menu Panduan / Interactive Guide"
        data-guide="guide-button"
      >
        <Icon name="help_outline" className="text-[16px] sm:text-[18px]" />
        <span>Guide</span>
      </button>

      {/* Guide Dropdown Menu */}
      {isOpen && (
        <>
          {/* Mobile backdrop to close dropdown on tap outside */}
          <div
            className="fixed inset-0 bg-black/25 backdrop-blur-[1px] z-[99998] sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed sm:absolute top-16 sm:top-full left-4 sm:left-auto right-4 sm:right-0 w-auto sm:w-64 max-w-sm mx-auto sm:mx-0 mt-0 sm:mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl py-2.5 z-[99999] animate-fadein text-slate-800">
            {/* Quick Tour Option */}
            {quickTour && (
              <div className="px-1.5">
                <button
                  onClick={() => handleSelectTour(quickTour.id)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50/70 hover:text-[#1e3a8a] transition-all flex items-start gap-2.5 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1e3a8a] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#1e3a8a] group-hover:text-white transition-colors">
                    <Icon name="explore" className="text-[16px]" />
                  </div>
                  <div>
                    <div className="text-[12.5px] font-bold text-slate-900 leading-tight">
                      Quick Tour
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-0.5">
                      Tur singkat fitur utama {role.toUpperCase()}
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Feature Guides Section */}
            {featureGuides.length > 0 && (
              <div className="px-1.5 mt-1 pt-1 border-t border-slate-100">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Feature Guides
                </div>
                {featureGuides.map(tour => (
                  <button
                    key={tour.id}
                    onClick={() => handleSelectTour(tour.id)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2 text-[12px] font-semibold text-slate-700 cursor-pointer"
                  >
                    <Icon name="library_books" className="text-slate-400 text-[16px]" />
                    <span className="truncate">{tour.title}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Settings / Reset Option */}
            <div className="px-1.5 mt-1 pt-1 border-t border-slate-100">
              <button
                onClick={handleResetProgress}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all flex items-center gap-2 text-[11.5px] font-semibold cursor-pointer"
              >
                <Icon name="restart_alt" className="text-slate-400 text-[16px]" />
                <span>Reset & Ulangi Panduan</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

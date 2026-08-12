import { Icon } from '@/components/ui/Icon';

interface WelcomeGuideModalProps {
  isOpen: boolean;
  onStartGuide: () => void;
  onMaybeLater: () => void;
}

export function WelcomeGuideModal({
  isOpen,
  onStartGuide,
  onMaybeLater,
}: WelcomeGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadein">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center flex flex-col items-center animate-fadeup">
        {/* Welcome Icon Badge */}
        <div className="w-16 h-16 bg-blue-50 text-[#1e3a8a] rounded-2xl flex items-center justify-center mb-5 shadow-sm">
          <Icon name="explore" className="text-3xl" />
        </div>

        {/* Header Title */}
        <h2 className="text-[22px] font-extrabold text-slate-900 tracking-tight">
          Welcome to OVMS
        </h2>

        {/* Subtitle Body */}
        <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-xs">
          Take a quick tour to learn how the system works.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-6">
          <button
            onClick={onStartGuide}
            className="w-full sm:flex-1 h-12 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Icon name="play_arrow" className="text-lg" /> Start Guide
          </button>

          <button
            onClick={onMaybeLater}
            className="w-full sm:flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center justify-center cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

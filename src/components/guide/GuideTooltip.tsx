import { useEffect } from 'react';
import type { GuideStep } from '@/guides/types';
import { Icon } from '@/components/ui/Icon';

interface GuideTooltipProps {
  step: GuideStep;
  currentStepIndex: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

export function GuideTooltip({
  step,
  currentStepIndex,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onSkip,
  onFinish,
}: GuideTooltipProps) {
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  // Keyboard navigation support (ESC = Skip, Right = Next, Left = Prev)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isLast) onFinish();
        else onNext();
      } else if (e.key === 'ArrowLeft' && !isFirst) {
        onPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFirst, isLast, onNext, onPrev, onSkip, onFinish]);

  // Compute position relative to target element or screen center if target not visible
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 99999,
  };

  if (targetRect) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 768;

    if (isMobile) {
      // Mobile positioning: bottom fixed sheet or centered to prevent overflow
      tooltipStyle = {
        position: 'fixed',
        bottom: '24px',
        left: '16px',
        right: '16px',
        margin: '0 auto',
        maxWidth: '420px',
        zIndex: 99999,
      };
    } else {
      // Desktop positioning around targetRect
      const margin = 16;
      let top = targetRect.bottom + margin;
      let left = targetRect.left;

      // Adjust if overflowing bottom
      if (top + 220 > viewportHeight) {
        top = Math.max(16, targetRect.top - 230);
      }
      // Adjust if overflowing right
      if (left + 340 > viewportWidth) {
        left = Math.max(16, viewportWidth - 360);
      }

      tooltipStyle = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: '340px',
        zIndex: 99999,
      };
    }
  }

  return (
    <div
      style={tooltipStyle}
      className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 animate-fadein text-slate-800 focus:outline-none"
      role="dialog"
      aria-labelledby="guide-step-title"
      aria-describedby="guide-step-desc"
    >
      {/* Step Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#1e3a8a] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
          Langkah {currentStepIndex + 1} dari {totalSteps}
        </span>
        <button
          onClick={onSkip}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Tutup / Skip Guide (ESC)"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>

      {/* Title & Description */}
      <h3 id="guide-step-title" className="text-[15px] font-extrabold text-slate-900 tracking-tight mb-1.5">
        {step.title}
      </h3>
      <p id="guide-step-desc" className="text-[12.5px] text-slate-600 leading-relaxed mb-4 whitespace-pre-line">
        {step.description}
      </p>

      {/* Progress Dots Indicator */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStepIndex
                  ? 'w-5 bg-[#1e3a8a]'
                  : i < currentStepIndex
                  ? 'w-2 bg-blue-300'
                  : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              onClick={onPrev}
              className="h-8 px-3 rounded-xl border border-slate-200 text-[11.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Back
            </button>
          )}

          {isLast ? (
            <button
              onClick={onFinish}
              className="h-8 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-[11.5px] font-bold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
            >
              Finish <Icon name="check" className="text-[14px]" />
            </button>
          ) : (
            <button
              onClick={onNext}
              className="h-8 px-4 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-[11.5px] font-bold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
            >
              Next <Icon name="arrow_forward" className="text-[14px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

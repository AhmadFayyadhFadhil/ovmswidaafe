import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/auth/authContext';
import type { TourConfig, GuideStep, GuideRole } from '@/guides/types';
import { getToursForRole, getQuickTourForRole } from '@/guides';
import { GuideTooltip } from './GuideTooltip';
import { WelcomeGuideModal } from './WelcomeGuideModal';

export interface GuideContextType {
  activeTour: TourConfig | null;
  currentStepIndex: number;
  currentStep: GuideStep | null;
  isOpen: boolean;
  availableTours: TourConfig[];
  startTour: (tourId?: string) => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  finishTour: () => void;
  resetGuideProgress: () => void;
}

export const GuideContext = createContext<GuideContextType | undefined>(undefined);

export function GuideProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();

  const [activeTour, setActiveTour] = useState<TourConfig | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);
  const [, setIsWaitingForElement] = useState<boolean>(false);

  const role = (user?.role?.toLowerCase() || 'employee') as GuideRole;
  const availableTours = getToursForRole(role);

  // Check first-time login for Welcome Modal
  useEffect(() => {
    if (!user) return;
    const welcomeKey = `ovms_guide_welcome_${user.id || user.nik || role}`;
    const hasSeenWelcome = localStorage.getItem(welcomeKey);
    if (!hasSeenWelcome) {
      setIsWelcomeModalOpen(true);
    }
  }, [user, role]);

  const handleCloseWelcome = (start: boolean) => {
    if (user) {
      const welcomeKey = `ovms_guide_welcome_${user.id || user.nik || role}`;
      localStorage.setItem(welcomeKey, 'true');
    }
    setIsWelcomeModalOpen(false);
    if (start) {
      const quickTour = getQuickTourForRole(role);
      if (quickTour) {
        startTour(quickTour.id);
      }
    }
  };

  const currentStep = activeTour?.steps[currentStepIndex] || null;

  // Helper function to check if a DOM element is physically visible in the viewport
  const isElementVisible = (el: Element): boolean => {
    const rect = el.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.left >= 0 &&
      rect.top >= 0 &&
      rect.left < window.innerWidth &&
      rect.top < window.innerHeight
    );
  };

  // Find & measure target element rect in DOM
  const updateTargetRect = useCallback(() => {
    if (!currentStep) {
      setTargetRect(null);
      return;
    }

    const selector = currentStep.targetSelector;
    let el: Element | null = null;

    if (selector.startsWith('[')) {
      el = document.querySelector(selector);
    } else {
      el = document.querySelector(`[data-guide="${selector}"]`) || document.querySelector(selector);
    }

    // Check if element exists AND is physically visible on screen
    if (el && isElementVisible(el)) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      setIsWaitingForElement(false);
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    } else {
      // Fallback: search for prominent page-level container elements if sidebar target is collapsed
      const fallbackEl = document.querySelector('[data-guide$="-header"]') ||
                         document.querySelector('[data-guide$="-stats"]') ||
                         document.querySelector('[data-guide$="-overview"]') ||
                         document.querySelector('[data-guide$="-trips"]') ||
                         document.querySelector('[data-guide$="-cards"]');
      if (fallbackEl && isElementVisible(fallbackEl)) {
        const rect = fallbackEl.getBoundingClientRect();
        setTargetRect(rect);
        setIsWaitingForElement(false);
        fallbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } else {
        setTargetRect(null);
        setIsWaitingForElement(true);
      }
    }
  }, [currentStep]);

  // Route change or Step change trigger
  useEffect(() => {
    if (!activeTour || !currentStep) return;

    // Check if step specifies another route
    if (currentStep.route && location.pathname !== currentStep.route.split('?')[0]) {
      setIsWaitingForElement(true);
      navigate(currentStep.route);
      return;
    }

    // Try finding element immediately
    updateTargetRect();

    // Poll for DOM element render if page transition is occurring
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      updateTargetRect();
      if (attempts >= 20) {
        clearInterval(interval);
      }
    }, 200);

    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [activeTour, currentStepIndex, currentStep, location.pathname, navigate, updateTargetRect]);

  const startTour = (tourId?: string) => {
    let tourToStart = availableTours.find(t => t.id === tourId);
    if (!tourToStart) {
      tourToStart = getQuickTourForRole(role) || availableTours[0];
    }

    if (tourToStart && tourToStart.steps.length > 0) {
      const firstStep = tourToStart.steps[0];
      if (firstStep?.route && location.pathname !== firstStep.route.split('?')[0]) {
        navigate(firstStep.route);
      }
      setActiveTour(tourToStart);
      setCurrentStepIndex(0);
    }
  };

  const stopTour = () => {
    setActiveTour(null);
    setCurrentStepIndex(0);
    setTargetRect(null);
  };

  const finishTour = () => {
    if (activeTour && user) {
      const completionKey = `ovms_guide_${role}_${activeTour.id}_completed`;
      localStorage.setItem(completionKey, 'true');
    }
    stopTour();
  };

  const nextStep = () => {
    if (!activeTour) return;
    if (currentStepIndex < activeTour.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const resetGuideProgress = () => {
    if (!user) return;
    const welcomeKey = `ovms_guide_welcome_${user.id || user.nik || role}`;
    localStorage.removeItem(welcomeKey);
    availableTours.forEach(t => {
      localStorage.removeItem(`ovms_guide_${role}_${t.id}_completed`);
    });
  };

  return (
    <GuideContext.Provider
      value={{
        activeTour,
        currentStepIndex,
        currentStep,
        isOpen: !!activeTour,
        availableTours,
        startTour,
        stopTour,
        nextStep,
        prevStep,
        finishTour,
        resetGuideProgress,
      }}
    >
      {children}

      {/* First-time login welcome modal */}
      <WelcomeGuideModal
        isOpen={isWelcomeModalOpen}
        onStartGuide={() => handleCloseWelcome(true)}
        onMaybeLater={() => handleCloseWelcome(false)}
      />

      {/* Active Tour Spotlight & Tooltip Overlay */}
      {activeTour && currentStep && (
        <>
          {/* Dimmed backdrop overlay */}
          <div className="fixed inset-0 z-[99997] bg-black/50 transition-opacity duration-300" />

          {/* Spotlight box highlighting current target element */}
          {targetRect && (
            <div
              style={{
                position: 'fixed',
                top: `${targetRect.top - 6}px`,
                left: `${targetRect.left - 6}px`,
                width: `${targetRect.width + 12}px`,
                height: `${targetRect.height + 12}px`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 15px rgba(30, 58, 138, 0.6)',
                borderRadius: '12px',
                zIndex: 99998,
                pointerEvents: 'none',
              }}
              className="transition-all duration-300 border-2 border-[#1e3a8a] bg-transparent"
            />
          )}

          {/* Interactive Step Tooltip Card */}
          <GuideTooltip
            step={currentStep}
            currentStepIndex={currentStepIndex}
            totalSteps={activeTour.steps.length}
            targetRect={targetRect}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={stopTour}
            onFinish={finishTour}
          />
        </>
      )}
    </GuideContext.Provider>
  );
}

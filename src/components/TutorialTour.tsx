import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X, Play, Award, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "./ui/button";
import { feedback } from "@/lib/feedback";

export type TourStep = {
  targetId: string; // DOM element ID, or 'center' for modal style
  title: string;
  description: string;
  actionText?: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "center",
    title: "Welcome to SafePool! 🌊",
    description: "Your frictionless, student-first financial engine. Tap, save, and sweep your way to your savings goals. Let's take a quick 1-minute tour to see how to master your money!",
    actionText: "Let's Go! 🚀",
  },
  {
    targetId: "tour-balance-card",
    title: "Safe Pool Balance 💰",
    description: "This is your main active balance. Any money you receive or spend flows through here. Since we reset it, you are starting fresh with a clean $0.00 slate!",
  },
  {
    targetId: "tour-numpad-card",
    title: "Log Spend & Income ⌨️",
    description: "Logging cash is simple. Select Spend or Income, select a category on the right, and use this keypad to enter the amount. Tap 'Review & confirm' to save it!",
  },
  {
    targetId: "tour-vault-card",
    title: "The Savings Vault 🔒",
    description: "Want to tuck money away? The Vault is your secure pocket. Click 'Sweep' to transfer excess cash from your active balance directly into your Vault.",
  },
  {
    targetId: "tour-goal-btn",
    title: "Configure Savings Goal 🎯",
    description: "Set a savings target! Define a goal amount, select a category icon, and set a date. The dashboard progress ring will track your savings journey.",
  },
  {
    targetId: "tour-activity-link",
    title: "Activity & Insights 📊",
    description: "Check your transaction history log, category summaries, and beautiful donut charts of your spending habits on the Activity & Insights page.",
  },
  {
    targetId: "center",
    title: "You're Ready to Roll! 🚀",
    description: "That's it! SafePool is completely local-first, meaning your data stays securely on your device. Let's start by entering your first Income transaction!",
    actionText: "Start Tracking! 🌊",
  },
];

type Props = {
  onClose: () => void;
};

export function TutorialTour({ onClose }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = TOUR_STEPS[stepIndex];

  // 1. Scroll target into view when stepIndex changes
  useEffect(() => {
    if (step.targetId === "center") return;
    const el = document.getElementById(step.targetId);
    if (el) {
      const timer = setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [stepIndex, step.targetId]);

  // Apply styling/glow to highlighted element
  useEffect(() => {
    if (step.targetId === "center") return;
    const el = document.getElementById(step.targetId);
    if (!el) return;

    // Apply highlighting classes
    const originalZIndex = el.style.zIndex;
    const originalPosition = el.style.position;
    const originalPointerEvents = el.style.pointerEvents;
    const originalTransition = el.style.transition;

    el.style.position = "relative";
    el.style.zIndex = "60";
    el.style.pointerEvents = "auto";
    el.style.transition = "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)";
    el.classList.add("ring-4", "ring-emerald", "ring-offset-4", "ring-offset-background", "shadow-[0_0_40px_rgba(16,185,129,0.35)]");

    return () => {
      el.style.zIndex = originalZIndex;
      el.style.position = originalPosition;
      el.style.pointerEvents = originalPointerEvents;
      el.style.transition = originalTransition;
      el.classList.remove("ring-4", "ring-emerald", "ring-offset-4", "ring-offset-background", "shadow-[0_0_40px_rgba(16,185,129,0.35)]");
    };
  }, [stepIndex, step.targetId]);

  const handleNext = () => {
    feedback.tap();
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      localStorage.setItem("safepool_tutorial_completed", "true");
      onClose();
    }
  };

  const handlePrev = () => {
    feedback.tap();
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleSkip = () => {
    feedback.warning();
    localStorage.setItem("safepool_tutorial_completed", "true");
    onClose();
  };

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  if (typeof window === "undefined" || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.65 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#06080b] backdrop-blur-[1.5px] pointer-events-auto"
      />

      {/* Floating Spotlight Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -15 }}
          transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
          className="relative glass-elevated border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col pointer-events-auto select-none w-full max-w-[360px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald flex items-center gap-1.5">
              <Sparkles className="size-3" /> SafePool Guide · {stepIndex + 1} of {TOUR_STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-white/5"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-4 space-y-2">
            <h3 className="font-display font-bold text-lg text-text-primary">
              {step.title}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Steps Progress Dots */}
          <div className="flex justify-center gap-1.5 mt-5">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-200 ${
                  idx === stepIndex ? "w-4 bg-emerald" : "w-1 bg-border-strong"
                }`}
              />
            ))}
          </div>

          {/* Buttons Navigation */}
          <div className="flex items-center justify-between gap-3 mt-6">
            {!isFirst && !isLast ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                className="text-xs h-9 rounded-xl px-3 flex items-center gap-1 border border-border/40 hover:bg-white/5"
              >
                <ChevronLeft className="size-4" /> Back
              </Button>
            ) : (
              !isLast && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-xs h-9 rounded-xl px-3 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  Skip
                </Button>
              )
            )}

            <Button
              onClick={handleNext}
              size="sm"
              className={`h-9 rounded-xl font-semibold px-4 ml-auto flex items-center gap-1.5 ${
                isFirst || isLast ? "w-full justify-center glow-emerald bg-emerald text-primary-foreground" : "bg-emerald text-primary-foreground"
              }`}
              style={{ background: "var(--emerald)", color: "var(--bg)" }}
            >
              {step.actionText ? (
                <>
                  {step.actionText}
                </>
              ) : isLast ? (
                <>
                  Start Tracking <Award className="size-4 ml-1" />
                </>
              ) : (
                <>
                  Next <ChevronRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}

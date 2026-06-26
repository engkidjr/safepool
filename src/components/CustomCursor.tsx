import { useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/**
 * Custom glowing orb cursor with magnetic snap on interactive elements.
 * Hidden on touch devices for accessibility.
 */
export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Check for magnetic snap targets
      const target = e.target as HTMLElement;
      const interactive = target.closest(
        "button, a, [role='button'], input, .magnetic-target"
      );

      if (interactive) {
        const rect = interactive.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Magnetic pull — cursor drifts toward center of interactive element
        const pullStrength = 0.3;
        cursorX.set(e.clientX + (centerX - e.clientX) * pullStrength);
        cursorY.set(e.clientY + (centerY - e.clientY) * pullStrength);
        setIsHovering(true);
      } else {
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
        setIsHovering(false);
      }

      if (!isVisible) setIsVisible(true);
    },
    [cursorX, cursorY, isVisible]
  );

  const handleMouseDown = useCallback(() => setIsClicking(true), []);
  const handleMouseUp = useCallback(() => setIsClicking(false), []);
  const handleMouseLeave = useCallback(() => setIsVisible(false), []);
  const handleMouseEnter = useCallback(() => setIsVisible(true), []);

  useEffect(() => {
    // Detect touch devices
    const isTouch =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
    if (isTouch) return;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.documentElement.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.documentElement.removeEventListener(
        "mouseleave",
        handleMouseLeave
      );
      document.documentElement.removeEventListener(
        "mouseenter",
        handleMouseEnter
      );
    };
  }, [
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
    handleMouseEnter,
  ]);

  if (isTouchDevice) return null;

  return (
    <>
      {/* Outer glow ring */}
      <motion.div
        className="custom-cursor-ring"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
          width: isHovering ? 56 : 40,
          height: isHovering ? 56 : 40,
          borderRadius: "50%",
          border: `2px solid oklch(0.78 0.17 162 / ${isHovering ? "60%" : "30%"})`,
          boxShadow: isHovering
            ? "0 0 20px oklch(0.78 0.17 162 / 40%), 0 0 60px oklch(0.78 0.17 162 / 15%)"
            : "0 0 12px oklch(0.78 0.17 162 / 20%)",
          pointerEvents: "none" as const,
          zIndex: 99999,
          opacity: isVisible ? 1 : 0,
          transition:
            "width 0.3s cubic-bezier(0.25, 1, 0.5, 1), height 0.3s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s, box-shadow 0.3s, opacity 0.2s",
          mixBlendMode: "screen" as const,
        }}
      />
      {/* Inner dot */}
      <motion.div
        className="custom-cursor-dot"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
          width: isClicking ? 12 : isHovering ? 8 : 6,
          height: isClicking ? 12 : isHovering ? 8 : 6,
          borderRadius: "50%",
          background: "oklch(0.78 0.17 162)",
          boxShadow: "0 0 10px oklch(0.78 0.17 162 / 60%)",
          pointerEvents: "none" as const,
          zIndex: 99999,
          opacity: isVisible ? 1 : 0,
          transition:
            "width 0.15s, height 0.15s, opacity 0.2s",
        }}
      />
      {/* Click ripple */}
      {isClicking && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0.6 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            x: smoothX,
            y: smoothY,
            translateX: "-50%",
            translateY: "-50%",
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "1px solid oklch(0.78 0.17 162 / 40%)",
            pointerEvents: "none" as const,
            zIndex: 99998,
          }}
        />
      )}
    </>
  );
}

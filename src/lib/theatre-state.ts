import { getProject } from "@theatre/core";

// Theatre.js project for SafePool animations
export const safePoolProject = getProject("SafePool", {
  // In production, you'd load a saved state JSON here:
  // state: savedState,
});

// Main intro animation sheet
export const introSheet = safePoolProject.sheet("Intro");

// Scroll-linked parallax sheet
export const scrollSheet = safePoolProject.sheet("Scroll");

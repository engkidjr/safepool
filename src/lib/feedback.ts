import { useApp } from "./store";

// Web Audio synthesis for tactile feedback. No assets, no network.
let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freqStart: number, freqEnd: number, duration: number, type: OscillatorType = "sine", gain = 0.08) {
  // Haptics/Audio feedback disabled globally
  return;

  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 30), c.currentTime + duration);
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export const feedback = {
  tap: () => tone(420, 200, 0.08, "sine", 0.05),
  save: () => {
    [261.63, 329.63, 392].forEach((f, i) => setTimeout(() => tone(f, f, 0.22, "triangle", 0.06), i * 60));
  },
  warning: () => tone(220, 110, 0.25, "square", 0.05),
  sweep: () => tone(180, 880, 0.5, "sawtooth", 0.04),
};

import { useEffect, useMemo, useState, lazy, Suspense, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet,
  Vault,
  Plus,
  Minus,
  Target,
  Sparkles,
  Check,
  X,
  Cloud,
  Lock,
  ChevronRight,
  Trash2,
  Calendar,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Settings,
  Shield,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp, generateId, type Category, type RecurringPayment, type RecurringInterval } from "@/lib/store";
import { feedback } from "@/lib/feedback";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TutorialTour } from "@/components/TutorialTour";
import { toast } from "sonner";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const HeroScene = lazy(() =>
  import("@/components/HeroScene").then((m) => ({ default: m.HeroScene }))
);

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafePool — Student Financial Engine" },
      { name: "description", content: "Frictionless local-first money tracker for students. Tap, save, sweep, grow." },
    ],
  }),
  component: SafePoolPage,
});

function formatMoney(n: number) {
  const currency = useApp.getState().currency || "USD";
  return n.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 2 });
}

const sectionVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 1, 0.5, 1] },
  }),
};

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex.split("").map(x => x + x).join("");
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (val: number) => {
    const hexStr = Math.round((val + m) * 255).toString(16);
    return hexStr.length === 1 ? "0" + hexStr : hexStr;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function SafePoolPage() {
  const balance = useApp((s) => s.balance);
  const vault = useApp((s) => s.vault);
  const goal = useApp((s) => s.goal);
  const transactions = useApp((s) => s.transactions);
  const addTransaction = useApp((s) => s.addTransaction);
  const sweepToVault = useApp((s) => s.sweepToVault);
  const setGoal = useApp((s) => s.setGoal);

  // Separate custom categories
  const incomeCategories = useApp((s) => s.incomeCategories);
  const expenseCategories = useApp((s) => s.expenseCategories);
  const addCustomCategory = useApp((s) => s.addCustomCategory);

  // Recurring Payments
  const recurringPayments = useApp((s) => s.recurringPayments);
  const addRecurringPayment = useApp((s) => s.addRecurringPayment);
  const removeRecurringPayment = useApp((s) => s.removeRecurringPayment);
  const processOverdueRecurringPayments = useApp((s) => s.processOverdueRecurringPayments);

  // Cloud Sync & Performance Mode
  const cloudSync = useApp((s) => s.cloudSync);
  const setCloudSync = useApp((s) => s.setCloudSync);
  const setPerformanceMode = useApp((s) => s.setPerformanceMode);
  const performanceMode = useApp((s) => s.performanceMode);
  const crystalColor = useApp((s) => s.crystalColor);
  const setCrystalColor = useApp((s) => s.setCrystalColor);
  const bgAnimation = useApp((s) => s.bgAnimation);

  const [customColorOpen, setCustomColorOpen] = useState(false);
  const hsl = useMemo(() => hexToHsl(crystalColor), [crystalColor]);

  const handleHslChange = (key: "h" | "s" | "l", value: number) => {
    const newHsl = { ...hsl, [key]: value };
    const hex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
    setCrystalColor(hex);
  };
  const setBgAnimation = useApp((s) => s.setBgAnimation);
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);

  // Background Settings Selectors
  const bgAntigravityCount = useApp((s) => s.bgAntigravityCount);
  const setBgAntigravityCount = useApp((s) => s.setBgAntigravityCount);
  const bgAntigravityMagnetRadius = useApp((s) => s.bgAntigravityMagnetRadius);
  const setBgAntigravityMagnetRadius = useApp((s) => s.setBgAntigravityMagnetRadius);
  const bgAntigravityParticleSize = useApp((s) => s.bgAntigravityParticleSize);
  const setBgAntigravityParticleSize = useApp((s) => s.setBgAntigravityParticleSize);
  const bgAntigravityWaveSpeed = useApp((s) => s.bgAntigravityWaveSpeed);
  const setBgAntigravityWaveSpeed = useApp((s) => s.setBgAntigravityWaveSpeed);
  const bgAntigravityShape = useApp((s) => s.bgAntigravityShape);
  const setBgAntigravityShape = useApp((s) => s.setBgAntigravityShape);

  const bgGalaxyStarSpeed = useApp((s) => s.bgGalaxyStarSpeed);
  const setBgGalaxyStarSpeed = useApp((s) => s.setBgGalaxyStarSpeed);
  const bgGalaxyGlowIntensity = useApp((s) => s.bgGalaxyGlowIntensity);
  const setBgGalaxyGlowIntensity = useApp((s) => s.setBgGalaxyGlowIntensity);
  const bgGalaxyHueShift = useApp((s) => s.bgGalaxyHueShift);
  const setBgGalaxyHueShift = useApp((s) => s.setBgGalaxyHueShift);

  const bgLiquidEtherMouseForce = useApp((s) => s.bgLiquidEtherMouseForce);
  const setBgLiquidEtherMouseForce = useApp((s) => s.setBgLiquidEtherMouseForce);
  const bgLiquidEtherCursorSize = useApp((s) => s.bgLiquidEtherCursorSize);
  const setBgLiquidEtherCursorSize = useApp((s) => s.setBgLiquidEtherCursorSize);
  const bgLiquidEtherIsViscous = useApp((s) => s.bgLiquidEtherIsViscous);
  const setBgLiquidEtherIsViscous = useApp((s) => s.setBgLiquidEtherIsViscous);
  const bgLiquidEtherViscous = useApp((s) => s.bgLiquidEtherViscous);
  const setBgLiquidEtherViscous = useApp((s) => s.setBgLiquidEtherViscous);
  const bgLiquidEtherAutoSpeed = useApp((s) => s.bgLiquidEtherAutoSpeed);
  const setBgLiquidEtherAutoSpeed = useApp((s) => s.setBgLiquidEtherAutoSpeed);
  const bgLiquidEtherAutoIntensity = useApp((s) => s.bgLiquidEtherAutoIntensity);
  const setBgLiquidEtherAutoIntensity = useApp((s) => s.setBgLiquidEtherAutoIntensity);
  const bgLiquidEtherIsBounce = useApp((s) => s.bgLiquidEtherIsBounce);
  const setBgLiquidEtherIsBounce = useApp((s) => s.setBgLiquidEtherIsBounce);
  const bgLiquidEtherResolution = useApp((s) => s.bgLiquidEtherResolution);
  const setBgLiquidEtherResolution = useApp((s) => s.setBgLiquidEtherResolution);



  // Local Page UI state
  const [mode, setMode] = useState<"in" | "out">("out");
  const [raw, setRaw] = useState("");
  const [category, setCategory] = useState("Food");
  const [shake, setShake] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [pulseWeight, setPulseWeight] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store security selectors
  const currency = useApp((s) => s.currency) || "USD";
  const setCurrency = useApp((s) => s.setCurrency);
  const hapticsEnabled = useApp((s) => s.hapticsEnabled);
  const setHapticsEnabled = useApp((s) => s.setHapticsEnabled);
  const removeCategory = useApp((s) => s.removeCategory);
  const passcodeHash = useApp((s) => s.passcodeHash);
  const failedAttempts = useApp((s) => s.failedAttempts);
  const lockoutUntil = useApp((s) => s.lockoutUntil);
  const setPasscode = useApp((s) => s.setPasscode);
  const incrementFailedAttempts = useApp((s) => s.incrementFailedAttempts);
  const resetFailedAttempts = useApp((s) => s.resetFailedAttempts);
  const setLockout = useApp((s) => s.setLockout);

  // Local states
  const [editCategoriesMode, setEditCategoriesMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cookieConsentOpen, setCookieConsentOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const consented = localStorage.getItem("safepool_data_consent");
      if (!consented) {
        setCookieConsentOpen(true);
      }
    }
  }, []);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [pinSetupError, setPinSetupError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Dialog Openers
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sweepOpen, setSweepOpen] = useState(false);
  const [sweepAmt, setSweepAmt] = useState("");
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(goal));
  const [customCatOpen, setCustomCatOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);


  // New custom category form state
  const [catName, setCatName] = useState("");
  const [catEmoji, setCatEmoji] = useState("✨");
  const [catColor, setCatColor] = useState("var(--emerald)");

  // New recurring payment form state
  const [recName, setRecName] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recInterval, setRecInterval] = useState<RecurringInterval>("monthly");
  const [recType, setRecType] = useState<"in" | "out">("out");
  const [recCategory, setRecCategory] = useState("Fun");


  const [isSyncing, setIsSyncing] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardMode, setOnboardMode] = useState<"local" | "cloud">("local");
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardPin, setOnboardPin] = useState("");
  const [onboardConfirmPin, setOnboardConfirmPin] = useState("");
  const [onboardPinError, setOnboardPinError] = useState<string | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});
  const [showTutorial, setShowTutorial] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteRecurringId, setDeleteRecurringId] = useState<string | null>(null);

  // Trigger tutorial after onboarding forms are finished
  useEffect(() => {
    const onboarded = localStorage.getItem("safepool_onboarded") === "true";
    const tutorialDone = localStorage.getItem("safepool_tutorial_completed") === "true";
    if (onboarded && !tutorialDone && !onboardOpen) {
      const timer = setTimeout(() => setShowTutorial(true), 800);
      return () => clearTimeout(timer);
    }
  }, [onboardOpen]);

  // Loading Settings
  const [autoProcessedLogs, setAutoProcessedLogs] = useState<string[]>([]);

  // Auto trigger process on mount
  useEffect(() => {
    setGoalDraft(String(goal));
  }, [goal]);

  useEffect(() => {
    // Process recurring payments and log any executions
    const runLogs = processOverdueRecurringPayments();
    if (runLogs.length > 0) {
      setAutoProcessedLogs(runLogs);
    }
  }, []);

  // Lockout and passcode lifecycle
  useEffect(() => {
    if (!lockoutUntil) return;
    const updateLockout = () => {
      const remaining = Math.max(0, Math.ceil((new Date(lockoutUntil).getTime() - Date.now()) / 1000));
      setLockoutTimeLeft(remaining);
      if (remaining === 0) {
        setLockout(null);
        resetFailedAttempts();
      }
    };
    updateLockout();
    const interval = setInterval(updateLockout, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  useEffect(() => {
    if (pin.length === 4) {
      handlePinSubmit(pin);
    }
  }, [pin]);

  const handlePinSubmit = async (enteredPin: string) => {
    if (lockoutTimeLeft > 0) return;
    
    const hash = await sha256(enteredPin);
    if (hash === passcodeHash) {
      feedback.tap();
      setIsUnlocked(true);
      resetFailedAttempts();
      setPin("");
      setPinError(null);
    } else {
      feedback.warning();
      incrementFailedAttempts();
      setPin("");
      
      const newFailedAttempts = failedAttempts + 1;
      if (newFailedAttempts >= 5) {
        const lockoutEnd = new Date(Date.now() + 60000).toISOString();
        setLockout(lockoutEnd);
        setPinError("Too many failed attempts. Locked out for 60 seconds.");
      } else {
        setPinError(`Incorrect passcode. ${5 - newFailedAttempts} attempts remaining.`);
      }
    }
  };

  const handleEnableAppLock = async () => {
    if (newPin.length !== 4) {
      setPinSetupError("Passcode must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinSetupError("Passcodes do not match.");
      return;
    }
    const hash = await sha256(newPin);
    setPasscode(hash);
    resetFailedAttempts();
    setNewPin("");
    setConfirmPin("");
    setPinSetupError(null);
    setShowPinSetup(false);
    feedback.save();
  };

  const handleDisableAppLock = async () => {
    const hash = await sha256(currentPinInput);
    if (hash === passcodeHash) {
      setPasscode(null);
      resetFailedAttempts();
      setCurrentPinInput("");
      setPinSetupError(null);
      setShowPinSetup(false);
      feedback.save();
    } else {
      feedback.warning();
      setPinSetupError("Incorrect passcode.");
    }
  };

  // Set default category when mode switches
  useEffect(() => {
    const list = mode === "out" ? expenseCategories : incomeCategories;
    if (list.length > 0) {
      setCategory(list[0].key);
    }
  }, [mode, incomeCategories, expenseCategories]);
  // Check onboarding on mount
  useEffect(() => {
    const onboarded = localStorage.getItem("safepool_onboarded");
    if (!onboarded) {
      setOnboardOpen(true);
    }
  }, []);

  const completeOnboarding = (enableSync: boolean) => {
    localStorage.setItem("safepool_onboarded", "true");
    setOnboardOpen(false);
    setOnboardStep(1);
    feedback.sweep();
    if (enableSync) {
      linkWithGoogle();
    }
  };

  const handleSaveOnboardPin = async () => {
    if (!onboardPin) {
      setOnboardPinError("Please enter a PIN or skip.");
      return;
    }
    if (onboardPin.length !== 4 || !/^\d+$/.test(onboardPin)) {
      setOnboardPinError("PIN must be exactly 4 digits.");
      return;
    }
    if (onboardPin !== onboardConfirmPin) {
      setOnboardPinError("PINs do not match.");
      return;
    }
    const hash = await sha256(onboardPin);
    setPasscode(hash);
    resetFailedAttempts();
    setOnboardPin("");
    setOnboardConfirmPin("");
    setOnboardPinError(null);
    completeOnboarding(onboardMode === "cloud");
  };
  const handleSkipOnboardPin = () => {
    setOnboardPin("");
    setOnboardConfirmPin("");
    setOnboardPinError(null);
    completeOnboarding(onboardMode === "cloud");
  };

  const amount = useMemo(() => (raw ? parseInt(raw, 10) / 100 : 0), [raw]);

  const press = (k: string) => {
    feedback.tap();
    if (k === "del") return setRaw((r) => r.slice(0, -1));
    if (k === ".") return;
    setRaw((r) => (r + k).slice(0, 9));
  };

  const trySave = () => {
    const amountStr = amount.toFixed(2);
    const isValidFormat = /^\d{1,10}(\.\d{2})?$/.test(amountStr);
    
    if (amount <= 0 || !isValidFormat) {
      setShake(true); feedback.warning(); setError("Invalid amount entered.");
      setTimeout(() => setShake(false), 600); return;
    }
    if (mode === "out" && amount > balance) {
      setShake(true); feedback.warning(); setError("Not enough in your pool.");
      setTimeout(() => setShake(false), 600); return;
    }
    setError(null); setConfirmOpen(true);
  };

  // Keyboard entry support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setRaw("");
        setError(null);
        setPressedKeys((prev) => ({ ...prev, esc: true }));
        return;
      }

      let keyStr = "";
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        press(e.key);
        keyStr = e.key;
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        press("del");
        keyStr = "del";
      } else if (e.key === "Enter") {
        e.preventDefault();
        trySave();
        keyStr = "enter";
      } else if (e.key === ".") {
        e.preventDefault();
        keyStr = ".";
      }

      if (keyStr) {
        setPressedKeys((prev) => ({ ...prev, [keyStr]: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      let keyStr = "";
      if (e.key >= "0" && e.key <= "9") keyStr = e.key;
      else if (e.key === "Backspace" || e.key === "Delete") keyStr = "del";
      else if (e.key === "Enter") keyStr = "enter";
      else if (e.key === ".") keyStr = ".";
      else if (e.key === "Escape") keyStr = "esc";

      if (keyStr) {
        setPressedKeys((prev) => ({ ...prev, [keyStr]: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [raw, amount, mode, balance, category]);

  const confirmSave = () => {
    addTransaction({ id: generateId(), type: mode, amount, category, timestamp: new Date().toISOString() });
    feedback.save();
    setPulse(true);
    setPulseWeight(true);
    setTimeout(() => setPulse(false), 500);
    setTimeout(() => setPulseWeight(false), 200);
    setRaw("");
    setConfirmOpen(false);
    toast.success(`${mode === "in" ? "Income" : "Expense"} of ${formatMoney(amount)} recorded`, {
      description: `Category: ${category}`,
    });
  };

  const doSweep = () => {
    const amt = parseFloat(sweepAmt);
    if (!amt || amt <= 0 || amt > balance) {
      setShake(true); feedback.warning(); setTimeout(() => setShake(false), 600); return;
    }
    sweepToVault(amt); feedback.sweep(); setSweepAmt(""); setSweepOpen(false);
    toast.success(`${formatMoney(amt)} swept to vault`, {
      description: "Funds moved from balance to savings vault.",
    });
  };

  const saveCustomCategory = () => {
    const cleanName = catName.replace(/<[^>]*>/g, "").trim();
    if (!cleanName) return;
    addCustomCategory(mode, cleanName, catEmoji, catColor);
    setCategory(cleanName);
    setCatName("");
    setCustomCatOpen(false);
    feedback.save();
  };

  const saveRecurringPayment = () => {
    const amt = parseFloat(recAmount);
    const cleanName = recName.replace(/<[^>]*>/g, "").trim();
    if (!cleanName || isNaN(amt) || amt <= 0) return;

    addRecurringPayment({
      id: generateId(),
      name: cleanName,
      type: recType,
      amount: amt,
      category: recCategory,
      interval: recInterval,
      lastProcessed: new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + (recInterval === "weekly" ? 7 : recInterval === "biweekly" ? 14 : 30) * 86400000).toISOString(),
    });

    setRecName("");
    setRecAmount("");
    setRecurringOpen(false);
    feedback.save();
  };

  const linkWithGoogle = async () => {
    setIsLinking(true);
    feedback.tap();
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const cloudData = userDocSnap.data();
        useApp.getState().restoreState({
          balance: cloudData.balance ?? 0,
          vault: cloudData.vault ?? 0,
          goal: cloudData.goal ?? 0,
          transactions: cloudData.transactions ?? [],
          recurringPayments: cloudData.recurringPayments ?? [],
        });

        if (cloudData.incomeCategories) {
          useApp.setState({ incomeCategories: cloudData.incomeCategories });
        }
        if (cloudData.expenseCategories) {
          useApp.setState({ expenseCategories: cloudData.expenseCategories });
        }
        if (cloudData.currency) {
          useApp.setState({ currency: cloudData.currency });
        }
        if (cloudData.passcodeHash !== undefined) {
          useApp.setState({ passcodeHash: cloudData.passcodeHash });
        }

        toast.success("Linked & Synced via Google", {
          description: "Existing financial data has been downloaded.",
        });
      } else {
        const currentState = useApp.getState();
        await setDoc(userDocRef, {
          balance: currentState.balance,
          vault: currentState.vault,
          goal: currentState.goal,
          transactions: currentState.transactions,
          recurringPayments: currentState.recurringPayments,
          incomeCategories: currentState.incomeCategories,
          expenseCategories: currentState.expenseCategories,
          currency: currentState.currency,
          passcodeHash: currentState.passcodeHash,
          lastUpdated: new Date().toISOString(),
        });

        // Trigger welcome email document creation in firestore (runs on signup)
        try {
          await setDoc(doc(db, "mail", user.uid + "_welcome"), {
            to: user.email,
            message: {
              subject: "Welcome to SafePool! 💸",
              text: `Hi ${user.displayName || "there"}!\n\nWelcome to SafePool, your student financial engine. We're excited to help you manage your funds, sweep savings, and hit your goals!\n\nYour account is now synced across all devices.\n\nCheers,\nThe SafePool Team`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <h2 style="color: #10b981; font-family: 'Outfit', sans-serif;">Welcome to SafePool! 💸</h2>
                  <p>Hi ${user.displayName || "there"},</p>
                  <p>Welcome to SafePool, your student financial engine. We're excited to help you manage your funds, sweep savings, and hit your goals!</p>
                  <p>Your transactions, vault savings, and recurring subscriptions are now securely synced to Google Cloud.</p>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                  <p style="font-size: 11px; color: #64748b;">This welcome email was dispatched automatically on signup.</p>
                </div>
              `
            }
          });
          toast.success("Welcome Email Scheduled", {
            description: `Sent welcome email to ${user.email} (Trigger Email).`,
          });
        } catch (mailErr) {
          console.warn("Could not dispatch welcome email via Firestore Trigger: ", mailErr);
        }

        toast.success("Linked & Uploaded to Cloud", {
          description: "Local data has been synced to your Google account.",
        });
      }

      setCloudSync({
        linked: true,
        provider: "firebase",
        email: user.email || "Google Account",
        lastSync: new Date().toISOString(),
      });
      setIsLinking(false);
      feedback.sweep();
    } catch (err: any) {
      console.error("Google Auth Sync Connection Error:", err);
      setIsLinking(false);
      feedback.warning();
      
      if (err.code === "auth/popup-blocked") {
        toast.error("Popup Blocked", {
          description: "Please allow popups in your browser settings to sign in with Google.",
        });
      } else {
        toast.error("Google Sign-In Failed", {
          description: err.message || "Could not complete authorization with Google.",
        });
      }
    }
  };

  const unlinkCloudAccount = async () => {
    feedback.warning();
    if (cloudSync.provider === "firebase") {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Sign out error:", err);
      }
    }
    setCloudSync({
      linked: false,
      provider: undefined,
      email: undefined,
      lastSync: undefined,
    });
  };

  const forceCloudSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    feedback.tap();

    if (cloudSync.provider === "firebase" && auth.currentUser) {
      try {
        const user = auth.currentUser;
        const userDocRef = doc(db, "users", user.uid);
        const currentState = useApp.getState();
        await setDoc(userDocRef, {
          balance: currentState.balance,
          vault: currentState.vault,
          goal: currentState.goal,
          transactions: currentState.transactions,
          recurringPayments: currentState.recurringPayments,
          incomeCategories: currentState.incomeCategories,
          expenseCategories: currentState.expenseCategories,
          currency: currentState.currency,
          passcodeHash: currentState.passcodeHash,
          lastUpdated: new Date().toISOString(),
        });
        setCloudSync({
          lastSync: new Date().toISOString(),
        });
        setIsSyncing(false);
        feedback.save();
        toast.success("Synchronized successfully");
      } catch (err: any) {
        console.error("Manual sync failed:", err);
        setIsSyncing(false);
        toast.error("Sync failed", {
          description: err.message || "Could not reach database.",
        });
      }
      return;
    }

    setTimeout(() => {
      setCloudSync({
        lastSync: new Date().toISOString(),
      });
      setIsSyncing(false);
      feedback.save();
    }, 1500);
  };

  const activeCategories = mode === "out" ? expenseCategories : incomeCategories;
  const goalProgress = Math.min(100, (vault / Math.max(goal, 1)) * 100);



  // Lock Screen Interceptor
  if (passcodeHash && !isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0B0D10] text-foreground flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="max-w-xs w-full flex flex-col items-center">
          <div className="size-16 rounded-2xl bg-emerald/10 border border-emerald/20 flex items-center justify-center mb-6">
            <Lock className="size-6 text-emerald" />
          </div>
          
          <h2 className="text-xl font-bold tracking-tight">SafePool Locked</h2>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Enter your 4-digit passcode to access the student financial engine.
          </p>

          {/* Dots Indicator */}
          <div className="flex gap-4 my-8">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`size-3 rounded-full border transition-all duration-150 ${
                  pin.length > index
                    ? "bg-emerald border-emerald scale-110 shadow-[0_0_10px_var(--glow-mint)]"
                    : "border-border bg-transparent"
                }`}
              />
            ))}
          </div>

          {pinError && (
            <p className="text-xs text-rose-500 text-center font-medium min-h-[24px] leading-normal mb-4 font-mono">
              {pinError}
            </p>
          )}

          {lockoutTimeLeft > 0 ? (
            <div className="text-center text-xs text-muted-foreground p-3 rounded-xl bg-muted/30 border border-border/40 w-full mb-8 font-mono">
              Locked out. Try again in <span className="font-semibold text-foreground">{lockoutTimeLeft}s</span>
            </div>
          ) : (
            /* PIN Keyboard Grid */
            <div className="grid grid-cols-3 gap-3 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    feedback.tap();
                    if (pin.length < 4) setPin((prev) => prev + num);
                  }}
                  className="h-14 rounded-2xl bg-surface hover:bg-surface-2 border border-border/40 text-xl font-bold flex items-center justify-center transition-colors active:scale-95 duration-100"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  feedback.tap();
                  setPin("");
                }}
                className="h-14 rounded-2xl bg-transparent text-sm font-semibold flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 duration-100"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  feedback.tap();
                  if (pin.length < 4) setPin((prev) => prev + "0");
                }}
                className="h-14 rounded-2xl bg-surface hover:bg-surface-2 border border-border/40 text-xl font-bold flex items-center justify-center transition-colors active:scale-95 duration-100"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  feedback.tap();
                  if (pin.length > 0) setPin((prev) => prev.slice(0, -1));
                }}
                className="h-14 rounded-2xl bg-transparent text-sm font-semibold flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 duration-100"
              >
                ⌫
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MAIN APPLICATION VIEW
  return (
    <div className="min-h-screen aurora-bg text-foreground">
      {/* Top nav */}
      <header className="border-b border-border/40 glass sticky top-0 z-30">
        <div className="mx-auto max-w-6xl header-inner flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-emerald/20 flex items-center justify-center">
              <Sparkles className="size-4 text-emerald" style={{ color: "var(--emerald)" }} />
            </div>
            <span className="font-display font-extrabold text-lg tracking-tight">SafePool</span>
            <span className="desktop-tagline ml-3 text-xs text-muted-foreground">Track your spend, save for goals, sync across devices</span>
          </div>
          <nav className="desktop-nav items-center gap-6 text-sm">
            <span className="text-foreground font-semibold">Dashboard</span>
            <Link id="tour-activity-link" to="/activity" className="text-muted-foreground hover:text-foreground transition-colors">
              Activity & Insights
            </Link>
          </nav>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                feedback.tap();
                setShowTutorial(true);
              }}
              className="desktop-btn text-muted-foreground border-border/40 hover:text-foreground"
            >
              <HelpCircle className="size-4 mr-1.5" /> Guide
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                feedback.tap();
                setSettingsOpen(true);
              }}
              className="text-muted-foreground border-border/40 hover:text-foreground"
            >
              <Settings className="size-4" />
              <span className="desktop-text ml-1.5">Settings</span>
            </Button>
            <Button id="tour-goal-btn" variant="outline" size="sm" onClick={() => { feedback.tap(); setGoalOpen(true); }}>
              <Target className="size-4" />
              <span className="desktop-text ml-1.5">Set goal</span>
            </Button>
          </div>
        </div>
      </header>

      <main id="maincontent" className="mx-auto max-w-6xl main-content space-y-6">
        {autoProcessedLogs.length > 0 && (
          <div className="bg-emerald-soft/50 border border-emerald/20 p-4 rounded-3xl flex items-start gap-3">
            <AlertCircle className="size-5 text-emerald shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-emerald">Automatic payments processed</h4>
              <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                {autoProcessedLogs.map((log, i) => (
                  <li key={i}>• {log}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setAutoProcessedLogs([])}
              className="ml-auto text-xs text-emerald hover:underline font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero / dashboard with 3D crystal scene */}
        <motion.section
          id="dashboard"
          className="hero-scene-wrapper"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          role="region"
          aria-labelledby="balance-heading"
        >
          {/* 3D Crystal Background or Eco Ambient shadow */}
          {performanceMode === "immersive" ? (
            <Suspense fallback={null}>
              <HeroScene />
            </Suspense>
          ) : (
            <div 
              className="absolute inset-0 pointer-events-none -z-10 rounded-3xl"
              style={{
                background: "var(--surface)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          )}

          <div className="relative z-10 grid md:grid-cols-3 gap-5">
            <Card id="tour-balance-card" className={`md:col-span-2 p-8 glass-elevated gradient-border rounded-3xl overflow-hidden relative ${pulse ? "animate-pulsate-fwd" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Wallet className="size-4" aria-hidden="true" /> <span id="balance-heading">Safe Pool balance</span>
                </div>
                <Link
                  to="/activity"
                  className="text-xs text-emerald flex items-center gap-1 hover:underline"
                >
                  View Activity <ChevronRight className="size-3" />
                </Link>
              </div>
              <motion.div
                key={balance}
                initial={{ y: 12, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  fontWeight: pulseWeight ? 700 : 500,
                  scale: pulse ? 1.03 : 1
                }}
                transition={{
                  fontWeight: { duration: 0.2, ease: "easeInOut" },
                  scale: { duration: 0.2, ease: "easeInOut" },
                  default: { duration: 0.45, ease: [0.25, 1, 0.5, 1] }
                }}
                style={{
                  fontFeatureSettings: "'tnum'",
                  letterSpacing: "-0.025em",
                }}
                className="mt-3 font-mono balance-text text-text-primary"
                aria-live="polite"
                aria-atomic="true"
              >
                {formatMoney(balance)}
              </motion.div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded-full bg-muted/60">{transactions.length === 0 ? "No transactions yet" : `${transactions.length} entries`}</span>
                <span className="px-2 py-1 rounded-full bg-muted/60">
                  {cloudSync.linked ? `Synced via ${cloudSync.provider?.toUpperCase()}` : "🔒 Local-first mode"}
                </span>
              </div>
            </Card>

            <Card id="tour-vault-card" className="p-6 rounded-3xl glass gradient-border flex flex-col" role="region" aria-labelledby="vault-heading">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Vault className="size-4" aria-hidden="true" /> <span id="vault-heading">Vault</span>
                </div>
                <button
                  type="button"
                  onClick={() => { feedback.tap(); setSweepOpen(true); }}
                  className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted transition-colors"
                  title="Move excess balance into your savings vault"
                  aria-label="Sweep funds to vault"
                >
                  Sweep →
                </button>
              </div>
              <div 
                className="mt-3 font-mono font-medium text-3xl tracking-tight text-text-primary"
                style={{ fontFeatureSettings: "'tnum'", letterSpacing: "-0.025em" }}
                aria-live="polite"
                aria-atomic="true"
              >
                {formatMoney(vault)}
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Goal · {formatMoney(goal)}</span>
                  <span className="tabular">{goalProgress.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgress}%` }}
                    transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                    style={{
                      background: "linear-gradient(90deg, var(--emerald), var(--sky))",
                      boxShadow: "0 0 8px var(--emerald)"
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </motion.section>

        {/* Numpad + categories */}
        <motion.section id="numpad" className="grid md:grid-cols-5 gap-5"
          custom={1} initial="hidden" animate="visible" variants={sectionVariants}
          role="region" aria-labelledby="numpad-heading"
        >
          <Card id="tour-numpad-card" className={`md:col-span-3 p-6 rounded-3xl glass gradient-border ${shake ? "animate-shake-horizontal" : ""}`}>
            <h2 id="numpad-heading" className="sr-only">Transaction entry</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex p-1 rounded-full bg-muted/50">
                {(["out", "in"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => { feedback.tap(); setMode(m); }}
                    aria-label={m === "out" ? "Switch to spend mode" : "Switch to income mode"}
                    className={`px-4 py-1.5 text-sm rounded-full transition-all ${
                      mode === m ? "bg-background/80 shadow text-foreground font-semibold" : "text-muted-foreground"
                    }`}>
                    {m === "out"
                      ? <span className="inline-flex items-center gap-1"><Minus className="size-3" aria-hidden="true" /> Spend</span>
                      : <span className="inline-flex items-center gap-1"><Plus className="size-3" aria-hidden="true" /> Income</span>}
                  </button>
                ))}
              </div>
              {error && <span className="text-xs text-destructive">{error}</span>}
            </div>

            <div className="rounded-2xl bg-muted/20 px-6 py-8 text-center mb-5 overflow-hidden backdrop-blur-sm">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{category}</div>
              <div className="font-display font-black tabular text-5xl md:text-6xl mt-2 h-16 flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                  <motion.span key={raw || "zero"}
                    initial={{ y: 24, opacity: 0, filter: "blur(8px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: -24, opacity: 0, filter: "blur(8px)" }}
                    transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                    className={amount ? "" : "text-muted-foreground/50"}>
                    {amount ? formatMoney(amount) : formatMoney(0)}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["1","2","3","4","5","6","7","8","9",".","0","del"].map((k, i) => {
                const isPressed = pressedKeys[k];
                return (
                  <motion.button key={k} type="button" onClick={() => press(k)}
                    aria-label={k === "del" ? "Delete last digit" : k === "." ? "Decimal point" : `Digit ${k}`}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ y: -3, boxShadow: "0 8px 25px var(--glow-mint)" }}
                    animate={{
                      scale: isPressed ? 0.92 : 1,
                      y: isPressed ? 0 : undefined,
                      boxShadow: isPressed ? "0 0 15px var(--glow-mint)" : "none",
                      borderColor: isPressed ? "var(--accent-primary)" : "rgba(255,255,255,0.06)",
                      background: isPressed ? "var(--surface-3)" : undefined,
                      opacity: 1,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    initial={{ opacity: 0, y: 12 }}
                    // @ts-expect-error transition delay
                    style={{ transitionDelay: `${i * 25}ms` }}
                    className="h-16 rounded-2xl glass-elevated hover:bg-muted font-display text-2xl font-bold tabular border border-border/30">
                    {k === "del" ? "⌫" : k}
                  </motion.button>
                );
              })}
            </div>

            <Button type="button" onClick={trySave}
              className="mt-5 w-full h-14 rounded-2xl text-base font-semibold glow-emerald"
              style={{ background: "var(--emerald)", color: "var(--primary-foreground)" }}>
              <Check className="size-5" aria-hidden="true" /> Review & confirm
            </Button>
          </Card>

          <Card className="md:col-span-2 p-6 rounded-3xl glass gradient-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {mode === "out" ? "Expense Categories" : "Income Categories"}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      feedback.tap();
                      setEditCategoriesMode(!editCategoriesMode);
                    }}
                    className={`h-7 text-[11px] rounded-lg border-border/40 hover:bg-muted ${
                      editCategoriesMode ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border-rose-500/40" : ""
                    }`}
                  >
                    {editCategoriesMode ? "Done" : "Manage"}
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      feedback.tap();
                      setCustomCatOpen(true);
                    }}
                    className="h-7 text-[11px] rounded-lg border-border/40 hover:bg-muted"
                  >
                    <Plus className="size-3 mr-0.5" /> Custom
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activeCategories.map((c, i) => {
                  const active = category === c.key;
                  return (
                    <motion.button key={c.key}
                      type="button"
                      aria-label={`Select category ${c.key}`}
                      onClick={() => {
                        if (editCategoriesMode) return;
                        feedback.tap();
                        setCategory(c.key);
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={editCategoriesMode ? {} : { scale: 1.03 }}
                      whileTap={editCategoriesMode ? {} : { scale: 0.97 }}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        active ? "border-transparent" : "border-border/40 hover:border-border"
                      }`}
                      style={active ? { background: "var(--emerald-soft)", color: "var(--emerald)" } : {}}>
                      <div className="text-xl" aria-hidden="true">{c.emoji}</div>
                      <div className="text-sm font-medium mt-1 truncate">{c.key}</div>
                      
                      {editCategoriesMode && c.key !== "Other" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            feedback.warning();
                            removeCategory(mode, c.key);
                          }}
                          className="absolute top-2 right-2 size-5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 flex items-center justify-center text-rose-400 border border-rose-500/30 text-[10px] focus:outline-none"
                        >
                          ✕
                        </button>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Automatic Recurring Payments & Cloud Sync Settings Section */}
        <motion.section
          className="grid md:grid-cols-2 gap-5"
          custom={2}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          {/* Recurring Payments card */}
          <Card className="p-6 rounded-3xl glass gradient-border flex flex-col justify-between space-y-4" role="region" aria-labelledby="recurring-heading">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="size-5 text-emerald" aria-hidden="true" />
                  <h3 id="recurring-heading" className="font-display font-extrabold text-lg">Recurring Payments</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    feedback.tap();
                    setRecurringOpen(true);
                  }}
                  className="rounded-xl border-border/40 hover:bg-muted"
                >
                  <Plus className="size-4 mr-1" /> Add recurring
                </Button>
              </div>

              <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
                {recurringPayments.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    No recurring payments or subscriptions scheduled yet.
                  </p>
                ) : (
                  recurringPayments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/20"
                    >
                      <div>
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          {p.name}
                          <span className="text-[9px] px-1 bg-muted/60 text-muted-foreground rounded uppercase font-bold">
                            {p.interval}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Next billing: {new Date(p.nextBillingDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-sm font-bold tabular"
                          style={p.type === "in" ? { color: "var(--emerald)" } : {}}
                        >
                          {p.type === "in" ? "+" : "-"}{formatMoney(p.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            feedback.tap();
                            setDeleteRecurringId(p.id);
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={`Delete ${p.name} subscription`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Cloud Host Sync Card */}
          <Card className="p-6 rounded-3xl glass gradient-border flex flex-col justify-between space-y-4" role="region" aria-labelledby="cloud-sync-heading">
            <fieldset className="border-0 p-0 m-0">
              <legend className="sr-only">Cloud Sync Configuration</legend>
              <div className="flex items-center gap-2">
                <Cloud className="size-5 text-emerald" aria-hidden="true" />
                <h3 id="cloud-sync-heading" className="font-display font-extrabold text-lg">Cloud Sync</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Synchronize your financial logs and vault goals between your computer and mobile devices.
              </p>

              {cloudSync.linked ? (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-soft/20 border border-emerald/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald animate-pulse" />
                      Linked to Google Cloud
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {cloudSync.lastSync ? `Synced: ${new Date(cloudSync.lastSync).toLocaleTimeString()}` : "Not synced"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    Account: {cloudSync.email}
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-2xl bg-muted/20 border border-border/20 space-y-1">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Status: 🔒 Local-First Private
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Your transactions are stored locally in your browser's cache. Link your Google account below to sync online.
                  </p>
                </div>
              )}
            </fieldset>

            <div className="flex gap-2">
              {cloudSync.linked ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={forceCloudSync}
                    className="flex-1 rounded-xl border-border/40 hover:bg-muted text-xs flex items-center justify-center gap-1.5"
                    disabled={isSyncing}
                  >
                    <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Syncing..." : "Sync Now"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={unlinkCloudAccount}
                    className="flex-1 rounded-xl border-border/40 hover:bg-muted text-xs text-rose-400 hover:text-rose-300"
                  >
                    Unlink Google
                  </Button>
                </>
              ) : (
                <Button
                  onClick={linkWithGoogle}
                  className="w-full h-11 rounded-xl text-xs font-semibold glow-emerald flex items-center justify-center gap-2"
                  style={{ background: "var(--emerald)", color: "var(--primary-foreground)" }}
                  disabled={isLinking}
                >
                  {isLinking ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <svg className="size-4 mr-1" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  {isLinking ? "Connecting Google..." : "Link Google Account"}
                </Button>
              )}
            </div>
          </Card>

        </motion.section>
      </main>

      {/* dialogs */}

      {/* Confirm transaction dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl glass-elevated">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Confirm {mode === "in" ? "income" : "spend"}
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-2xl bg-muted/20 p-6 text-center backdrop-blur-sm">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{category}</div>
            <div className="font-display font-black tabular text-5xl mt-2">
              {mode === "in" ? "+" : "-"}{formatMoney(amount)}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              New balance · {formatMoney(mode === "in" ? balance + amount : balance - amount)}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => { feedback.tap(); setConfirmOpen(false); }}>
              <X className="size-4" /> Cancel
            </Button>
            <Button onClick={confirmSave} className="glow-emerald"
              style={{ background: "var(--emerald)", color: "var(--primary-foreground)" }}>
              <Check className="size-4" /> Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sweep dialog */}
      <Dialog open={sweepOpen} onOpenChange={setSweepOpen}>
        <DialogContent className="rounded-3xl glass-elevated">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Sweep to vault</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Amount to move from pool → vault</Label>
            <Input type="number" inputMode="decimal" placeholder="0.00"
              value={sweepAmt} onChange={(e) => setSweepAmt(e.target.value)}
              className="h-14 text-2xl font-display tabular" />
            <p className="text-xs text-muted-foreground">Available: {formatMoney(balance)}</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setSweepOpen(false)}>Cancel</Button>
            <Button onClick={doSweep} className="glow-emerald"
              style={{ background: "var(--emerald)", color: "var(--primary-foreground)" }}>
              <Check className="size-4" /> Confirm sweep
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal dialog */}
      <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
        <DialogContent className="rounded-3xl glass-elevated">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Vault goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Target amount</Label>
            <Input type="number" inputMode="decimal" value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              className="h-14 text-2xl font-display tabular" />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setGoalOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              const n = parseFloat(goalDraft);
              if (n > 0) { setGoal(n); feedback.save(); setGoalOpen(false); }
            }} className="glow-emerald"
              style={{ background: "var(--emerald)", color: "var(--primary-foreground)" }}>
              <Check className="size-4" /> Save goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add custom category dialog */}
      <Dialog open={customCatOpen} onOpenChange={setCustomCatOpen}>
        <DialogContent className="rounded-3xl glass-elevated">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create Custom Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="catName">Category Name</Label>
              <Input
                id="catName"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Freelance, Rent, Subscriptions"
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="catEmoji">Emoji Icon</Label>
                <select
                  id="catEmoji"
                  value={catEmoji}
                  onChange={(e) => setCatEmoji(e.target.value)}
                  className="w-full bg-background border border-border h-11 rounded-xl px-3 focus:outline-none"
                >
                  <option value="💻">💻 Code</option>
                  <option value="🍿">🍿 Movie</option>
                  <option value="🛍️">🛍️ Shopping</option>
                  <option value="🎁">🎁 Gifts</option>
                  <option value="🚗">🚗 Travel</option>
                  <option value="📈">📈 Investments</option>
                  <option value="🩺">🩺 Health</option>
                  <option value="⚡">⚡ Utility</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="catColor">Color accent</Label>
                <select
                  id="catColor"
                  value={catColor}
                  onChange={(e) => setCatColor(e.target.value)}
                  className="w-full bg-background border border-border h-11 rounded-xl px-3 focus:outline-none"
                >
                  <option value="var(--emerald)">Emerald (Green)</option>
                  <option value="var(--sky)">Sky (Blue)</option>
                  <option value="var(--violet)">Violet (Purple)</option>
                  <option value="var(--amber)">Amber (Orange)</option>
                  <option value="var(--rose)">Rose (Red)</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setCustomCatOpen(false)}>Cancel</Button>
            <Button onClick={saveCustomCategory} className="glow-emerald"
              style={{ background: "var(--emerald)", color: "var(--primary-foreground)" }}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add recurring payment dialog */}
      <Dialog open={recurringOpen} onOpenChange={setRecurringOpen}>
        <DialogContent className="rounded-3xl glass-elevated">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add Recurring Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRecType("out")}
                className={`py-2 rounded-xl text-xs font-semibold border ${
                  recType === "out" ? "bg-rose-400/20 text-rose-300 border-transparent" : "border-border/40 text-muted-foreground"
                }`}
              >
                Expense (Subscription)
              </button>
              <button
                onClick={() => setRecType("in")}
                className={`py-2 rounded-xl text-xs font-semibold border ${
                  recType === "in" ? "bg-emerald/20 text-emerald border-transparent" : "border-border/40 text-muted-foreground"
                }`}
              >
                Income (Recurring)
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recName">Payment Name</Label>
              <Input
                id="recName"
                value={recName}
                onChange={(e) => setRecName(e.target.value)}
                placeholder="e.g. Spotify, Gym, Monthly Allowance"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="recAmount">Amount</Label>
                <Input
                  id="recAmount"
                  type="number"
                  placeholder="0.00"
                  value={recAmount}
                  onChange={(e) => setRecAmount(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recInterval">Frequency</Label>
                <select
                  id="recInterval"
                  value={recInterval}
                  onChange={(e) => setRecInterval(e.target.value as any)}
                  className="w-full bg-background border border-border h-11 rounded-xl px-3 focus:outline-none"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 Weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recCategory">Category</Label>
              <select
                id="recCategory"
                value={recCategory}
                onChange={(e) => setRecCategory(e.target.value)}
                className="w-full bg-background border border-border h-11 rounded-xl px-3 focus:outline-none"
              >
                {(recType === "out" ? expenseCategories : incomeCategories).map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.emoji} {c.key}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setRecurringOpen(false)}>Cancel</Button>
            <Button onClick={saveRecurringPayment} className="glow-emerald"
              style={{ background: "var(--emerald)", color: "var(--primary-foreground)" }}>
              Schedule Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Onboarding Preference Dialog */}
      <Dialog open={onboardOpen} onOpenChange={(open) => {
        if (!open) {
          handleSkipOnboardPin();
          return;
        }
        setOnboardOpen(open);
      }}>
        <DialogContent className="rounded-[24px] border border-white/10 bg-surface p-8 max-w-md shadow-2xl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          {onboardStep === 1 ? (
            <>
              <DialogHeader className="text-left">
                <DialogTitle className="font-display text-2xl text-text-primary">
                  Where should your data live?
                </DialogTitle>
                <p className="text-xs text-text-secondary mt-1">
                  You can change this sync preference anytime in Settings.
                </p>
              </DialogHeader>

              {/* Two option cards */}
              <div className="flex flex-col gap-3 mt-4">
                <motion.div
                  onClick={() => { feedback.tap(); setOnboardMode("local"); }}
                  whileHover={{ y: -2 }}
                  className="flex items-start gap-3.5 p-4 rounded-2xl border text-left cursor-pointer transition-all"
                  style={{
                    borderColor: onboardMode === "local" ? "var(--accent-primary)" : "var(--border)",
                    background: "var(--surface)",
                    boxShadow: onboardMode === "local" ? "0 0 12px var(--glow-mint)" : "none"
                  }}
                >
                  <div className="text-2xl mt-0.5">🔒</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-text-primary">Local-First Private</h4>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                      Everything stays on this device. Maximum privacy, no account needed.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  onClick={() => { feedback.tap(); setOnboardMode("cloud"); }}
                  whileHover={{ y: -2 }}
                  className="flex items-start gap-3.5 p-4 rounded-2xl border text-left cursor-pointer transition-all"
                  style={{
                    borderColor: onboardMode === "cloud" ? "var(--accent-primary)" : "var(--border)",
                    background: "var(--surface)",
                    boxShadow: onboardMode === "cloud" ? "0 0 12px var(--glow-mint)" : "none"
                  }}
                >
                  <div className="text-2xl mt-0.5">☁️</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-text-primary">Linked Cloud Backup</h4>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                      Sync across devices. Sign in once, never lose your data.
                    </p>
                  </div>
                </motion.div>
              </div>

              <Button
                onClick={() => { feedback.tap(); setOnboardStep(2); }}
                className="w-full mt-6 bg-accent-primary text-black font-semibold rounded-[999px] py-3 h-11"
                style={{ background: "var(--accent-primary)", color: "var(--bg)" }}
              >
                Continue →
              </Button>
            </>
          ) : (
            <>
              <DialogHeader className="text-left">
                <DialogTitle className="font-display text-2xl text-text-primary">
                  Secure SafePool
                </DialogTitle>
                <p className="text-xs text-text-secondary mt-1">
                  Choose a 4-digit PIN lock to secure your local financial engine (Optional).
                </p>
              </DialogHeader>

              <div className="space-y-4 mt-6">
                <div className="space-y-1.5">
                  <Label htmlFor="onboard-pin" className="text-xs text-muted-foreground font-mono">Create 4-Digit PIN</Label>
                  <Input
                    id="onboard-pin"
                    type="password"
                    maxLength={4}
                    value={onboardPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setOnboardPin(val);
                      setOnboardPinError(null);
                    }}
                    className="bg-surface border-border/40 text-center font-mono text-xl tracking-widest h-12"
                    placeholder="••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="onboard-confirm-pin" className="text-xs text-muted-foreground font-mono">Confirm PIN</Label>
                  <Input
                    id="onboard-confirm-pin"
                    type="password"
                    maxLength={4}
                    value={onboardConfirmPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setOnboardConfirmPin(val);
                      setOnboardPinError(null);
                    }}
                    className="bg-surface border-border/40 text-center font-mono text-xl tracking-widest h-12"
                    placeholder="••••"
                  />
                </div>

                {onboardPinError && (
                  <p className="text-xs text-rose-500 font-mono text-center">{onboardPinError}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-6">
                <Button
                  onClick={handleSaveOnboardPin}
                  className="w-full bg-accent-primary text-black font-semibold rounded-[999px] py-3 h-11"
                  style={{ background: "var(--accent-primary)", color: "var(--bg)" }}
                >
                  Save PIN & Finish
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSkipOnboardPin}
                  className="w-full text-xs text-muted-foreground hover:text-text-primary rounded-[999px]"
                >
                  Skip Security Lock
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto pr-4 scrollbar-thin bg-surface text-foreground border-border rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">System Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 my-4">
            {/* Currency Select */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">Preferred Currency</Label>
              <select
                value={currency}
                onChange={(e) => {
                  feedback.tap();
                  setCurrency(e.target.value);
                }}
                className="w-full bg-surface-2 border border-border/40 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="JPY">JPY (¥) - Japanese Yen</option>
                <option value="CAD">CAD (CA$) - Canadian Dollar</option>
                <option value="AUD">AUD (A$) - Australian Dollar</option>
                <option value="GHS">GHS (GH₵) - Ghanaian Cedi</option>
                <option value="KES">KES (KSh) - Kenyan Shilling</option>
              </select>
            </div>

            {/* Performance Mode */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">Performance Rendering</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    feedback.tap();
                    setPerformanceMode("eco");
                  }}
                  className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                    performanceMode === "eco"
                      ? "border-emerald bg-emerald-soft/30 text-emerald"
                      : "border-border/40 hover:bg-surface-2"
                  }`}
                >
                  🌱 Eco Mode
                </button>
                <button
                  onClick={() => {
                    feedback.tap();
                    setPerformanceMode("immersive");
                  }}
                  className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                    performanceMode === "immersive"
                      ? "border-emerald bg-emerald-soft/30 text-emerald"
                      : "border-border/40 hover:bg-surface-2"
                  }`}
                >
                  💎 Immersive
                </button>
              </div>
            </div>

            {/* Interface Theme (Light / Dark Mode) */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">Interface Theme</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    feedback.tap();
                    setTheme("light");
                  }}
                  className={`p-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    theme === "light"
                      ? "border-emerald bg-emerald-soft/30 text-emerald font-semibold"
                      : "border-border/40 hover:bg-surface-2 text-text-secondary"
                  }`}
                >
                  <Sun className="size-4" /> Light
                </button>
                <button
                  onClick={() => {
                    feedback.tap();
                    setTheme("dark");
                  }}
                  className={`p-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    theme === "dark"
                      ? "border-emerald bg-emerald-soft/30 text-emerald font-semibold"
                      : "border-border/40 hover:bg-surface-2 text-text-secondary"
                  }`}
                >
                  <Moon className="size-4" /> Dark
                </button>
              </div>
            </div>

            {/* Crystal Theme */}
            <div className="space-y-4 border-t border-border/40 pt-4">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="size-3.5" style={{ color: "var(--emerald)" }} /> Crystal Theme
              </Label>
              
              {/* Crystal Color Picker */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-text-secondary">Energy Color</span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{crystalColor}</span>
                </div>
                
                {/* Palette Presets */}
                <div className="flex flex-wrap gap-2 items-center">
                  {[
                    { name: "Teal", color: "#2dd4bf" },
                    { name: "Emerald", color: "#34d399" },
                    { name: "Green", color: "#4ade80" },
                    { name: "Cyan", color: "#22d3ee" },
                    { name: "Violet", color: "#a78bfa" },
                    { name: "Sky", color: "#67e8f9" },
                    { name: "Gold", color: "#FBBF24" },
                    { name: "Rose", color: "#F43F5E" },
                  ].map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      title={preset.name}
                      onClick={() => {
                        feedback.tap();
                        setCrystalColor(preset.color);
                      }}
                      className="size-7 rounded-full border transition-all relative flex items-center justify-center cursor-pointer"
                      style={{
                        backgroundColor: preset.color,
                        borderColor: crystalColor === preset.color ? "var(--foreground)" : "rgba(255,255,255,0.15)",
                        boxShadow: crystalColor === preset.color ? `0 0 10px ${preset.color}` : "none",
                      }}
                    >
                      {crystalColor === preset.color && (
                        <Check className="size-3.5 text-black bg-white rounded-full p-0.5" />
                      )}
                    </button>
                  ))}
                  
                  {/* Custom Color Input */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        feedback.tap();
                        setCustomColorOpen(!customColorOpen);
                      }}
                      className="size-7 rounded-full overflow-hidden border border-border/60 hover:border-border cursor-pointer flex items-center justify-center"
                    >
                      <div 
                        className="size-4 rounded-md border border-white/20"
                        style={{ background: "linear-gradient(45deg, #ff0000, #00ff00, #0000ff)" }}
                        title="Custom Color"
                      />
                    </button>

                    {customColorOpen && (
                      <div className="absolute bottom-9 right-0 z-50 w-64 p-4 rounded-2xl border border-border/40 bg-surface-2/95 backdrop-blur-xl shadow-2xl animate-slide-in-blurred-bottom space-y-4">
                        <div className="text-xs font-semibold text-text-secondary border-b border-border/20 pb-2 flex justify-between items-center">
                          <span>Custom Energy Color</span>
                          <button 
                            type="button"
                            onClick={() => setCustomColorOpen(false)}
                            className="text-text-muted hover:text-text-secondary text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Hue Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-medium text-text-secondary">
                            <span>Hue</span>
                            <span className="font-mono">{hsl.h}°</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={360}
                            value={hsl.h}
                            onChange={(e) => handleHslChange("h", Number(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none"
                            style={{
                              background: "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
                            }}
                          />
                        </div>

                        {/* Saturation Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-medium text-text-secondary">
                            <span>Saturation</span>
                            <span className="font-mono">{hsl.s}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={hsl.s}
                            onChange={(e) => handleHslChange("s", Number(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none"
                            style={{
                              background: `linear-gradient(to right, ${hslToHex(hsl.h, 0, 50)} 0%, ${hslToHex(hsl.h, 100, 50)} 100%)`
                            }}
                          />
                        </div>

                        {/* Lightness Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-medium text-text-secondary">
                            <span>Lightness</span>
                            <span className="font-mono">{hsl.l}%</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={90}
                            value={hsl.l}
                            onChange={(e) => handleHslChange("l", Number(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none"
                            style={{
                              background: `linear-gradient(to right, #000000 0%, ${hslToHex(hsl.h, hsl.s, 50)} 50%, #ffffff 100%)`
                            }}
                          />
                        </div>

                        {/* Hex Display & Preview */}
                        <div className="flex items-center gap-3 pt-1">
                          <div 
                            className="size-10 rounded-xl border border-white/20 shadow-inner"
                            style={{ backgroundColor: crystalColor }}
                          />
                          <div className="flex-1">
                            <div className="text-[10px] text-text-muted uppercase">Hex Value</div>
                            <div className="text-sm font-mono font-semibold text-text-primary uppercase">{crystalColor}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Space Ambience */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-medium text-text-secondary">Space Ambience</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "stars", name: "Stars Field", icon: "✨" },
                    { id: "antigravity", name: "Antigravity", icon: "🌌" },
                    { id: "galaxy", name: "Galaxy", icon: "🪐" },
                    { id: "liquidether", name: "Liquid Ether", icon: "💧" },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => {
                        feedback.tap();
                        setBgAnimation(bg.id as any);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                        bgAnimation === bg.id
                          ? "border-emerald bg-emerald-soft/30 text-emerald font-semibold"
                          : "border-border/40 hover:bg-surface-2 text-text-secondary"
                      }`}
                    >
                      <span>{bg.icon}</span>
                      <span>{bg.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Space Ambience Customization Panel */}
              {bgAnimation === "antigravity" && (
                <div className="space-y-4 p-3.5 rounded-2xl border border-border/40 bg-surface-2/40 animate-slide-in-blurred-bottom">
                  <div className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 border-b border-border/20 pb-2">
                    <span>🌌</span> Antigravity Particles Settings
                  </div>
                  
                  {/* Particle Count */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                      <span>Particle Count</span>
                      <span className="font-mono text-emerald">{bgAntigravityCount}</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={500}
                      step={10}
                      value={bgAntigravityCount}
                      onChange={(e) => setBgAntigravityCount(Number(e.target.value))}
                      className="w-full h-1.5 bg-border/50 rounded-lg appearance-none cursor-pointer accent-emerald focus:outline-none"
                    />
                  </div>

                  {/* Magnet Radius */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                      <span>Magnet Radius</span>
                      <span className="font-mono text-emerald">{bgAntigravityMagnetRadius} px</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={30}
                      step={1}
                      value={bgAntigravityMagnetRadius}
                      onChange={(e) => setBgAntigravityMagnetRadius(Number(e.target.value))}
                      className="w-full h-1.5 bg-border/50 rounded-lg appearance-none cursor-pointer accent-emerald focus:outline-none"
                    />
                  </div>

                  {/* Particle Size */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                      <span>Particle Size</span>
                      <span className="font-mono text-emerald">{bgAntigravityParticleSize}</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={5}
                      step={0.1}
                      value={bgAntigravityParticleSize}
                      onChange={(e) => setBgAntigravityParticleSize(Number(e.target.value))}
                      className="w-full h-1.5 bg-border/50 rounded-lg appearance-none cursor-pointer accent-emerald focus:outline-none"
                    />
                  </div>

                  {/* Wave Speed */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                      <span>Wave Speed</span>
                      <span className="font-mono text-emerald">{bgAntigravityWaveSpeed}</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={2}
                      step={0.05}
                      value={bgAntigravityWaveSpeed}
                      onChange={(e) => setBgAntigravityWaveSpeed(Number(e.target.value))}
                      className="w-full h-1.5 bg-border/50 rounded-lg appearance-none cursor-pointer accent-emerald focus:outline-none"
                    />
                  </div>

                  {/* Particle Shape */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-medium text-text-secondary">Particle Shape</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["sphere", "capsule", "box", "tetrahedron"] as const).map((shape) => (
                        <button
                          key={shape}
                          type="button"
                          onClick={() => { feedback.tap(); setBgAntigravityShape(shape); }}
                          className={`py-1.5 text-[10px] rounded-lg border text-center font-medium capitalize transition-all cursor-pointer ${
                            bgAntigravityShape === shape
                              ? "border-emerald bg-emerald-soft/20 text-emerald font-semibold"
                              : "border-border/40 hover:bg-surface-3 text-text-secondary"
                          }`}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {bgAnimation === "galaxy" && (
                <div className="space-y-4 p-3.5 rounded-2xl border border-border/40 bg-surface-2/40 animate-slide-in-blurred-bottom">
                  <div className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 border-b border-border/20 pb-2">
                    <span>🪐</span> Galaxy Nebula Settings
                  </div>
                  
                  {/* Star Speed */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                      <span>Star Speed</span>
                      <span className="font-mono text-emerald">{bgGalaxyStarSpeed}</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={2}
                      step={0.05}
                      value={bgGalaxyStarSpeed}
                      onChange={(e) => setBgGalaxyStarSpeed(Number(e.target.value))}
                      className="w-full h-1.5 bg-border/50 rounded-lg appearance-none cursor-pointer accent-emerald focus:outline-none"
                    />
                  </div>

                  {/* Glow Intensity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                      <span>Glow Intensity</span>
                      <span className="font-mono text-emerald">{bgGalaxyGlowIntensity}</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={bgGalaxyGlowIntensity}
                      onChange={(e) => setBgGalaxyGlowIntensity(Number(e.target.value))}
                      className="w-full h-1.5 bg-border/50 rounded-lg appearance-none cursor-pointer accent-emerald focus:outline-none"
                    />
                  </div>

                  {/* Hue Shift */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                      <span>Cosmic Hue Shift</span>
                      <span className="font-mono text-emerald">{bgGalaxyHueShift}°</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={5}
                      value={bgGalaxyHueShift}
                      onChange={(e) => setBgGalaxyHueShift(Number(e.target.value))}
                      className="w-full h-1.5 bg-border/50 rounded-lg appearance-none cursor-pointer accent-emerald focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {bgAnimation === "liquidether" && (
                <div className="space-y-4 p-3.5 rounded-2xl border border-border/40 bg-surface-2/40 animate-slide-in-blurred-bottom">
                  <div className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 border-b border-border/20 pb-2">
                    <span>💧</span> Liquid Ether Settings
                  </div>
                  
                  {/* Mouse Force */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                      <span>Mouse Force</span>
                      <span className="font-mono text-emerald">{bgLiquidEtherMouseForce}</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      step={1}
                      value={bgLiquidEtherMouseForce}
                      onChange={(e) => setBgLiquidEtherMouseForce(Number(e.target.value))}
                      className="w-full h-1.5 bg-border/50 rounded-lg appearance-none cursor-pointer accent-emerald focus:outline-none"
                    />
                  </div>

                  {/* Cursor Size */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                      <span>Cursor Size</span>
                      <span className="font-mono text-emerald">{bgLiquidEtherCursorSize}</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={300}
                      step={5}
                      value={bgLiquidEtherCursorSize}
                      onChange={(e) => setBgLiquidEtherCursorSize(Number(e.target.value))}
                      className="w-full h-1.5 bg-border/50 rounded-lg appearance-none cursor-pointer accent-emerald focus:outline-none"
                    />
                  </div>

                  {/* Viscosity Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-medium text-text-secondary">Viscous Fluid</span>
                    <button
                      type="button"
                      onClick={() => { feedback.tap(); setBgLiquidEtherIsViscous(!bgLiquidEtherIsViscous); }}
                      className={`relative inline-flex h-5 w-9 items-center shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none min-h-0 ${
                        bgLiquidEtherIsViscous ? 'bg-emerald' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          bgLiquidEtherIsViscous ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Viscosity Level (conditional) */}
                  {bgLiquidEtherIsViscous && (
                    <div className="space-y-1.5 animate-slide-in-blurred-bottom">
                      <div className="flex justify-between text-xs font-medium text-text-secondary">
                        <span>Viscosity Level</span>
                        <span className="font-mono text-emerald">{bgLiquidEtherViscous}</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        step={5}
                        value={bgLiquidEtherViscous}
                        onChange={(e) => setBgLiquidEtherViscous(Number(e.target.value))}
                        className="w-full h-1.5 bg-border/50 rounded-lg appearance-none cursor-pointer accent-emerald focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Auto Demo Speed */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                      <span>Auto Demo Speed</span>
                      <span className="font-mono text-emerald">{bgLiquidEtherAutoSpeed}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.1}
                      value={bgLiquidEtherAutoSpeed}
                      onChange={(e) => setBgLiquidEtherAutoSpeed(Number(e.target.value))}
                      className="w-full h-1.5 bg-border/50 rounded-lg appearance-none cursor-pointer accent-emerald focus:outline-none"
                    />
                  </div>

                  {/* Auto Demo Intensity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                      <span>Auto Demo Intensity</span>
                      <span className="font-mono text-emerald">{bgLiquidEtherAutoIntensity}</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={5}
                      step={0.1}
                      value={bgLiquidEtherAutoIntensity}
                      onChange={(e) => setBgLiquidEtherAutoIntensity(Number(e.target.value))}
                      className="w-full h-1.5 bg-border/50 rounded-lg appearance-none cursor-pointer accent-emerald focus:outline-none"
                    />
                  </div>

                  {/* Fluid Bounce Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-medium text-text-secondary">Edge Bouncing</span>
                    <button
                      type="button"
                      onClick={() => { feedback.tap(); setBgLiquidEtherIsBounce(!bgLiquidEtherIsBounce); }}
                      className={`relative inline-flex h-5 w-9 items-center shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none min-h-0 ${
                        bgLiquidEtherIsBounce ? 'bg-emerald' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          bgLiquidEtherIsBounce ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* App Lock Passcode Setup */}
            <div className="space-y-2 border-t border-border/40 pt-4">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">Security Lock</Label>
              
              {!passcodeHash ? (
                /* Passcode Setup */
                <div>
                  {!showPinSetup ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-xl"
                      onClick={() => {
                        feedback.tap();
                        setShowPinSetup(true);
                        setNewPin("");
                        setConfirmPin("");
                        setPinSetupError(null);
                      }}
                    >
                      <Lock className="size-4 mr-2" /> Enable App Lock
                    </Button>
                  ) : (
                    <div className="space-y-3 p-3 rounded-xl bg-surface-2 border border-border/40 mt-2">
                      <div className="space-y-1">
                        <Label htmlFor="new-pin" className="text-xs text-muted-foreground font-mono">New 4-digit PIN</Label>
                        <Input
                          id="new-pin"
                          type="password"
                          maxLength={4}
                          value={newPin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setNewPin(val);
                          }}
                          className="bg-surface border-border/40"
                          placeholder="••••"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="confirm-pin" className="text-xs text-muted-foreground font-mono">Confirm PIN</Label>
                        <Input
                          id="confirm-pin"
                          type="password"
                          maxLength={4}
                          value={confirmPin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setConfirmPin(val);
                          }}
                          className="bg-surface border-border/40"
                          placeholder="••••"
                        />
                      </div>
                      {pinSetupError && (
                        <p className="text-xs text-rose-500 font-mono">{pinSetupError}</p>
                      )}
                      <div className="flex gap-2 justify-end pt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            feedback.tap();
                            setShowPinSetup(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleEnableAppLock}>
                          Save PIN
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Disable Passcode */
                <div>
                  {!showPinSetup ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl"
                      onClick={() => {
                        feedback.tap();
                        setShowPinSetup(true);
                        setCurrentPinInput("");
                        setPinSetupError(null);
                      }}
                    >
                      <Lock className="size-4 mr-2" /> Disable App Lock
                    </Button>
                  ) : (
                    <div className="space-y-3 p-3 rounded-xl bg-surface-2 border border-border/40 mt-2">
                      <div className="space-y-1">
                        <Label htmlFor="curr-pin" className="text-xs text-muted-foreground font-mono font-mono">Enter Current PIN to disable</Label>
                        <Input
                          id="curr-pin"
                          type="password"
                          maxLength={4}
                          value={currentPinInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setCurrentPinInput(val);
                          }}
                          className="bg-surface border-border/40"
                          placeholder="••••"
                        />
                      </div>
                      {pinSetupError && (
                        <p className="text-xs text-rose-500 font-mono font-mono">{pinSetupError}</p>
                      )}
                      <div className="flex gap-2 justify-end pt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            feedback.tap();
                            setShowPinSetup(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" variant="destructive" onClick={handleDisableAppLock}>
                          Disable PIN
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cloud Sync link trigger */}
            <div className="space-y-2 border-t border-border/40 pt-4">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">Data Synchronization</Label>
              <Button
                variant="outline"
                className={`w-full justify-start rounded-xl ${cloudSync.linked ? "border-rose-500/20 text-rose-400 hover:bg-rose-500/10" : ""}`}
                onClick={() => {
                  feedback.tap();
                  setSettingsOpen(false);
                  if (cloudSync.linked) {
                    unlinkCloudAccount();
                  } else {
                    linkWithGoogle();
                  }
                }}
              >
                <Cloud className="size-4 mr-2" />
                {cloudSync.linked ? "Unlink Google Cloud" : "Link Google Account"}
              </Button>
            </div>

            {/* Reset App Data */}
            <div className="space-y-2 border-t border-border/40 pt-4">
              <Label className="text-xs text-rose-400 uppercase tracking-widest font-semibold">Danger Zone</Label>
              <Button
                variant="outline"
                className="w-full justify-start rounded-xl border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                onClick={() => {
                  feedback.tap();
                  setSettingsOpen(false);
                  setResetConfirmOpen(true);
                }}
              >
                <Trash2 className="size-4 mr-2" /> Reset App Data (Clear Database)
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full rounded-xl"
              onClick={() => {
                feedback.tap();
                setSettingsOpen(false);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="rounded-[24px] border border-white/10 bg-surface p-6 max-w-sm shadow-2xl text-center space-y-4">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-rose-400 font-bold text-center">
              Clear All Data?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-text-secondary leading-relaxed">
            This will permanently delete all transaction records, vault savings, goal parameters, and security PIN credentials. This action is irreversible.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => {
                feedback.tap();
                setResetConfirmOpen(false);
              }}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                feedback.warning();
                useApp.getState().resetAllData();
                localStorage.removeItem("safepool_onboarded");
                localStorage.removeItem("safepool_tutorial_completed");
                window.location.reload();
              }}
              className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white"
            >
              Reset App
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Recurring Payment Confirmation Dialog */}
      <Dialog open={deleteRecurringId !== null} onOpenChange={(open) => { if (!open) setDeleteRecurringId(null); }}>
        <DialogContent className="rounded-[24px] border border-white/10 bg-surface p-6 max-w-sm shadow-2xl text-center space-y-4">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-rose-400 font-bold text-center">
              Delete Recurring Payment?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-text-secondary leading-relaxed">
            This will remove the scheduled payment. Any future automatic deductions will stop.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => {
                feedback.tap();
                setDeleteRecurringId(null);
              }}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteRecurringId) {
                  feedback.warning();
                  removeRecurringPayment(deleteRecurringId);
                  toast.success("Recurring payment deleted");
                  setDeleteRecurringId(null);
                }
              }}
              className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showTutorial && <TutorialTour onClose={() => setShowTutorial(false)} />}

      {/* Cookie & Data Consent Banner */}
      <AnimatePresence>
        {cookieConsentOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md p-5 rounded-3xl glass-elevated border border-white/10 shadow-2xl z-50 flex flex-col gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-xl bg-emerald/10 border border-emerald/20 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="size-4 text-emerald" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Data & Session Privacy Notice</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  SafePool uses secure local storage (cookies and local cache) to persist your budget data and session keys. 
                  If you link a Google Account, your email, transactions, and goals are stored securely in Google Cloud.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  feedback.tap();
                  setCookieConsentOpen(false);
                  localStorage.setItem("safepool_data_consent", "true");
                }}
                className="text-[11px] px-3.5 py-1.5 rounded-lg bg-emerald hover:bg-emerald/90 text-primary-foreground font-semibold transition-colors"
              >
                Accept & Continue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

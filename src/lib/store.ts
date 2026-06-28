import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Category = {
  key: string;
  color: string;
  emoji: string;
};

export type RecurringInterval = "weekly" | "biweekly" | "monthly";

export type RecurringPayment = {
  id: string;
  name: string;
  type: "in" | "out";
  amount: number;
  category: string;
  interval: RecurringInterval;
  lastProcessed: string; // ISO string
  nextBillingDate: string; // ISO string
};

export type Txn = {
  id: string;
  type: "in" | "out";
  amount: number;
  category: string;
  timestamp: string;
};

export type CloudSyncSettings = {
  passphrase?: string;
  provider?: "dropbox" | "gdrive" | "webdav" | "firebase";
  linked: boolean;
  lastSync?: string;
  email?: string;
};

type State = {
  balance: number;
  vault: number;
  goal: number;
  goalCategory: string;
  goalDate: string;
  transactions: Txn[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  recurringPayments: RecurringPayment[];
  cloudSync: CloudSyncSettings;
  performanceMode: "eco" | "immersive";
  currency: string;
  hapticsEnabled: boolean;
  crystalColor: string;
  bgAnimation: "stars" | "antigravity" | "galaxy" | "ballpit";
  bgAnimation: "stars" | "antigravity" | "galaxy" | "liquidether";
  bgAntigravityCount: number;
  bgAntigravityMagnetRadius: number;
  bgAntigravityParticleSize: number;
  bgAntigravityWaveSpeed: number;
  bgAntigravityShape: "sphere" | "capsule" | "box" | "tetrahedron";
  bgGalaxyStarSpeed: number;
  bgGalaxyGlowIntensity: number;
  bgGalaxyHueShift: number;
  bgLiquidEtherMouseForce: number;
  bgLiquidEtherCursorSize: number;
  bgLiquidEtherIsViscous: boolean;
  bgLiquidEtherViscous: number;
  bgLiquidEtherAutoSpeed: number;
  bgLiquidEtherAutoIntensity: number;
  bgLiquidEtherIsBounce: boolean;
  bgLiquidEtherResolution: number;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setCurrency: (code: string) => void;
  setCrystalColor: (color: string) => void;
  setBgAnimation: (bg: "stars" | "antigravity" | "galaxy" | "liquidether") => void;
  setBgAntigravityCount: (n: number) => void;
  setBgAntigravityMagnetRadius: (n: number) => void;
  setBgAntigravityParticleSize: (n: number) => void;
  setBgAntigravityWaveSpeed: (n: number) => void;
  setBgAntigravityShape: (s: "sphere" | "capsule" | "box" | "tetrahedron") => void;
  setBgGalaxyStarSpeed: (n: number) => void;
  setBgGalaxyGlowIntensity: (n: number) => void;
  setBgGalaxyHueShift: (n: number) => void;
  setBgLiquidEtherMouseForce: (n: number) => void;
  setBgLiquidEtherCursorSize: (n: number) => void;
  setBgLiquidEtherIsViscous: (b: boolean) => void;
  setBgLiquidEtherViscous: (n: number) => void;
  setBgLiquidEtherAutoSpeed: (n: number) => void;
  setBgLiquidEtherAutoIntensity: (n: number) => void;
  setBgLiquidEtherIsBounce: (b: boolean) => void;
  setBgLiquidEtherResolution: (n: number) => void;
  removeCategory: (type: "in" | "out", key: string) => void;
  passcodeHash: string | null;
  failedAttempts: number;
  lockoutUntil: string | null;
  setPasscode: (code: string | null) => void;
  incrementFailedAttempts: () => void;
  resetFailedAttempts: () => void;
  setLockout: (until: string | null) => void;
  addTransaction: (t: Txn) => void;
  removeTransaction: (id: string) => void;
  setBalance: (n: number) => void;
  sweepToVault: (amount: number) => void;
  setGoal: (n: number) => void;
  setGoalCategory: (category: string) => void;
  setGoalDate: (date: string) => void;
  addCustomCategory: (type: "in" | "out", name: string, emoji: string, color: string) => void;
  addRecurringPayment: (p: RecurringPayment) => void;
  removeRecurringPayment: (id: string) => void;
  processOverdueRecurringPayments: () => string[];
  setCloudSync: (settings: Partial<CloudSyncSettings>) => void;
  setPerformanceMode: (mode: "eco" | "immersive") => void;
  restoreState: (backup: { balance: number; vault: number; goal: number; transactions: Txn[]; recurringPayments: RecurringPayment[] }) => void;
  resetAllData: () => void;
};

const id = () =>
(typeof crypto !== "undefined" && "randomUUID" in crypto
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2));

export const generateId = id;

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      balance: 0,
      vault: 0,
      goal: 0,
      goalCategory: "🎯",
      goalDate: "",
      transactions: [],
      incomeCategories: [
        { key: "Work", color: "var(--emerald)", emoji: "💼" },
        { key: "Allowance", color: "var(--sky)", emoji: "🪙" },
        { key: "Inheritance", color: "var(--violet)", emoji: "👑" },
        { key: "Other", color: "var(--teal)", emoji: "✨" },
      ],
      expenseCategories: [
        { key: "Food", color: "var(--emerald)", emoji: "🥗" },
        { key: "Transport", color: "var(--sky)", emoji: "🚌" },
        { key: "Books", color: "var(--violet)", emoji: "📚" },
        { key: "Fun", color: "var(--amber)", emoji: "🎉" },
        { key: "Coffee", color: "var(--rose)", emoji: "☕" },
        { key: "Other", color: "var(--teal)", emoji: "✨" },
      ],
      recurringPayments: [],
      cloudSync: {
        linked: false,
      },
      performanceMode: "eco",
      currency: "USD",
      hapticsEnabled: true,
      crystalColor: "#34d399",
      bgAnimation: "stars",
      bgAntigravityCount: 300,
      bgAntigravityMagnetRadius: 10,
      bgAntigravityParticleSize: 2,
      bgAntigravityWaveSpeed: 0.4,
      bgAntigravityShape: "sphere",
      bgGalaxyStarSpeed: 0.5,
      bgGalaxyGlowIntensity: 0.3,
      bgGalaxyHueShift: 140,
      bgLiquidEtherMouseForce: 20,
      bgLiquidEtherCursorSize: 100,
      bgLiquidEtherIsViscous: false,
      bgLiquidEtherViscous: 30,
      bgLiquidEtherAutoSpeed: 0.5,
      bgLiquidEtherAutoIntensity: 2.2,
      bgLiquidEtherIsBounce: false,
      bgLiquidEtherResolution: 0.5,
      theme: "dark",
      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== "undefined") {
          const html = document.documentElement;
          if (theme === "dark") {
            html.classList.add("dark");
          } else {
            html.classList.remove("dark");
          }
          localStorage.setItem("safepool_dark_mode", String(theme === "dark"));
        }
      },
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setCrystalColor: (color) => set({ crystalColor: color }),
      setBgAnimation: (bg) => set({ bgAnimation: bg }),
      setBgAntigravityCount: (n) => set({ bgAntigravityCount: n }),
      setBgAntigravityMagnetRadius: (n) => set({ bgAntigravityMagnetRadius: n }),
      setBgAntigravityParticleSize: (n) => set({ bgAntigravityParticleSize: n }),
      setBgAntigravityWaveSpeed: (n) => set({ bgAntigravityWaveSpeed: n }),
      setBgAntigravityShape: (s) => set({ bgAntigravityShape: s }),
      setBgGalaxyStarSpeed: (n) => set({ bgGalaxyStarSpeed: n }),
      setBgGalaxyGlowIntensity: (n) => set({ bgGalaxyGlowIntensity: n }),
      setBgGalaxyHueShift: (n) => set({ bgGalaxyHueShift: n }),
      setBgLiquidEtherMouseForce: (n) => set({ bgLiquidEtherMouseForce: n }),
      setBgLiquidEtherCursorSize: (n) => set({ bgLiquidEtherCursorSize: n }),
      setBgLiquidEtherIsViscous: (b) => set({ bgLiquidEtherIsViscous: b }),
      setBgLiquidEtherViscous: (n) => set({ bgLiquidEtherViscous: n }),
      setBgLiquidEtherAutoSpeed: (n) => set({ bgLiquidEtherAutoSpeed: n }),
      setBgLiquidEtherAutoIntensity: (n) => set({ bgLiquidEtherAutoIntensity: n }),
      setBgLiquidEtherIsBounce: (b) => set({ bgLiquidEtherIsBounce: b }),
      setBgLiquidEtherResolution: (n) => set({ bgLiquidEtherResolution: n }),
      passcodeHash: null,
      failedAttempts: 0,
      lockoutUntil: null,
      setCurrency: (code) => set({ currency: code }),
      removeCategory: (type, key) =>
        set((s) => {
          if (type === "in") {
            return { incomeCategories: s.incomeCategories.filter((c) => c.key !== key) };
          } else {
            return { expenseCategories: s.expenseCategories.filter((c) => c.key !== key) };
          }
        }),
      setPasscode: (code) => set({ passcodeHash: code }),
      incrementFailedAttempts: () => set((s) => ({ failedAttempts: s.failedAttempts + 1 })),
      resetFailedAttempts: () => set({ failedAttempts: 0 }),
      setLockout: (until) => set({ lockoutUntil: until }),
      addTransaction: (t) =>
        set((s) => {
          if (s.transactions.some((x) => x.id === t.id)) return s;
          return {
            transactions: [t, ...s.transactions],
            balance: t.type === "in" ? s.balance + t.amount : s.balance - t.amount,
          };
        }),
      removeTransaction: (id) =>
        set((s) => {
          const t = s.transactions.find((x) => x.id === id);
          if (!t) return s;
          return {
            transactions: s.transactions.filter((x) => x.id !== id),
            balance: t.type === "in" ? s.balance - t.amount : s.balance + t.amount,
          };
        }),
      setBalance: (n) => set({ balance: n }),
      sweepToVault: (amount) =>
        set((s) => ({ balance: s.balance - amount, vault: s.vault + amount })),
      setGoal: (n) => set({ goal: n }),
      setGoalCategory: (category) => set({ goalCategory: category }),
      setGoalDate: (date) => set({ goalDate: date }),
      addCustomCategory: (type, name, emoji, color) =>
        set((s) => {
          const newCat = { key: name, color, emoji };
          if (type === "in") {
            return { incomeCategories: [...s.incomeCategories, newCat] };
          } else {
            return { expenseCategories: [...s.expenseCategories, newCat] };
          }
        }),
      addRecurringPayment: (p) =>
        set((s) => ({ recurringPayments: [p, ...s.recurringPayments] })),
      removeRecurringPayment: (id) =>
        set((s) => ({ recurringPayments: s.recurringPayments.filter((x) => x.id !== id) })),
      processOverdueRecurringPayments: () => {
        const now = new Date();
        const logs: string[] = [];
        const { recurringPayments, addTransaction } = get();
        let updatedPayments = [...recurringPayments];
        let balanceDiff = 0;
        const newTxns: Txn[] = [];

        updatedPayments = updatedPayments.map((p) => {
          let nextDate = new Date(p.nextBillingDate);
          let tempLastProcessed = p.lastProcessed;
          let iterations = 0;

          // Process all occurrences if multiple periods have passed while offline
          while (nextDate <= now && iterations < 5) {
            iterations++;
            const timestamp = nextDate.toISOString();
            const txId = id();

            newTxns.push({
              id: txId,
              type: p.type,
              amount: p.amount,
              category: p.category,
              timestamp,
            });

            logs.push(`Processed recurring payment: ${p.name} (${p.type === "in" ? "+" : "-"}$${p.amount})`);
            balanceDiff += p.type === "in" ? p.amount : -p.amount;

            tempLastProcessed = timestamp;
            // Advance billing date
            if (p.interval === "weekly") {
              nextDate.setDate(nextDate.getDate() + 7);
            } else if (p.interval === "biweekly") {
              nextDate.setDate(nextDate.getDate() + 14);
            } else if (p.interval === "monthly") {
              nextDate.setMonth(nextDate.getMonth() + 1);
            }
          }

          if (iterations > 0) {
            return {
              ...p,
              lastProcessed: tempLastProcessed,
              nextBillingDate: nextDate.toISOString(),
            };
          }
          return p;
        });

        if (newTxns.length > 0) {
          set((s) => ({
            recurringPayments: updatedPayments,
            transactions: [...newTxns, ...s.transactions],
            balance: s.balance + balanceDiff,
          }));
        }

        return logs;
      },
      setCloudSync: (settings) =>
        set((s) => ({ cloudSync: { ...s.cloudSync, ...settings } })),
      setPerformanceMode: (mode) =>
        set(() => ({ performanceMode: mode })),
      restoreState: (backup) =>
        set(() => ({
          balance: backup.balance,
          vault: backup.vault,
          goal: backup.goal,
          transactions: backup.transactions,
          recurringPayments: backup.recurringPayments,
        })),
      resetAllData: () =>
        set(() => ({
          balance: 0,
          vault: 0,
          goal: 0,
          goalCategory: "🎯",
          goalDate: "",
          transactions: [],
          recurringPayments: [],
          passcodeHash: null,
          failedAttempts: 0,
          lockoutUntil: null,
          crystalColor: "#34d399",
          bgAnimation: "stars",
          bgAntigravityCount: 300,
          bgAntigravityMagnetRadius: 10,
          bgAntigravityParticleSize: 2,
          bgAntigravityWaveSpeed: 0.4,
          bgAntigravityShape: "sphere",
          bgGalaxyStarSpeed: 0.5,
          bgGalaxyGlowIntensity: 0.3,
          bgGalaxyHueShift: 140,
          bgLiquidEtherMouseForce: 20,
          bgLiquidEtherCursorSize: 100,
          bgLiquidEtherIsViscous: false,
          bgLiquidEtherViscous: 30,
          bgLiquidEtherAutoSpeed: 0.5,
          bgLiquidEtherAutoIntensity: 2.2,
          bgLiquidEtherIsBounce: false,
          bgLiquidEtherResolution: 0.5,
          theme: "dark",
        })),
    }),
    { name: "safepool-state-v2" }
  )
);

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Target,
  Sparkles,
  ChevronLeft,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "@/lib/store";
import { feedback } from "@/lib/feedback";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/goal")({
  head: () => ({
    meta: [
      { title: "Savings Goal & Projections — SafePool" },
      { name: "description", content: "Optimize and track your student savings goals and visual growth targets." },
    ],
  }),
  component: GoalPage,
});

function formatMoney(n: number) {
  const currency = useApp.getState().currency || "USD";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

const CATEGORIES = [
  { icon: "🎓", name: "Education" },
  { icon: "💻", name: "Tech" },
  { icon: "✈️", name: "Travel" },
  { icon: "🚗", name: "Car" },
  { icon: "🏡", name: "Rent" },
  { icon: "💼", name: "Career" },
  { icon: "✨", name: "Other" },
];

function GoalPage() {
  const currency = useApp((s) => s.currency);
  const goal = useApp((s) => s.goal);
  const vault = useApp((s) => s.vault);
  const balance = useApp((s) => s.balance);
  const goalCategory = useApp((s) => s.goalCategory) || "💼";
  const goalDate = useApp((s) => s.goalDate) || "";
  
  const setGoal = useApp((s) => s.setGoal);
  const setGoalCategory = useApp((s) => s.setGoalCategory);
  const setGoalDate = useApp((s) => s.setGoalDate);
  const sweepToVault = useApp((s) => s.sweepToVault);

  const [goalInput, setGoalInput] = useState(String(goal));
  const [goalDateInput, setGoalDateInput] = useState(goalDate);
  const [sweepInput, setSweepInput] = useState("");
  const [isRingHovered, setIsRingHovered] = useState(false);

  useEffect(() => {
    setGoalInput(String(goal));
  }, [goal]);

  useEffect(() => {
    setGoalDateInput(goalDate);
  }, [goalDate]);

  const handleSaveGoalSettings = () => {
    const val = parseFloat(goalInput);
    if (!isNaN(val) && val > 0) {
      setGoal(val);
      setGoalDate(goalDateInput);
      feedback.save();
    } else {
      feedback.warning();
    }
  };

  const handleSweep = () => {
    const val = parseFloat(sweepInput);
    if (!isNaN(val) && val > 0 && val <= balance) {
      sweepToVault(val);
      setSweepInput("");
      feedback.sweep();
    } else {
      feedback.warning();
    }
  };

  const progress = Math.min(100, (vault / Math.max(goal, 1)) * 100);
  const remaining = Math.max(0, goal - vault);

  // Projections
  const weeklySavingsSim = 25; // average student weekly savings
  const weeksToReach = remaining > 0 ? Math.ceil(remaining / weeklySavingsSim) : 0;

  // SVG 220px ring calculations
  // Center: 110, 110. Radius: 90. Circumference = 2 * PI * 90 = 565.486
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">

      {/* Top Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="mr-2 text-text-secondary hover:text-text-primary transition-colors">
              <ChevronLeft className="size-5" />
            </Link>
            <div className="size-8 rounded-xl bg-emerald/20 flex items-center justify-center">
              <Sparkles className="size-4 text-emerald" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight">SafePool</span>
            <span className="ml-3 text-xs text-text-secondary hidden sm:inline">Savings Goal</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/" className="text-text-secondary hover:text-text-primary transition-colors">Dashboard</Link>
            <span className="text-text-primary font-semibold">Goal Tracker</span>
          </nav>
        </div>
      </header>

      <main id="maincontent" className="mx-auto max-w-xl px-6 py-8 space-y-6">
        {/* Visual Progress ring/card */}
        <Card className="p-6 rounded-[20px] bg-surface border border-border/40 relative overflow-hidden flex flex-col items-center text-center" role="region" aria-labelledby="goal-progress-heading">
          <div className="absolute top-4 right-4 text-emerald/30">
            <Target className="size-8" />
          </div>

          <span id="goal-progress-heading" className="text-[10px] uppercase text-text-secondary tracking-widest font-semibold">
            Savings Target Progress
          </span>

          {/* Interactive Progress Circle (220px) */}
          <div 
            className="size-[220px] my-6 relative flex items-center justify-center cursor-pointer"
            onMouseEnter={() => setIsRingHovered(true)}
            onMouseLeave={() => setIsRingHovered(false)}
          >
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 220 220">
              <defs>
                <linearGradient id="goal-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-primary)" />
                  <stop offset="100%" stopColor="var(--accent-gold)" />
                </linearGradient>
                <filter id="goal-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle
                cx="110"
                cy="110"
                r="90"
                className="stroke-surface-2"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="110"
                cy="110"
                r="90"
                stroke="url(#goal-progress-gradient)"
                strokeWidth="12"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  filter: isRingHovered ? "url(#goal-glow)" : "none",
                  transition: "filter 0.3s ease"
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                className="text-4xl font-mono font-medium tracking-tight text-text-primary tabular-nums"
                style={{ fontFeatureSettings: "'tnum'" }}
                animate={{ scale: isRingHovered ? 1.08 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {formatMoney(vault)}
              </motion.span>
              <span className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">
                Saved {goalCategory}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-text-secondary uppercase tracking-wider mt-1">
            Target: <span className="font-mono font-medium text-text-primary text-xs normal-case">{formatMoney(goal)}</span>{goalDate ? ` by ${goalDate}` : ""}
          </div>

          <div className="grid grid-cols-2 gap-8 w-full border-t border-border/40 pt-4 mt-6">
            <div>
              <span className="text-[10px] text-text-secondary block uppercase tracking-wider">In Vault</span>
              <span className="text-xl font-bold font-mono text-emerald mt-1 block" style={{ fontFeatureSettings: "'tnum'" }}>{formatMoney(vault)}</span>
            </div>
            <div>
              <span className="text-[10px] text-text-secondary block uppercase tracking-wider">Remaining</span>
              <span className="text-xl font-bold font-mono text-text-primary mt-1 block" style={{ fontFeatureSettings: "'tnum'" }}>{formatMoney(remaining)}</span>
            </div>
          </div>
        </Card>

        {/* Adjust Target Card */}
        <Card className="p-6 rounded-[20px] bg-surface border border-border/40 space-y-5">
          <div>
            <h3 className="font-display font-semibold text-lg text-text-primary">Configure Goal</h3>
            <p className="text-xs text-text-secondary mt-0.5">Select a category and adjust your savings targets</p>
          </div>

          {/* Goal category / icon picker bubbles */}
          <div className="space-y-2">
            <Label className="text-[10px] text-text-secondary uppercase tracking-wider">Goal Category</Label>
            <div className="flex flex-wrap gap-3 justify-start py-1">
              {CATEGORIES.map((cat) => {
                const isSelected = goalCategory === cat.icon;
                return (
                  <div key={cat.icon} className="flex flex-col items-center gap-1.5">
                    <motion.button
                      onClick={() => {
                        feedback.tap();
                        setGoalCategory(cat.icon);
                      }}
                      whileHover={{ scale: 1.05 }}
                      animate={{
                        scale: isSelected ? 1.08 : 1,
                        borderColor: isSelected ? "var(--accent-primary)" : "transparent",
                        boxShadow: isSelected ? "0 0 15px var(--glow-mint)" : "none",
                        backgroundColor: isSelected ? "var(--surface-3)" : "var(--surface-2)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="size-14 rounded-full flex items-center justify-center text-2xl border-2 focus:outline-none cursor-pointer"
                    >
                      {cat.icon}
                    </motion.button>
                    <span className={`text-[10px] tracking-tight ${isSelected ? "text-emerald font-semibold" : "text-text-muted"}`}>
                      {cat.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="goalAmt" className="text-[10px] text-text-secondary uppercase tracking-wider">Target Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
                <Input
                  id="goalAmt"
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="Target Amount"
                  className="pl-9 h-11 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goalDateStr" className="text-[10px] text-text-secondary uppercase tracking-wider">Target Date</Label>
              <Input
                id="goalDateStr"
                type="text"
                value={goalDateInput}
                onChange={(e) => setGoalDateInput(e.target.value)}
                placeholder="e.g. end of semester"
                className="h-11 rounded-xl text-sm"
              />
            </div>
          </div>

          <Button 
            onClick={handleSaveGoalSettings} 
            className="w-full h-11 rounded-[999px] font-semibold glow-emerald"
            style={{ background: "var(--accent-primary)", color: "var(--bg)" }}
          >
            Save Target Settings
          </Button>
        </Card>

        {/* Sweep Excess Card */}
        <Card className="p-6 rounded-[20px] bg-surface border border-border/40 space-y-4">
          <div>
            <h3 className="font-display font-semibold text-lg text-text-primary">Sweep Excess Balance</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Available pool balance to sweep: <span className="font-mono font-medium text-emerald">{formatMoney(balance)}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
              <Input
                type="number"
                value={sweepInput}
                onChange={(e) => setSweepInput(e.target.value)}
                placeholder="Amount to sweep"
                className="pl-9 h-11 rounded-xl text-sm"
              />
            </div>
            <Button 
              onClick={handleSweep} 
              variant="outline" 
              className="h-11 px-5 rounded-xl text-emerald border-emerald/20 bg-emerald/5 hover:bg-emerald/10 font-semibold"
            >
              Sweep Now
            </Button>
          </div>
        </Card>

        {/* Intelligence Projections */}
        {remaining > 0 && (
          <Card className="p-6 rounded-[20px] bg-surface border border-border/40 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber shrink-0 mt-0.5">
                <TrendingUp className="size-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="text-sm font-semibold text-text-primary">At this pace...</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Saving an average of <span className="font-semibold text-text-primary">$25/week</span>, you will reach your target goal in approximately <span className="font-semibold text-amber">{weeksToReach} weeks</span>.
                </p>
              </div>
            </div>
            
            {/* Sparkline Canvas fallback */}
            <div className="w-full bg-surface-2/40 rounded-xl p-3 border border-border/20">
              <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Projected Velocity</div>
              <svg className="w-full h-12 mt-2 overflow-visible" viewBox="0 0 300 50">
                <defs>
                  <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                  </linearGradient>
                  <filter id="sparkline-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <path
                  d="M 0 45 Q 75 35 150 25 T 300 5"
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="2.5"
                  filter="url(#sparkline-glow)"
                />
                <path
                  d="M 0 45 Q 75 35 150 25 T 300 5 L 300 50 L 0 50 Z"
                  fill="url(#sparkline-grad)"
                />
                <circle cx="300" cy="5" r="4" fill="var(--accent-gold)" />
              </svg>
            </div>
          </Card>
        )}
      </main>

      <footer className="py-12 text-center text-xs text-text-muted">
        SafePool · Projections are calculated locally-first.
      </footer>
    </div>
  );
}

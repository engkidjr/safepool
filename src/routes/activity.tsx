import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Sparkles,
  ChevronLeft,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp, type Category } from "@/lib/store";
import { feedback } from "@/lib/feedback";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity & Insights — SafePool" },
      { name: "description", content: "Analyze your income vs spending breakdowns and trace your local transaction logs." },
    ],
  }),
  component: ActivityPage,
});

function formatMoney(n: number) {
  const currency = useApp.getState().currency || "USD";
  return n.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 2 });
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 1, 0.5, 1] },
  }),
};

function ActivityPage() {
  const currency = useApp((s) => s.currency);
  const transactions = useApp((s) => s.transactions);
  const incomeCategories = useApp((s) => s.incomeCategories);
  const expenseCategories = useApp((s) => s.expenseCategories);
  const removeTransaction = useApp((s) => s.removeTransaction);

  const [activeTab, setActiveTab] = useState<"out" | "in">("out");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const categories = activeTab === "out" ? expenseCategories : incomeCategories;

  // Breakdown Calculations
  const breakdownData = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === activeTab)
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
      });

    return categories
      .map((c) => ({
        name: c.key,
        value: Math.round((map.get(c.key) ?? 0) * 100) / 100,
        color: c.color,
        emoji: c.emoji,
      }))
      .filter((d) => d.value > 0);
  }, [transactions, activeTab, categories]);

  const totalAmount = useMemo(() => {
    return breakdownData.reduce((sum, item) => sum + item.value, 0);
  }, [breakdownData]);

  // Overall stats
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "in")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === "out")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Filtered transactions for the log list
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterCategory === "All") return true;
      return t.category === filterCategory;
    });
  }, [transactions, filterCategory]);

  return (
    <div className="min-h-screen aurora-bg text-foreground">
      {/* Top nav */}
      <header className="border-b border-border/40 glass sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="mr-2 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="size-5" />
            </Link>
            <div className="size-8 rounded-xl bg-emerald/20 flex items-center justify-center">
              <Sparkles className="size-4 text-emerald" style={{ color: "var(--emerald)" }} />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight">SafePool</span>
            <span className="ml-3 text-xs text-muted-foreground hidden sm:inline">Activity & Insights</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <span className="text-foreground font-semibold">Activity</span>
          </nav>
        </div>
      </header>

      <main id="maincontent" className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        {/* Top Summary Cards */}
        <section className="grid sm:grid-cols-3 gap-5" role="region" aria-label="Financial summary">
          <Card className="p-6 rounded-3xl glass gradient-border flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-emerald-soft flex items-center justify-center text-emerald">
              <TrendingUp className="size-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Total Income</p>
              <h3 className="text-2xl font-black font-display tabular mt-1">{formatMoney(totalIncome)}</h3>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl glass gradient-border flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-rose/10 flex items-center justify-center text-rose-400">
              <TrendingDown className="size-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Total Expenses</p>
              <h3 className="text-2xl font-black font-display tabular mt-1 text-rose-400">{formatMoney(totalExpenses)}</h3>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl glass gradient-border flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-sky/10 flex items-center justify-center text-sky-400">
              <DollarSign className="size-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Net Pool flow</p>
              <h3 className="text-2xl font-black font-display tabular mt-1 text-sky-400">
                {formatMoney(totalIncome - totalExpenses)}
              </h3>
            </div>
          </Card>
        </section>

        {/* Chart breakdown and details */}
        <motion.section
          className="grid md:grid-cols-5 gap-6"
          custom={1}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          {/* Pie Chart Card */}
          <Card className="md:col-span-3 p-6 rounded-3xl glass-elevated gradient-border flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-extrabold text-xl">Visual Breakdown</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Filter by income or expenses</p>
              </div>
              <div className="inline-flex p-1 rounded-full bg-muted/50">
                <button
                  onClick={() => {
                    feedback.tap();
                    setActiveTab("out");
                  }}
                  className={`px-4 py-1.5 text-xs rounded-full transition-all ${
                    activeTab === "out" ? "bg-background/80 shadow text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  Expenses
                </button>
                <button
                  onClick={() => {
                    feedback.tap();
                    setActiveTab("in");
                  }}
                  className={`px-4 py-1.5 text-xs rounded-full transition-all ${
                    activeTab === "in" ? "bg-background/80 shadow text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  Income
                </button>
              </div>
            </div>

            <div className="h-72 relative flex items-center justify-center">
              {breakdownData.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">
                  No records logged for {activeTab === "out" ? "Expenses" : "Income"}.
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdownData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={75}
                        outerRadius={105}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {breakdownData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          color: "var(--popover-foreground)",
                        }}
                        formatter={(v) => formatMoney(Number(v))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center info */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">
                      Total {activeTab === "out" ? "Spent" : "Earned"}
                    </span>
                    <span
                      className={`font-display font-black text-3xl mt-1 tabular transition-colors duration-300 ${
                        activeTab === "out" ? "text-rose-400" : "text-emerald-400"
                      }`}
                      style={{
                        filter: activeTab === "out"
                          ? "drop-shadow(0 0 10px rgba(244,63,94,0.25))"
                          : "drop-shadow(0 0 10px rgba(16,185,129,0.25))"
                      }}
                    >
                      {formatMoney(totalAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Categories List Card */}
          <Card className="md:col-span-2 p-6 rounded-3xl glass gradient-border flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                Categories Overview
              </h3>
              <ul className="space-y-4">
                {breakdownData.length === 0 && (
                  <li className="text-sm text-muted-foreground">No data to display.</li>
                )}
                {breakdownData.map((c) => {
                  const pct = totalAmount ? (c.value / totalAmount) * 100 : 0;
                  return (
                    <li key={c.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium text-text-primary">
                          <span className="size-6 rounded-lg bg-surface-2 flex items-center justify-center border border-border/20">{c.emoji}</span>
                          {c.name}
                        </span>
                        <span
                          className="tabular font-semibold px-2 py-0.5 rounded-full text-xs"
                          style={{ background: `color-mix(in srgb, ${c.color} 15%, transparent)`, color: c.color }}
                        >
                          {formatMoney(c.value)} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                          style={{
                            background: `linear-gradient(90deg, color-mix(in srgb, ${c.color} 70%, white), ${c.color})`,
                            boxShadow: `0 0 8px ${c.color}`
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>
        </motion.section>

        {/* Transaction History Log Section */}
        <motion.section
          className="space-y-4"
          custom={2}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-extrabold text-2xl">Transaction History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Logs stored completely local-first</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Filter Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => {
                  feedback.tap();
                  setFilterCategory(e.target.value);
                }}
                className="bg-muted/50 border border-border/40 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald/40"
              >
                <option value="All">All Categories</option>
                {expenseCategories.map((c) => (
                  <option key={`exp-${c.key}`} value={c.key}>
                    {c.emoji} {c.key} (Expense)
                  </option>
                ))}
                {incomeCategories.map((c) => (
                  <option key={`inc-${c.key}`} value={c.key}>
                    {c.emoji} {c.key} (Income)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Card className="rounded-3xl glass gradient-border divide-y divide-border/40 overflow-hidden">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                No matching transactions found.
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filteredTransactions.map((t) => {
                  const catList = t.type === "in" ? incomeCategories : expenseCategories;
                  const meta = catList.find((c) => c.key === t.category) ?? { emoji: "✨", color: "var(--teal)" };

                  return (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, x: 40, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                      className="flex items-center gap-4 px-6 py-4.5 hover:bg-muted/20 transition-colors"
                    >
                      <div
                        className="size-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: t.type === "in" ? "var(--emerald-soft)" : "var(--muted)" }}
                      >
                        {meta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate flex items-center gap-2">
                          {t.category}
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                            style={
                              t.type === "in"
                                ? { background: "var(--emerald-soft)", color: "var(--emerald)" }
                                : { background: "rgba(239, 68, 68, 0.1)", color: "rgb(248, 113, 113)" }
                            }
                          >
                            {t.type === "in" ? "Income" : "Expense"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(t.timestamp).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-1 tabular font-display font-black text-xl"
                        style={t.type === "in" ? { color: "var(--emerald)" } : { color: "var(--rose)" }}
                      >
                        {t.type === "in" ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}
                        {t.type === "in" ? "+" : "-"}{formatMoney(t.amount)}
                      </div>
                      <button
                        onClick={() => {
                          feedback.warning();
                          removeTransaction(t.id);
                        }}
                        className="p-1 ml-2 opacity-40 hover:opacity-100 hover:text-destructive transition-all"
                        aria-label="Remove transaction"
                      >
                        <Trash2 className="size-4.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </Card>
        </motion.section>
      </main>

      <footer className="py-12 text-center text-xs text-muted-foreground">
        SafePool · Data is client-side encrypted and stays on your device.
      </footer>
    </div>
  );
}

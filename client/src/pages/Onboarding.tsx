import { useState } from "react";
import { useLocation } from "wouter";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Plus,
  Target,
  Repeat,
  BookOpen,
  CalendarDays,
  Sparkles,
  CheckCircle,
  DollarSign,
  Lightbulb,
  BarChart3,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const BUCKET_NAMES = ["Play Money", "Expenses", "Savings", "Investments", "Education"];

const BUCKETS = [
  { name: "Play Money",   color: "bg-purple-500", desc: "Entertainment & fun",       emoji: "🎮" },
  { name: "Expenses",     color: "bg-blue-500",   desc: "Bills & daily necessities",  emoji: "🛒" },
  { name: "Savings",      color: "bg-green-500",  desc: "Emergency fund & goals",     emoji: "🏦" },
  { name: "Investments",  color: "bg-orange-500", desc: "Long-term wealth building",  emoji: "📈" },
  { name: "Education",    color: "bg-pink-500",   desc: "Courses & self-improvement", emoji: "📚" },
];

const TOTAL_STEPS = 7;

// ─── Slide variants ────────────────────────────────────────────────────────────

const slideIn  = { initial: { opacity: 0, x: 40 },  animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 } };
const fadeUp   = { initial: { opacity: 0, y: 24 },  animate: { opacity: 1, y: 0 } };
const popIn    = { initial: { scale: 0 },            animate: { scale: 1 }, transition: { type: "spring", stiffness: 220, delay: 0.15 } };

// ─── Component ────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);

  const { createBuckets } = useAppData();

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = () => {
    createBuckets(BUCKET_NAMES);
    localStorage.setItem("qt_onboarding_done", "true");
    toast.success("Welcome to Quintave! 🎉");
    setLocation("/");
  };

  const isFinishing = false;

  // Progress dots
  const dots = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex flex-col safe-area-top safe-area-pb">

      {/* Top bar: step counter + dots */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
        <span className="text-xs text-muted-foreground font-medium">
          {step} of {TOTAL_STEPS}
        </span>
        <div className="flex gap-1.5">
          {dots.map(d => (
            <div
              key={d}
              className={`rounded-full transition-all duration-300 ${
                d === step
                  ? "w-5 h-2 bg-primary"
                  : d < step
                  ? "w-2 h-2 bg-primary/40"
                  : "w-2 h-2 bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>
        {step < TOTAL_STEPS ? (
          <button onClick={() => setStep(TOTAL_STEPS)} className="text-xs text-muted-foreground underline underline-offset-2">
            Skip
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Slide content */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Welcome ─────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="s1" {...slideIn} className="h-full flex flex-col gap-6">
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                <motion.div {...popIn} className="p-5 rounded-3xl bg-brand-gradient shadow-soft-lg">
                  <TrendingUp className="h-14 w-14 text-white" />
                </motion.div>
                <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="space-y-3">
                  <h1 className="text-3xl font-bold tracking-tight">Welcome to Quintave</h1>
                  <p className="text-muted-foreground text-base leading-relaxed max-w-xs mx-auto">
                    Your personal finance tracker built around <strong>awareness</strong>, not guilt.
                  </p>
                </motion.div>
                <motion.div
                  {...fadeUp}
                  transition={{ delay: 0.35 }}
                  className="w-full space-y-3"
                >
                  {[
                    { icon: DollarSign, text: "Log every transaction in seconds" },
                    { icon: Target,     text: "Set goals and watch them grow" },
                    { icon: Repeat,     text: "Build healthy money habits" },
                    { icon: BookOpen,   text: "Journal your financial journey" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 shadow-soft border">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">{text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: The 5 Envelopes ─────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="s2" {...slideIn} className="h-full flex flex-col gap-4">
              <motion.div {...fadeUp} className="space-y-1">
                <h2 className="text-2xl font-bold">Your 5 Envelopes</h2>
                <p className="text-muted-foreground text-sm">
                  Quintave automatically organises your money into 5 equal categories — 20% each. Every transaction belongs to one.
                </p>
              </motion.div>
              <div className="flex-1 flex flex-col gap-3 justify-center">
                {BUCKETS.map((b, i) => (
                  <motion.div
                    key={b.name}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-4 bg-card rounded-xl px-4 py-3 shadow-soft border"
                  >
                    <span className="text-2xl">{b.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.desc}</p>
                    </div>
                    <div className={`w-2 h-8 rounded-full ${b.color}`} />
                  </motion.div>
                ))}
              </div>
              <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <p className="text-xs text-primary font-medium flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Think of these as jars on a shelf. When you add income, all 5 jars fill up equally.
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ── Step 3: Logging Transactions ────────────────────────────── */}
          {step === 3 && (
            <motion.div key="s3" {...slideIn} className="h-full flex flex-col gap-4">
              <motion.div {...fadeUp} className="space-y-1">
                <h2 className="text-2xl font-bold">Logging Transactions</h2>
                <p className="text-muted-foreground text-sm">
                  Head to <strong>Transactions</strong> to add income or expenses. Here's what each field means:
                </p>
              </motion.div>
              <div className="flex-1 flex flex-col gap-3 justify-center">
                {[
                  {
                    step: "1",
                    color: "bg-blue-500",
                    title: "Pick Income or Expense",
                    desc: "Log a paycheck as income. Log a coffee as an expense.",
                  },
                  {
                    step: "2",
                    color: "bg-purple-500",
                    title: "Choose an Envelope",
                    desc: "Which of your 5 buckets does this belong to?",
                  },
                  {
                    step: "3",
                    color: "bg-orange-500",
                    title: "Set the Behaviour",
                    desc: "Was it Planned, Unplanned, or Impulse? This is the key insight — be honest!",
                  },
                  {
                    step: "4",
                    color: "bg-green-500",
                    title: "Enter Amount + Note",
                    desc: "Add the amount and an optional description.",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 bg-card rounded-xl px-4 py-3 shadow-soft border"
                  >
                    <div className={`w-7 h-7 rounded-full ${item.color} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-xs font-bold">{item.step}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <p className="text-xs text-primary font-medium flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>Tracking <strong>Impulse</strong> purchases is where most people find their biggest savings opportunities.</span>
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ── Step 4: Goals ───────────────────────────────────────────── */}
          {step === 4 && (
            <motion.div key="s4" {...slideIn} className="h-full flex flex-col gap-4">
              <motion.div {...fadeUp} className="space-y-1">
                <h2 className="text-2xl font-bold">Setting Goals</h2>
                <p className="text-muted-foreground text-sm">
                  Use the <strong>Goals</strong> page to set financial targets — like saving for a holiday or paying off debt.
                </p>
              </motion.div>
              <motion.div {...popIn} className="flex justify-center py-4">
                <div className="p-5 rounded-3xl bg-green-500/10">
                  <Target className="h-16 w-16 text-green-600" />
                </div>
              </motion.div>
              <div className="flex-1 flex flex-col gap-3 justify-center">
                {[
                  { icon: "🎯", title: "Name your goal",         desc: 'e.g. "Emergency Fund" or "New MacBook"' },
                  { icon: "💰", title: "Set a target amount",    desc: "How much do you need to save?" },
                  { icon: "📅", title: "Pick a target date",     desc: "A deadline keeps you focused." },
                  { icon: "📊", title: "Track your progress",    desc: "A progress bar shows how close you are." },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 shadow-soft border"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Step 5: Habits ──────────────────────────────────────────── */}
          {step === 5 && (
            <motion.div key="s5" {...slideIn} className="h-full flex flex-col gap-4">
              <motion.div {...fadeUp} className="space-y-1">
                <h2 className="text-2xl font-bold">Building Habits</h2>
                <p className="text-muted-foreground text-sm">
                  The <strong>Habits</strong> page tracks recurring financial behaviours — things you do regularly that affect your money.
                </p>
              </motion.div>
              <motion.div {...popIn} className="flex justify-center py-4">
                <div className="p-5 rounded-3xl bg-orange-500/10">
                  <Repeat className="h-16 w-16 text-orange-500" />
                </div>
              </motion.div>
              <div className="flex-1 flex flex-col gap-3 justify-center">
                {[
                  { emoji: "☕", example: "Morning coffee",     type: "Expense", freq: "Daily" },
                  { emoji: "🏋️", example: "Gym membership",    type: "Expense", freq: "Monthly" },
                  { emoji: "💼", example: "Freelance payment",  type: "Income",  freq: "Weekly" },
                ].map((item, i) => (
                  <motion.div
                    key={item.example}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 shadow-soft border"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.example}</p>
                      <p className="text-xs text-muted-foreground">{item.freq}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.type === "Income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {item.type}
                    </span>
                  </motion.div>
                ))}
              </div>
              <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <p className="text-xs text-primary font-medium flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Tap the checkmark on a habit each time you complete it — it logs the transaction automatically and tracks your streak.
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ── Step 6: Journey Journal ──────────────────────────────────── */}
          {step === 6 && (
            <motion.div key="s6" {...slideIn} className="h-full flex flex-col gap-4">
              <motion.div {...fadeUp} className="space-y-1">
                <h2 className="text-2xl font-bold">Your Journey</h2>
                <p className="text-muted-foreground text-sm">
                  The <strong>Journey</strong> page is your financial journal. Reflect on your spending and what drives it.
                </p>
              </motion.div>
              <motion.div {...popIn} className="flex justify-center py-2">
                <div className="p-5 rounded-3xl bg-pink-500/10">
                  <BookOpen className="h-16 w-16 text-pink-500" />
                </div>
              </motion.div>
              <div className="flex-1 flex flex-col gap-3 justify-center">
                <motion.p {...fadeUp} transition={{ delay: 0.2 }} className="text-sm font-medium text-muted-foreground">
                  Example reflection prompts:
                </motion.p>
                {[
                  "How did my spending align with my values this week?",
                  "What triggered my last impulse purchase?",
                  "What financial win am I most proud of this month?",
                ].map((prompt, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.1 }}
                    className="bg-card rounded-xl px-4 py-3 shadow-soft border"
                  >
                    <p className="text-sm text-muted-foreground italic">"{prompt}"</p>
                  </motion.div>
                ))}
              </div>
              <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <p className="text-xs text-primary font-medium flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Every journal entry automatically attaches a snapshot of your current finances so you can look back and see your progress.
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ── Step 7: Timeline + Ready ─────────────────────────────────── */}
          {step === 7 && (
            <motion.div key="s7" {...slideIn} className="h-full flex flex-col gap-5">
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
                <motion.div {...popIn} className="p-5 rounded-3xl bg-brand-gradient shadow-soft-lg">
                  <Sparkles className="h-14 w-14 text-white" />
                </motion.div>
                <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">You're all set!</h2>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Tap "Start Tracking" and your 5 envelopes will be created. Here's a quick reminder of where everything lives:
                  </p>
                </motion.div>
                <motion.div {...fadeUp} transition={{ delay: 0.35 }} className="w-full grid grid-cols-2 gap-3">
                  {[
                    { icon: Plus,          label: "Transactions", desc: "Log income & expenses",   color: "text-blue-500" },
                    { icon: Target,        label: "Goals",        desc: "Set savings targets",      color: "text-green-500" },
                    { icon: Repeat,        label: "Habits",       desc: "Recurring behaviours",     color: "text-orange-500" },
                    { icon: BookOpen,      label: "Journey",      desc: "Reflect & journal",        color: "text-pink-500" },
                    { icon: CalendarDays,  label: "Timeline",     desc: "Browse by date",           color: "text-purple-500" },
                    { icon: BarChart3,     label: "Dashboard",    desc: "See the big picture",      color: "text-primary" },
                  ].map(({ icon: Icon, label, desc, color }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.07 }}
                      className="flex flex-col items-center gap-1.5 bg-card rounded-xl p-3 shadow-soft border text-center"
                    >
                      <Icon className={`h-5 w-5 ${color}`} />
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
                <motion.div
                  {...fadeUp}
                  transition={{ delay: 0.85 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  5 envelopes will be created for you automatically
                </motion.div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="px-6 pb-8 pt-4 flex justify-between items-center shrink-0">
        <Button
          variant="ghost"
          onClick={back}
          disabled={step === 1}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {step < TOTAL_STEPS ? (
          <Button onClick={next} size="lg" className="bg-brand-gradient text-white hover:opacity-90 font-semibold px-8">
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            size="lg"
            disabled={isFinishing}
            className="bg-brand-gradient text-white hover:opacity-90 font-semibold px-8"
          >
            {isFinishing ? "Setting up..." : "Start Tracking"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

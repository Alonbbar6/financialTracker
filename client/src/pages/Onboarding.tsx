import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Sparkles, TrendingUp, Target, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const BUCKET_NAMES = ["Play Money", "Expenses", "Savings", "Investments", "Education"];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);

  const createBucket = trpc.buckets.create.useMutation();
  const completeOnboarding = trpc.onboarding.complete.useMutation();

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleFinish = async () => {
    try {
      // Create all 5 buckets with $0 balance (they're just categories)
      for (const name of BUCKET_NAMES) {
        await createBucket.mutateAsync({
          name,
          balance: "0.00",
        });
      }

      // Mark onboarding as complete
      await completeOnboarding.mutateAsync();

      toast.success("Welcome to Quintave! 🎉");
      setLocation("/");
    } catch (error) {
      toast.error("Failed to complete setup. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-soft-lg">
        <CardHeader>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-2"
          >
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Welcome to Quintave</CardTitle>
          </motion.div>
          <CardDescription>
            Your journey to financial awareness starts here
          </CardDescription>
          <Progress value={(step / 3) * 100} className="mt-4" />
        </CardHeader>

        <CardContent className="min-h-[450px]">
          <AnimatePresence mode="wait">
            {/* Step 1: Introduction */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="inline-block p-4 rounded-full bg-brand-gradient mb-4"
                  >
                    <TrendingUp className="h-12 w-12 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-semibold mb-3">Track Every Dollar</h3>
                  <p className="text-muted-foreground text-lg mb-6">
                    Quintave helps you understand where your money goes by tracking 
                    every expense and categorizing it automatically.
                  </p>
                </div>

                <div className="bg-accent/20 rounded-lg p-6 space-y-3">
                  <h4 className="font-semibold">What makes this different?</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span><strong>Behavioral awareness</strong> - Track the "why" behind spending (Planned, Unplanned, Impulse)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span><strong>Five categories</strong> - Automatically split your spending into balanced areas of life</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span><strong>Shame-free</strong> - Focus on awareness and growth, not guilt</span>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNext} size="lg">
                    Let's Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Categories Explanation */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-semibold mb-3">Your Five Categories</h3>
                  <p className="text-muted-foreground mb-6">
                    Every expense you track will be organized into one of these five categories. 
                    We'll show you how your spending breaks down across each area.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { name: "Play Money", desc: "Entertainment, hobbies, fun purchases", color: "bg-purple-500" },
                    { name: "Expenses", desc: "Bills, groceries, daily necessities", color: "bg-blue-500" },
                    { name: "Savings", desc: "Emergency fund, short-term goals", color: "bg-green-500" },
                    { name: "Investments", desc: "Long-term wealth building", color: "bg-orange-500" },
                    { name: "Education", desc: "Learning, courses, self-improvement", color: "bg-pink-500" },
                  ].map((category, index) => (
                    <motion.div
                      key={category.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                    >
                      <div className={`w-3 h-3 rounded-full ${category.color}`} />
                      <div className="flex-1">
                        <p className="font-semibold">{category.name}</p>
                        <p className="text-sm text-muted-foreground">{category.desc}</p>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">20%</span>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleNext} size="lg">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Ready to Start */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="inline-block p-4 rounded-full bg-green-500/10 mb-4"
                  >
                    <Target className="h-12 w-12 text-green-600" />
                  </motion.div>
                  <h3 className="text-2xl font-semibold mb-3">You're All Set!</h3>
                  <p className="text-muted-foreground text-lg mb-6">
                    Start tracking your expenses and watch your financial awareness grow.
                  </p>
                </div>

                <div className="bg-brand-gradient text-white rounded-lg p-6 space-y-4">
                  <h4 className="font-semibold text-lg">Quick Tips to Get Started:</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-2xl">💰</span>
                      <div>
                        <p className="font-medium">Log every transaction</p>
                        <p className="text-white/80 text-sm">Even small purchases add up - track them all</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <p className="font-medium">Be honest about behavior</p>
                        <p className="text-white/80 text-sm">Mark purchases as Planned, Unplanned, or Impulse</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <p className="font-medium">Review your patterns</p>
                        <p className="text-white/80 text-sm">Check your dashboard weekly to spot trends</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleFinish} size="lg" disabled={createBucket.isPending}>
                    {createBucket.isPending ? "Setting up..." : "Start Tracking"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

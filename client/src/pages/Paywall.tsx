import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePurchase } from "@/contexts/PurchaseContext";
import { TrendingUp, Target, Shield, BookOpen, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const FEATURES = [
  { icon: TrendingUp, text: "Track every dollar across 5 smart buckets" },
  { icon: Target,    text: "Set financial goals and measure progress" },
  { icon: Shield,    text: "Build money habits that stick with streak tracking" },
  { icon: BookOpen,  text: "Journal entries with automatic financial snapshots" },
  { icon: CheckCircle, text: "Beautiful analytics to spot spending patterns" },
];

export default function Paywall() {
  const { purchase, restore, trialActive, trialDaysRemaining } = usePurchase();
  const [, setLocation] = useLocation();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      await purchase();
      toast.success("Purchase successful! Welcome to Quintave.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Purchase failed";
      if (!message.includes("UserCancelled") && !message.includes("purchaseCancelled")) {
        toast.error(message);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restore();
      toast.success("Purchase restored!");
    } catch {
      toast.error("Could not restore purchase. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex flex-col items-center justify-center p-6 safe-area-top safe-area-pb">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Back button — only when trial is still active */}
        {trialActive && (
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 220 }}
            className="inline-flex p-4 rounded-full bg-brand-gradient mx-auto"
          >
            <TrendingUp className="h-10 w-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight">Quintave</h1>
          <p className="text-muted-foreground text-sm">
            {trialActive
              ? `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? "s" : ""} left in your free trial.`
              : "Your free trial has ended. Unlock Quintave for life."}
          </p>
        </div>

        {/* Feature list */}
        <Card className="shadow-soft">
          <CardContent className="pt-5 pb-4 space-y-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className="flex items-center gap-3"
              >
                <feature.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{feature.text}</span>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Price card */}
        <Card className="border-2 border-primary shadow-soft-lg">
          <CardHeader className="pb-2 pt-5 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              One-Time Purchase
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">$8</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pay once, own it forever
            </p>
          </CardHeader>
          <CardContent className="pb-5">
            <Button
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="w-full bg-brand-gradient text-white hover:opacity-90 transition-opacity font-semibold"
              size="lg"
            >
              {isPurchasing ? "Processing..." : "Get Quintave — $8"}
            </Button>
          </CardContent>
        </Card>

        {/* Restore + legal */}
        <div className="text-center space-y-3">
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="text-sm text-muted-foreground underline underline-offset-2"
          >
            {isRestoring ? "Restoring..." : "Restore Purchase"}
          </button>
          <p className="text-xs text-muted-foreground px-2 leading-relaxed">
            Payment of $8.00 will be charged to your Apple ID account at confirmation
            of purchase. This is a one-time payment — no subscriptions, no recurring charges.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

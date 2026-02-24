import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePurchase } from "@/contexts/PurchaseContext";
import { TrendingUp, Target, Shield, BookOpen, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  { icon: TrendingUp, text: "Track every dollar across 5 smart buckets" },
  { icon: Target,    text: "Set financial goals and measure progress" },
  { icon: Shield,    text: "Build money habits that stick with streak tracking" },
  { icon: BookOpen,  text: "Journal entries with automatic financial snapshots" },
  { icon: CheckCircle, text: "Beautiful analytics to spot spending patterns" },
];

export default function Paywall() {
  const { purchase, restore } = usePurchase();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      await purchase();
      toast.success("Purchase complete! Welcome to Quintave.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Purchase failed";
      // RevenueCat throws when the user cancels — don't show an error for that
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
            Master your money with behavioural awareness
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
              <span className="text-5xl font-bold">$7.99</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Buy once, own forever. No subscriptions.
            </p>
          </CardHeader>
          <CardContent className="pb-5">
            <Button
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="w-full bg-brand-gradient text-white hover:opacity-90 transition-opacity font-semibold"
              size="lg"
            >
              {isPurchasing ? "Processing..." : "Buy Now — $7.99"}
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
            Payment will be charged to your Apple ID at confirmation.
            The purchase is non-refundable except as required by law.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

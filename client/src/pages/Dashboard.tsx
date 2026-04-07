import { useEffect } from "react";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link, useLocation } from "wouter";
import { ArrowDown, ArrowUp, Plus, AlertTriangle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { FinancialProgressChart } from "@/components/FinancialProgressChart";
import { isNative } from "@/lib/platform";
import { usePurchase } from "@/contexts/PurchaseContext";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { buckets, transactions } = useAppData();
  const { trialActive, trialDaysRemaining, hasPurchased } = usePurchase();

  // Check onboarding status
  useEffect(() => {
    if (!localStorage.getItem("qt_onboarding_done")) {
      setLocation("/onboarding");
    }
  }, [setLocation]);

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === "INCOME")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === "EXPENSE")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const net = totalIncome - totalExpenses;

  // Calculate spending per bucket
  const bucketSpending = buckets.map(bucket => {
    const spent = transactions
      .filter(t => t.type === "EXPENSE" && t.bucketId === bucket.id)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const allocated = parseFloat(bucket.allocated || "0");
    const remaining = allocated - spent;
    const percentUsed = allocated > 0 ? (spent / allocated) * 100 : 0;
    const isOverspent = spent > allocated && allocated > 0;
    const debt = isOverspent ? spent - allocated : 0;

    return { ...bucket, spent, allocated, remaining, percentUsed, isOverspent, debt };
  });

  const totalDebt = bucketSpending
    .filter(b => b.isOverspent)
    .reduce((sum, b) => sum + b.debt, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card safe-area-top">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-3">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="min-w-0">
              <h1 className="text-2xl font-bold bg-brand-gradient bg-clip-text text-transparent">Quintave</h1>
              <p className="text-muted-foreground text-sm truncate">Welcome</p>
            </motion.div>
            <nav className="flex items-center gap-1 overflow-x-auto shrink-0 max-w-[65vw]" style={{ scrollbarWidth: "none" }}>
              <Link href="/timeline"><Button variant="ghost" size="sm" className="whitespace-nowrap text-xs px-2">Timeline</Button></Link>
              <Link href="/transactions"><Button variant="ghost" size="sm" className="whitespace-nowrap text-xs px-2">Transactions</Button></Link>
              <Link href="/goals"><Button variant="ghost" size="sm" className="whitespace-nowrap text-xs px-2">Goals</Button></Link>
              <Link href="/habits"><Button variant="ghost" size="sm" className="whitespace-nowrap text-xs px-2">Habits</Button></Link>
              <Link href="/journey"><Button variant="ghost" size="sm" className="whitespace-nowrap text-xs px-2">Journey</Button></Link>
            </nav>
          </div>
        </div>

        {/* Trial banner */}
        {isNative && trialActive && !hasPurchased && (
          <div className="border-t border-primary/20 bg-primary/5">
            <div className="container py-2 flex items-center justify-between gap-2">
              <p className="text-xs text-primary font-medium">
                {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} left in your free trial
              </p>
              <Link href="/subscribe">
                <Button size="sm" className="bg-brand-gradient text-white h-7 text-xs px-3 shrink-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Unlock — $8
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ArrowDown className="h-4 w-4 text-green-600" />Money In
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total income tracked</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-red-600" />Money Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total expenses tracked</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>${net.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Current balance</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Financial Progress Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
          <FinancialProgressChart />
        </motion.div>

        {/* Debt Warning */}
        {totalDebt > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
            <Card className="border-red-500 bg-red-50 dark:bg-red-950/20 shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">You've overspent in some categories</h3>
                    <p className="text-red-700 dark:text-red-300 mt-1">
                      You owe yourself <span className="font-bold">${totalDebt.toFixed(2)}</span> across overspent buckets
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bucket Envelopes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Your Envelopes</h2>
              <p className="text-muted-foreground mt-1">Each envelope gets 20% of your income</p>
            </div>
            <Link href="/transactions">
              <Button><Plus className="h-4 w-4 mr-2" />Add Transaction</Button>
            </Link>
          </div>

          {bucketSpending.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No buckets found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bucketSpending.map((bucket, index) => (
                <motion.div key={bucket.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <Card className={`shadow-soft hover:shadow-soft-lg transition-shadow ${bucket.isOverspent ? "border-red-500" : ""}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{bucket.name}</span>
                        {bucket.isOverspent && <AlertTriangle className="h-5 w-5 text-red-600" />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Allocated</span>
                          <span className="font-medium">${bucket.allocated.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Spent</span>
                          <span className={`font-medium ${bucket.isOverspent ? "text-red-600" : ""}`}>${bucket.spent.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Remaining</span>
                          <span className={bucket.isOverspent ? "text-red-600" : "text-green-600"}>${bucket.remaining.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Progress value={Math.min(bucket.percentUsed, 100)} className={bucket.isOverspent ? "bg-red-100" : ""} />
                        <p className="text-xs text-center text-muted-foreground">{bucket.percentUsed.toFixed(0)}% used</p>
                      </div>
                      {bucket.isOverspent && (
                        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                          <p className="text-sm text-red-900 dark:text-red-100 font-medium">You owe yourself ${bucket.debt.toFixed(2)}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Motivational Message */}
        <Card className="bg-brand-gradient text-white shadow-soft-lg">
          <CardContent className="py-6">
            <p className="text-lg font-medium text-center">
              {totalDebt > 0
                ? "Every overspend is a learning opportunity. Adjust and keep going! 💪"
                : "You're doing great! Keep tracking and stay aware of your spending. ✨"}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PurchaseProvider, usePurchase } from "./contexts/PurchaseContext";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Goals from "./pages/Goals";
import Habits from "./pages/Habits";
import HabitHistory from "./pages/HabitHistory";
import Journey from "./pages/Journey";
import Onboarding from "./pages/Onboarding";
import Timeline from "./pages/Timeline";
import Paywall from "./pages/Paywall";
import { Capacitor } from "@capacitor/core";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/subscribe"} component={Paywall} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/transactions"} component={Transactions} />
      <Route path={"/goals"} component={Goals} />
      <Route path={"/habits"} component={Habits} />
      <Route path={"/habits/:id/history"} component={HabitHistory} />
      <Route path={"/journey"} component={Journey} />
      <Route path={"/timeline"} component={Timeline} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Gates the app behind a 30-day free trial + subscription.
 * Trial is tracked server-side (tied to Google account), so reinstalling
 * the app does not reset it. Web users are never gated.
 */
function PurchaseGuard({ children }: { children: React.ReactNode }) {
  const { hasAccess, isLoading } = usePurchase();

  // Web: no paywall
  if (!Capacitor.isNativePlatform()) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return <Paywall />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <PurchaseProvider>
          <TooltipProvider>
            <Toaster />
            <PurchaseGuard>
              <Router />
            </PurchaseGuard>
          </TooltipProvider>
        </PurchaseProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

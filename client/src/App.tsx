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
 * Shows the Paywall on native until the user has purchased.
 * On web the paywall is skipped — the web version has no IAP gate.
 */
function PurchaseGuard({ children }: { children: React.ReactNode }) {
  const { hasPurchased, isLoading } = usePurchase();

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

  if (!hasPurchased) {
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

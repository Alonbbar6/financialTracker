import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initializeNativePlugins } from "./lib/native";
import { AppDataProvider } from "./contexts/AppDataContext";
import "./index.css";

const queryClient = new QueryClient();

async function bootstrap() {
  await initializeNativePlugins();

  createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
      <AppDataProvider>
        <App />
      </AppDataProvider>
    </QueryClientProvider>
  );
}

bootstrap().catch(console.error);

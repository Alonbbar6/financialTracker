import { getLoginUrl } from "@/const";
import { isNative } from "@/lib/platform";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

/** Open the OAuth login URL inside a Capacitor in-app browser sheet. */
async function openNativeOAuth(loginUrl: string) {
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({
    url: loginUrl,
    presentationStyle: "popover",
    toolbarColor: "#F7F9FC",
  });
}

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  // On native: listen for the deep-link callback after OAuth completes,
  // and listen for the custom unauthenticated event dispatched from main.tsx.
  useEffect(() => {
    if (!isNative) return;

    let removeUrlListener: (() => void) | undefined;

    const setupListeners = async () => {
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");

      const handle = await App.addListener("appUrlOpen", async event => {
        const url = new URL(event.url);
        // quintave://oauth/callback is sent by the backend after setting the cookie
        if (url.host === "oauth" || url.pathname.includes("/oauth")) {
          await Browser.close();
          await utils.auth.me.refetch();
        }
      });

      removeUrlListener = () => handle.remove();
    };

    setupListeners();

    // main.tsx dispatches this when a 401 is received from the API
    const handleUnauthenticated = () => {
      meQuery.refetch();
    };
    window.addEventListener("quintave:unauthenticated", handleUnauthenticated);

    return () => {
      removeUrlListener?.();
      window.removeEventListener("quintave:unauthenticated", handleUnauthenticated);
    };
  }, [utils, meQuery]);

  // Redirect / open OAuth when the user is not authenticated
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;

    const loginUrl = getLoginUrl();

    if (isNative) {
      openNativeOAuth(loginUrl);
    } else {
      if (loginUrl === "/" || loginUrl === window.location.pathname) return;
      window.location.href = loginUrl;
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}

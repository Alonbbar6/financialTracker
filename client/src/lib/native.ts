import { Capacitor } from "@capacitor/core";

/**
 * Initialize native-only Capacitor plugins.
 * Safe to call on web — returns immediately if not running natively.
 */
export async function initializeNativePlugins(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const [{ SplashScreen }, { StatusBar, Style }, { Keyboard }] =
    await Promise.all([
      import("@capacitor/splash-screen"),
      import("@capacitor/status-bar"),
      import("@capacitor/keyboard"),
    ]);

  // Hide splash screen once the app is ready
  await SplashScreen.hide({ fadeOutDuration: 300 });

  // Configure status bar
  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: "#F7F9FC" });

  // Android: ensure status bar is visible
  if (Capacitor.getPlatform() === "android") {
    await StatusBar.show();
  }

  // Shift body when keyboard opens so inputs stay visible
  Keyboard.addListener("keyboardWillShow", () => {
    document.body.classList.add("keyboard-open");
  });
  Keyboard.addListener("keyboardWillHide", () => {
    document.body.classList.remove("keyboard-open");
  });
}

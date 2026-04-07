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

  await SplashScreen.hide({ fadeOutDuration: 300 });
  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: "#F7F9FC" });

  if (Capacitor.getPlatform() === "android") {
    await StatusBar.show();
  }

  Keyboard.addListener("keyboardWillShow", () => {
    document.body.classList.add("keyboard-open");
  });
  Keyboard.addListener("keyboardWillHide", () => {
    document.body.classList.remove("keyboard-open");
  });
}

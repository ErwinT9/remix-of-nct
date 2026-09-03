import { Capacitor, registerPlugin } from "@capacitor/core";

/**
 * Native system-bar appearance (Android, WindowInsetsControllerCompat).
 *
 * The in-app light/dark preference is independent of the OS setting, so the
 * native theme qualifiers can only get the cold-start icon contrast right.
 * This keeps the status/navigation bar icons in sync afterwards.
 *
 * Deliberately NOT @capacitor/status-bar: that plugin's background-colour APIs
 * are the deprecated edge-to-edge surface we are removing.
 */
interface SystemBarsPlugin {
  setAppearance(options: { dark: boolean }): Promise<void>;
}

const systemBars = registerPlugin<SystemBarsPlugin>("SystemBars");

export function setSystemBarsAppearance(dark: boolean): void {
  if (!Capacitor.isNativePlatform()) return;
  void systemBars.setAppearance({ dark }).catch(() => {
    /* plugin unavailable on this build — native theme qualifiers still apply */
  });
}

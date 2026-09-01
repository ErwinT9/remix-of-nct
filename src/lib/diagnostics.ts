import { isNative, platformName } from "@/lib/native/platform";
import { isOnline } from "@/lib/offline/network";

/**
 * Safe, non-sensitive environment snapshot attached to bug reports.
 * Never includes tokens, passwords, keys or any account credentials.
 */
export const APP_VERSION = "1.0.0";

export type Diagnostics = {
  platform: string;
  app_version: string;
  os_version: string | null;
  network_status: string;
  device_info: Record<string, unknown>;
};

export async function collectDiagnostics(): Promise<Diagnostics> {
  const language =
    typeof navigator !== "undefined" ? (navigator.language ?? "unknown") : "unknown";
  const screenSize =
    typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "unknown";
  const timezone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "unknown";
    }
  })();

  let model: string | null = null;
  let manufacturer: string | null = null;
  let osVersion: string | null = null;
  let operatingSystem: string | null = null;
  let webViewVersion: string | null = null;

  if (isNative()) {
    try {
      const { Device } = await import("@capacitor/device");
      const info = await Device.getInfo();
      model = info.model ?? null;
      manufacturer = info.manufacturer ?? null;
      osVersion = info.osVersion ?? null;
      operatingSystem = info.operatingSystem ?? null;
      webViewVersion = info.webViewVersion ?? null;
    } catch {
      // Device plugin unavailable — keep the report submittable anyway.
    }
  }

  return {
    platform: platformName(),
    app_version: APP_VERSION,
    os_version: osVersion,
    network_status: isOnline() ? "online" : "offline",
    device_info: {
      model,
      manufacturer,
      operating_system: operatingSystem,
      web_view_version: webViewVersion,
      native: isNative(),
      language,
      timezone,
      screen: screenSize,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      captured_at: new Date().toISOString(),
    },
  };
}

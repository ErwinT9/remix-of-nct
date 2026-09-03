import { isNative, platformName } from "@/lib/native/platform";

export const SUPPORT_EMAIL = "support@vexalabs.biz";
const SUBJECT = "SOLACE: BREAKUP RECOVERY Feedback";

type DeviceMeta = {
  appVersion: string;
  buildNumber: string;
  deviceModel: string;
  osVersion: string;
};

async function collectMeta(): Promise<DeviceMeta> {
  const meta: DeviceMeta = {
    appVersion: "1.0.0",
    buildNumber: "—",
    deviceModel: "—",
    osVersion: "—",
  };

  if (isNative()) {
    try {
      const { App } = await import("@capacitor/app");
      const info = await App.getInfo();
      meta.appVersion = info.version || meta.appVersion;
      meta.buildNumber = info.build || meta.buildNumber;
    } catch {
      /* ignore */
    }
    try {
      const { Device } = await import("@capacitor/device");
      const info = await Device.getInfo();
      meta.deviceModel = [info.manufacturer, info.model].filter(Boolean).join(" ") || meta.deviceModel;
      meta.osVersion = `${info.operatingSystem ?? platformName()} ${info.osVersion ?? ""}`.trim();
    } catch {
      /* ignore */
    }
    return meta;
  }

  if (typeof navigator !== "undefined") {
    meta.deviceModel = navigator.platform || "Web browser";
    meta.osVersion = navigator.userAgent.slice(0, 120);
  }
  return meta;
}

export async function buildFeedbackMailto(): Promise<string> {
  const meta = await collectMeta();
  const body = [
    `App Version: ${meta.appVersion}`,
    `Build Number: ${meta.buildNumber}`,
    `Device Model: ${meta.deviceModel}`,
    `${isNative() && platformName() === "ios" ? "iOS" : "Android"} Version: ${meta.osVersion}`,
    "--------------------",
    "",
    "",
  ].join("\n");

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`;
}

/**
 * Opens the OS mail chooser.
 *
 * On Android the Capacitor bridge turns a `mailto:` navigation into a standard
 * ACTION_VIEW intent, which is exactly the system behaviour we want (chooser
 * when several mail apps exist, direct launch when a default is set) and needs
 * no runtime permission. The previous implementation probed a non-existent
 * `App.openUrl` API and reported "no email app" on every device — we now only
 * report failure when the navigation itself throws.
 */
export async function openFeedbackEmail(): Promise<boolean> {
  const href = await buildFeedbackMailto();
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  // An anchor click keeps the user gesture, which some WebViews require before
  // handing an external scheme to the OS.
  try {
    const link = document.createElement("a");
    link.href = href;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  } catch {
    /* fall through to a direct navigation */
  }

  try {
    window.location.href = href;
    return true;
  } catch {
    return false;
  }
}

export async function copySupportEmail(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(SUPPORT_EMAIL);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = SUPPORT_EMAIL;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
      return true;
    } catch {
      return false;
    }
  }
}

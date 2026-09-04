import { toast } from "sonner";

import { isNative } from "@/lib/native/platform";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.nocontacttracker.app";

const MESSAGE =
  "Breakups are hard, but you don't have to go through them alone. Use STEADY to stay committed to No Contact, track breakup healing, and get through the tough moments. Give it a try: " +
  PLAY_STORE_URL;

/** Opens the Android share sheet (or the web share API), with a clipboard fallback. */
export async function shareApp(): Promise<void> {
  const text = MESSAGE;

  if (isNative()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title: "STEADY", text, dialogTitle: "Invite a friend" });
      return;
    } catch {
      // fall through to web handling
    }
  }

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: "STEADY", text, url: PLAY_STORE_URL });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success("Invite copied — paste it anywhere.");
  } catch {
    toast("Sharing isn't available here.");
  }
}

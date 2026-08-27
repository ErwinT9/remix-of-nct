import { Lottie } from "lottie-react";

import animationData from "@/assets/congrats.json";

/**
 * Congrats Lottie animation shown after a successfully saved journal entry.
 * Lazy-loaded by callers so the Lottie engine never touches SSR. Replays on
 * every mount, so each saved entry (even several on the same day) re-triggers it.
 * The source animation is landscape (300x180), so the wrapper preserves that
 * aspect ratio and scales responsively without overflowing.
 */
export default function JournalSuccessAnimation() {
  return (
    <Lottie
      src={animationData}
      autoplay
      loop={false}
      className="mx-auto aspect-[5/3] w-[min(86vw,420px)]"
      aria-hidden
    />
  );
}

import { Lottie } from "lottie-react";

import animationData from "@/assets/premium-success.json";

/**
 * Premium Lottie success animation shown after a completed Mood Check-in.
 * Loaded lazily by callers so the Lottie engine never touches SSR. Replays on
 * every mount, so each completed check-in (even several on the same day)
 * re-triggers it.
 */
export default function PremiumSuccessAnimation() {
  return (
    <Lottie
      src={animationData}
      autoplay
      loop={false}
      className="mx-auto aspect-square w-[min(68vw,280px)]"
      aria-hidden
    />
  );
}

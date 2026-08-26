import { Lottie } from "lottie-react";

import animationData from "@/assets/premium-success.json";

/**
 * Premium Lottie success animation shown after a completed Mood Check-in.
 * Loaded lazily by callers so lottie-web never touches SSR. Replays on every
 * mount, so each completed check-in (even several on the same day) re-triggers it.
 */
export default function PremiumSuccessAnimation() {
  return (
    <Lottie
      animationData={animationData}
      loop={false}
      autoplay
      className="mx-auto aspect-square w-[min(68vw,280px)]"
      aria-hidden
    />
  );
}

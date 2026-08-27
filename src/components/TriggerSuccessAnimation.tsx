import { Lottie } from "lottie-react";

import animationData from "@/assets/trigger-congrats.json";

/**
 * Congrats Lottie animation shown after a successfully saved trigger log.
 * Lazy-loaded by callers so the Lottie engine never touches SSR. Replays on
 * every mount, so each saved log (even several on the same day) re-triggers it.
 * The source animation is portrait (398x597), so the wrapper preserves that
 * aspect ratio and scales responsively without overflowing.
 */
export default function TriggerSuccessAnimation() {
  return (
    <Lottie
      src={animationData}
      autoplay
      loop={false}
      className="mx-auto aspect-[398/597] h-[min(70dvh,420px)] w-auto max-w-[86vw]"
      aria-hidden
    />
  );
}

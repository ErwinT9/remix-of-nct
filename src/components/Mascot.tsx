import mascotSrc from "@/assets/solace-mascot.webp";
import { cn } from "@/lib/utils";

/**
 * Solace mascot — the tortoise that represents slow, steady healing.
 *
 * Pure CSS idle animation (breathing + a very slight sway + an occasional
 * blink) so it stays cheap inside the Android WebView. Sizes are fixed per
 * placement so the mascot can never push or break an existing layout.
 */
export type MascotSize = "xs" | "sm" | "md" | "lg" | "hero";

const SIZES: Record<MascotSize, string> = {
  xs: "size-8", // navigation / header
  sm: "size-12", // compact cards
  md: "size-20", // list rows, small placements
  lg: "size-32", // empty states, home companion
  hero: "size-40 sm:size-48", // splash
};

export function Mascot({
  size = "md",
  animate = true,
  reveal = false,
  className,
  alt = "Solace tortoise mascot",
}: {
  size?: MascotSize;
  /** Idle breathing / blinking. */
  animate?: boolean;
  /** One-off entrance reveal (splash). */
  reveal?: boolean;
  className?: string;
  alt?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 select-none",
        SIZES[size],
        animate && "animate-mascot-idle",
        reveal && "animate-logo-reveal",
        className,
      )}
    >
      <img
        src={mascotSrc}
        alt={alt}
        draggable={false}
        loading="eager"
        decoding="async"
        className="size-full object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.08)] dark:drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
      />
      {animate ? (
        <span aria-hidden className="pointer-events-none absolute inset-0">
          <span className="animate-mascot-blink absolute top-[28%] left-[26%] h-[8%] w-[15%] rounded-full bg-[#cfd6c4] blur-[2px]" />
          <span className="animate-mascot-blink absolute top-[28%] left-[59%] h-[8%] w-[15%] rounded-full bg-[#cfd6c4] blur-[2px]" />
        </span>
      ) : null}
    </div>
  );
}

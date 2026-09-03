import { Mascot, type MascotSize } from "@/components/Mascot";
import { cn } from "@/lib/utils";

/**
 * Brand mark: the Solace tortoise mascot. Kept as a thin wrapper so every
 * existing brand placement keeps its own sizing classes.
 */
export function AppLogo({
  animate = false,
  size = "md",
  className,
}: {
  animate?: boolean;
  size?: MascotSize;
  className?: string;
}) {
  return <Mascot size={size} animate reveal={animate} className={cn(className)} />;
}

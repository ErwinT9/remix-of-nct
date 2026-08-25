import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { SubScreen } from "@/components/SubScreen";
import { HEALING_AUDIO_CATEGORIES } from "@/lib/healingAudio";
import { haptic } from "@/lib/native/haptics";

export const Route = createFileRoute("/_authenticated/motivation/healing-audio/")({
  head: () => ({
    meta: [
      { title: "Healing Audio | No Contact Tracker" },
      {
        name: "description",
        content:
          "Guided audio sessions for calm, no-contact strength and healing — streamed whenever you need them.",
      },
      { property: "og:title", content: "Healing Audio | No Contact Tracker" },
      {
        property: "og:description",
        content: "Listen, relax, heal and strengthen your journey with guided audio sessions.",
      },
    ],
  }),
  component: HealingAudioScreen,
});

function HealingAudioScreen() {
  return (
    <SubScreen
      title="Healing Audio"
      description="Listen, relax, heal and strengthen your journey. These sessions stream online."
    >
      <ul className="space-y-3">
        {HEALING_AUDIO_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const linkProps = category.route
            ? ({ to: category.route } as const)
            : ({ to: "/motivation/healing-audio/$categoryId", params: { categoryId: category.id } } as const);
          return (
            <li key={category.id}>
              <Link
                {...linkProps}
                onClick={() => haptic.select()}
                className="press soft-card flex items-center gap-4 rounded-3xl p-5"
              >
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${category.tint}`}
                >
                  <Icon className="size-5 text-on-tint" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{category.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{category.subtitle}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </SubScreen>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { CloudAudioSession } from "@/components/CloudAudioSession";
import { SubScreen } from "@/components/SubScreen";
import { findHealingCategory, type HealingAudioTrack } from "@/lib/healingAudio";
import { haptic } from "@/lib/native/haptics";

export const Route = createFileRoute("/_authenticated/motivation/healing-audio/$categoryId")({
  head: () => ({
    meta: [
      { title: "Healing Audio session | SOLACE: BREAKUP RECOVERY" },
      {
        name: "description",
        content: "Choose a guided audio session and stream it whenever you need support.",
      },
      { property: "og:title", content: "Healing Audio session | SOLACE: BREAKUP RECOVERY" },
      {
        property: "og:description",
        content: "Guided audio for calm, strength and healing during no contact.",
      },
    ],
  }),
  component: HealingAudioCategoryScreen,
});

function HealingAudioCategoryScreen() {
  const { categoryId } = Route.useParams();
  const category = findHealingCategory(categoryId);
  const [session, setSession] = useState<HealingAudioTrack | null>(null);

  if (!category || !category.tracks) {
    return (
      <SubScreen title="Healing Audio" description="This session isn't available.">
        <p className="text-sm text-muted-foreground">
          We couldn't find that category. Go back and pick another one.
        </p>
      </SubScreen>
    );
  }

  if (session) {
    return (
      <CloudAudioSession
        track={{ label: session.title, src: session.src }}
        screenTitle={category.title}
        completionTitle="Session Complete"
        completionMessage="Take a slow breath. You showed up for yourself today."
        onExit={() => setSession(null)}
      />
    );
  }

  return (
    <SubScreen title={category.title} description={category.subtitle}>
      <ul className="space-y-3">
        {category.tracks.map((track) => {
          const Icon = track.icon;
          return (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => {
                  haptic.select();
                  setSession(track);
                }}
                className="press soft-card flex w-full items-center gap-4 rounded-3xl p-5 text-left"
              >
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${category.tint}`}
                >
                  <Icon className="size-5 text-on-tint" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{track.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{track.subtitle}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </SubScreen>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { AppShell } from "@/components/AppShell";
import { SoftCard } from "@/components/SoftCard";
import { useBadges } from "@/hooks/useBadges";
import { analytics } from "@/lib/analytics";
import { BADGE_CATEGORIES, type BadgeProgress } from "@/lib/badges";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/badges")({
  head: () => ({
    meta: [
      { title: "Badges | SOLACE: BREAKUP RECOVERY" },
      {
        name: "description",
        content: "Unlock badges as your no-contact streak grows, from day one to a full year.",
      },
      { property: "og:title", content: "Badges | SOLACE: BREAKUP RECOVERY" },
      { property: "og:description", content: "Milestones that prove how far you've come." },
    ],
  }),
  component: BadgesScreen,
});

function BadgesScreen() {
  const { t } = useTranslation();
  useEffect(() => {
    analytics.screen("badges");
  }, []);

  const { progress, owned, unlockedCount, total } = useBadges({ autoUnlock: true });
  const overallPercent = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  const groups = BADGE_CATEGORIES.map((category) => ({
    category,
    items: progress.filter((item) => item.badge.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <AppShell title={t("badgesScreen.title")} subtitle={t("badgesScreen.unlockedOf", { unlockedCount, total })}>
      <div className="space-y-6">
        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {t("badgesScreen.unlockedOf", { unlockedCount, total })}
            </span>
            <span className="text-sm tabular-nums text-muted-foreground">{overallPercent}%</span>
          </div>
          <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success transition-[width] duration-500 ease-out"
              style={{ width: `${overallPercent}%` }}
              aria-valuenow={overallPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
        </div>

        {groups.map((group) => (
          <section key={group.category} className="space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-sm font-semibold tracking-wide text-foreground/80">
                {group.category}
              </h2>
              <span className="text-xs text-muted-foreground">
                {group.items.filter((item) => item.unlocked || owned.has(item.badge.key)).length}/
                {group.items.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {group.items.map((item) => (
                <BadgeCard
                  key={item.badge.key}
                  item={item}
                  unlocked={item.unlocked || owned.has(item.badge.key)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}

function BadgeCard({ item, unlocked }: { item: BadgeProgress; unlocked: boolean }) {
  const { t } = useTranslation();
  const { badge, current, target, ratio } = item;
  const Icon = badge.icon;
  const showProgress = !unlocked && target > 1;

  return (
    <SoftCard className={cn("h-full", unlocked ? badge.tint : "bg-muted/60")}>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            unlocked ? "bg-white/35" : "bg-background/70",
          )}
        >
          <Icon
            className={cn("size-4.5", unlocked ? "text-on-tint" : "text-muted-foreground")}
            aria-hidden
          />
        </span>
        {unlocked ? null : <Lock className="size-4 text-muted-foreground" aria-hidden />}
      </div>

      <p className={cn("mt-2 font-semibold leading-tight", unlocked && "text-on-tint")}>
        {badge.label}
      </p>
      <p
        className={cn(
          "mt-1 text-xs leading-snug",
          unlocked ? "text-on-tint/75" : "text-muted-foreground",
        )}
      >
        {badge.description}
      </p>

      {showProgress ? (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-foreground/40 transition-[width] duration-500"
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {current} / {target}
            {badge.unit ? ` ${badge.unit}` : badge.days ? ` ${t("badgesScreen.days")}` : ""}
          </p>
        </div>
      ) : null}
    </SoftCard>
  );
}

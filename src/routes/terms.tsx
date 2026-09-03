import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | SOLACE: BREAKUP RECOVERY" },
      { name: "description", content: "The terms that apply when you use SOLACE: BREAKUP RECOVERY." },
      { property: "og:title", content: "Terms of Service | SOLACE: BREAKUP RECOVERY" },
      { property: "og:description", content: "Subscription, trial and acceptable-use terms." },
    ],
  }),
  component: Terms,
});

function Terms() {
  const { t } = useTranslation();
  return (
    <article className="mx-auto w-full max-w-md space-y-4 px-6 py-[calc(env(safe-area-inset-top)+3rem)] text-sm leading-relaxed text-muted-foreground">
      <h1 className="text-2xl font-semibold text-foreground">{t("terms.title", "Terms of Service")}</h1>
      <h2 className="pt-2 text-base font-medium text-foreground">{t("terms.medicalTitle", "Not medical advice")}</h2>
      <p>
        {t(
          "terms.medicalBody",
          "SOLACE: BREAKUP RECOVERY is a self-help tool, not therapy or crisis support. If you are in danger or having thoughts of self-harm, contact local emergency services.",
        )}
      </p>
      <h2 className="pt-2 text-base font-medium text-foreground">{t("terms.accountTitle", "Your account")}</h2>
      <p>{t("terms.accountBody", "You are responsible for keeping your login credentials secure and for the content you store.")}</p>
      <h2 className="pt-2 text-base font-medium text-foreground">{t("terms.subscriptionsTitle", "Subscriptions")}</h2>
      <p>
        {t(
          "terms.subscriptionsBody",
          "Premium starts with a 7-day free trial and renews automatically unless cancelled at least 24 hours before the period ends. Manage or cancel in your Google Play subscriptions.",
        )}
      </p>
      <h2 className="pt-2 text-base font-medium text-foreground">{t("terms.availabilityTitle", "Availability")}</h2>
      <p>
        {t(
          "terms.availabilityBody",
          "The app works offline and syncs when you reconnect. We aim for reliable service but cannot guarantee uninterrupted availability.",
        )}
      </p>
      <Link to="/" className="inline-block pt-4 text-foreground underline">
        {t("terms.backToApp", "Back to the app")}
      </Link>
    </article>
  );
}

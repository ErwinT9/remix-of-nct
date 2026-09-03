import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | SOLACE: BREAKUP RECOVERY" },
      { name: "description", content: "How SOLACE: BREAKUP RECOVERY stores, protects and deletes your personal data." },
      { property: "og:title", content: "Privacy Policy | SOLACE: BREAKUP RECOVERY" },
      { property: "og:description", content: "Your flags, wins and letters are private to your account and encrypted in transit." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  const { t } = useTranslation();
  return (
    <article className="mx-auto w-full max-w-md space-y-4 px-6 py-[calc(env(safe-area-inset-top)+3rem)] text-sm leading-relaxed text-muted-foreground">
      <h1 className="text-2xl font-semibold text-foreground">{t("privacy.title", "Privacy Policy")}</h1>
      <p>
        {t(
          "privacy.intro",
          "This page is maintained by the app owner to answer common privacy questions about SOLACE: BREAKUP RECOVERY. It is not an independent certification.",
        )}
      </p>
      <h2 className="pt-2 text-base font-medium text-foreground">{t("privacy.storeTitle", "What we store")}</h2>
      <p>
        {t(
          "privacy.storeBody",
          "Your email address, streak dates, questionnaire answers, flags, wins, badges and unsent letters. Content is cached on your device and synced to your private account.",
        )}
      </p>
      <h2 className="pt-2 text-base font-medium text-foreground">{t("privacy.accessTitle", "Who can access it")}</h2>
      <p>
        {t(
          "privacy.accessBody",
          "Only you. Database access rules scope every row to your authenticated account, so other users cannot read your data.",
        )}
      </p>
      <h2 className="pt-2 text-base font-medium text-foreground">{t("privacy.deletionTitle", "Deletion")}</h2>
      <p>
        {t(
          "privacy.deletionBody",
          "Signing out clears the cache on your device. To delete your account and all synced data, contact the app owner from the email on your account.",
        )}
      </p>
      <h2 className="pt-2 text-base font-medium text-foreground">{t("privacy.paymentsTitle", "Payments")}</h2>
      <p>
        {t(
          "privacy.paymentsBody",
          "Subscriptions are processed by Google Play through RevenueCat. We never see or store your payment details.",
        )}
      </p>
      <Link to="/" className="inline-block pt-4 text-foreground underline">
        {t("privacy.backToApp", "Back to the app")}
      </Link>
    </article>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useFeatureFlag } from "@/hooks/use-feature-flag";
import type { Locale } from "@/i18n/config";
import { SECTION_GAP } from "@/lib/homepage/rhythm";
import type { SiteSettings } from "@/types/site-settings";

import { ShortInquiryForm } from "./ShortInquiryForm";

type Props = {
  locale: Locale;
  settings: SiteSettings;
};

type Tab = "buyer" | "seller";

/**
 * Homepage contact section — two lead paths (buyer / seller) plus the
 * broker's direct contact details. Never a single generic "contact us" form.
 * Headline switches between solo and team wording based on the `team`
 * feature flag so an agency still reads correctly.
 */
export function ContactSection({ locale, settings }: Props) {
  const { t } = useTranslation();
  const teamEnabled = useFeatureFlag("team");
  const [tab, setTab] = useState<Tab>("seller");

  return (
    <section className={`mx-auto ${SECTION_GAP.normal} max-w-[1400px] px-6 pb-32 lg:px-10`}>
      <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("home.contact")}
          </div>
          <h2 className="text-section-sm mt-6">
            {t(teamEnabled ? "home.contact_headline" : "home.contact_headline_solo")}
          </h2>

          <div className="mt-10 space-y-2 text-base text-foreground">
            {settings.contact_email ? (
              <div>
                <a className="hover:opacity-70" href={`mailto:${settings.contact_email}`}>
                  {settings.contact_email}
                </a>
              </div>
            ) : null}
            {settings.contact_phone ? (
              <div className="tabular-figures">{settings.contact_phone}</div>
            ) : null}
            {settings.address_street ? (
              <div className="pt-4 text-sm text-muted-foreground">
                {settings.address_street}
                <br />
                {settings.address_zip} {settings.address_city}
              </div>
            ) : null}
          </div>
        </div>

        <div className="md:col-span-8">
          <div role="tablist" className="flex gap-10 border-b border-border">
            {/* Selling first, and selected by default: the seller is the visitor
                whose decision this page is trying to win. */}
            <TabButton active={tab === "seller"} onClick={() => setTab("seller")}>
              {t("inquiry.seller.tab")}
            </TabButton>
            <TabButton active={tab === "buyer"} onClick={() => setTab("buyer")}>
              {t("inquiry.buyer.tab")}
            </TabButton>
          </div>

          <div className="mt-12">
            <ShortInquiryForm key={tab} mode={tab} locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative -mb-px pb-4 font-heading text-xl transition-opacity duration-300 md:text-2xl ${
        active
          ? "text-foreground after:absolute after:inset-x-0 after:bottom-[-1px] after:h-px after:bg-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

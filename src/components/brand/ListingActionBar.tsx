import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { formatPrice } from "@/lib/listings/format";
import { moneyLabelKey } from "@/lib/listings/field-labels";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  listing: PublicListing;
  locale: Locale;
  settings: SiteSettings;
  /** Element id of the enquiry form — the bar hides once it is in view. */
  contactId: string;
};

/**
 * Below lg there is no room for an aside, so price and enquiry travel in a bar
 * at the bottom of the screen. It appears once the gallery has been read and
 * gets out of the way when the form it points at is on screen — a button that
 * covers the field you are typing in is worse than no button.
 */
export function ListingActionBar({ listing, locale, settings, contactId }: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(contactId);
    const onScroll = () => {
      const pastGallery = window.scrollY > window.innerHeight * 0.6;
      const formInView = target
        ? target.getBoundingClientRect().top < window.innerHeight * 0.9
        : false;
      setVisible(pastGallery && !formInView);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [contactId]);

  const shape = { property_type: listing.property_type, deal_type: listing.deal_type };
  const price = formatPrice(listing.price, settings.currency, locale, {
    onRequest: listing.price_on_request,
    period: listing.price_period,
    onRequestLabel: t("listings.on_request"),
  });

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {t(moneyLabelKey(shape, "price", "public"))}
          </div>
          <div className="truncate font-heading text-xl tabular-figures">{price}</div>
        </div>
        <a
          href={`#${contactId}`}
          tabIndex={visible ? undefined : -1}
          className="shrink-0 rounded-control bg-primary px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-primary-foreground"
        >
          {t("listings.detail.contact_agent")}
        </a>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  signListingDocument,
  type PublicDocument,
} from "@/lib/listings/queries.functions";

type Props = {
  documents: PublicDocument[];
};

/**
 * Documents released for download. Links are signed on click and expire, so a
 * URL cannot be passed around after the listing changes. A document that
 * requires an enquiry first is named but not linked.
 */
export function ListingDocuments({ documents }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<string | null>(null);
  if (documents.length === 0) return null;

  async function open(id: string) {
    setBusy(id);
    try {
      const url = await signListingDocument({ data: { id } });
      if (url) window.open(url, "_blank", "noopener");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
        {t("listings.detail.sections.documents")}
      </h2>
      <ul className="mt-8 max-w-xl">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="flex items-baseline justify-between gap-6 border-b border-border py-4"
          >
            <span className="text-sm">
              {doc.type ? t(`listings.documentType.${doc.type}`) : doc.filename}
            </span>
            {doc.storage_path ? (
              <button
                type="button"
                onClick={() => open(doc.id)}
                disabled={busy === doc.id}
                className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors duration-300 hover:text-foreground"
              >
                {t(busy === doc.id ? "listings.detail.document_loading" : "listings.detail.document_open")}
              </button>
            ) : (
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("listings.detail.document_on_request")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

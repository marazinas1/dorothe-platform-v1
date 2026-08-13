import { Facebook, Linkedin } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { SiteSettings } from "@/types/site-settings";

type Props = {
  settings: SiteSettings;
  className?: string;
};

/**
 * Client social links rendered as quiet icon buttons.
 * URLs are read from site_settings.social so the component stays generic.
 */
export function SocialLinks({ settings, className }: Props) {
  const { t } = useTranslation();
  const facebook = settings.social?.facebook as string | undefined;
  const linkedin = settings.social?.linkedin as string | undefined;

  if (!facebook && !linkedin) return null;

  return (
    <div className={className}>
      {facebook ? (
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("footer.social.facebook")}
          className="inline-flex text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Facebook size={20} strokeWidth={1.5} />
        </a>
      ) : null}
      {linkedin ? (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("footer.social.linkedin")}
          className="inline-flex text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Linkedin size={20} strokeWidth={1.5} />
        </a>
      ) : null}
    </div>
  );
}

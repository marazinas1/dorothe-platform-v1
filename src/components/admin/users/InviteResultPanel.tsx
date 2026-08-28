import { useTranslation } from "react-i18next";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { InviteResult } from "@/lib/users/types";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-all font-mono text-xs">{value}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          void navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export function InviteResultPanel({ result }: { result: InviteResult }) {
  const { t } = useTranslation();

  const headline = result.emailSent
    ? t("admin.users.invite.emailSent", { email: result.email })
    : result.existed
      ? t("admin.users.invite.existed", { email: result.email })
      : t("admin.users.invite.manual", { email: result.email });

  return (
    <div className="space-y-3 rounded-[var(--radius)] border border-border bg-muted/40 p-4">
      <p className="text-sm font-medium">{headline}</p>
      {result.tempPassword ? (
        <CopyRow
          label={t("admin.users.invite.tempPassword")}
          value={result.tempPassword}
        />
      ) : null}
      {result.resetLink ? (
        <CopyRow label={t("admin.users.invite.resetLink")} value={result.resetLink} />
      ) : null}
      {!result.emailSent ? (
        <p className="text-xs text-muted-foreground">
          {t("admin.users.invite.handoverHint")}
        </p>
      ) : null}
    </div>
  );
}

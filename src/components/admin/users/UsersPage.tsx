import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type { Role } from "@/lib/auth/permissions";
import type { InviteResult } from "@/lib/users/types";
import {
  errorMessage,
  usersQueryOptions,
  useUserMutations,
} from "@/lib/users/use-manage-users";
import { InviteResultPanel } from "./InviteResultPanel";
import { InviteUserForm } from "./InviteUserForm";
import { UserRow } from "./UserRow";

export function UsersPage() {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(usersQueryOptions);
  const [result, setResult] = useState<InviteResult | null>(null);
  const m = useUserMutations(setResult);

  const fail = (err: unknown) => toast.error(errorMessage(err));
  const busy =
    m.setRole.isPending ||
    m.revoke.isPending ||
    m.restore.isPending ||
    m.remove.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.users.title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("admin.users.subtitle")}</p>
      </header>

      <section className="rounded-[var(--radius)] border border-border bg-card p-5 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("admin.users.invite.title")}
        </h2>
        <div className="mt-4 space-y-4">
          <InviteUserForm
            callerRole={data.callerRole}
            pending={m.invite.isPending}
            onInvite={(input) =>
              m.invite.mutate(input, {
                onError: fail,
                onSuccess: () => toast.success(t("admin.users.invite.done")),
              })
            }
          />
          {result ? <InviteResultPanel result={result} /> : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
        <header className="border-b border-border px-4 py-4 sm:px-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("admin.users.list.title")}
          </h2>
        </header>
        <ul className="divide-y divide-border">
          {data.users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              callerRole={data.callerRole}
              busy={busy}
              onSetRole={(role: Role) =>
                m.setRole.mutate(
                  { userId: user.id, role },
                  { onError: fail, onSuccess: () => toast.success(t("admin.users.saved")) },
                )
              }
              onRevoke={() =>
                m.revoke.mutate(user.id, {
                  onError: fail,
                  onSuccess: () => toast.success(t("admin.users.saved")),
                })
              }
              onRestore={() =>
                m.restore.mutate(user.id, {
                  onError: fail,
                  onSuccess: () => toast.success(t("admin.users.saved")),
                })
              }
              onDelete={() =>
                m.remove.mutate(user.id, {
                  onError: fail,
                  onSuccess: () => toast.success(t("admin.users.deleted")),
                })
              }
            />
          ))}
          {data.users.length === 0 ? (
            <li className="px-6 py-10 text-center text-sm text-muted-foreground">
              {t("admin.users.list.empty")}
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("admin.users.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.users.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.users.invite.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.users.list.title")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
        </CardContent>
      </Card>
    </div>
  );
}

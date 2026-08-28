import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/lib/auth/permissions";
import type { AdminUser } from "@/lib/users/types";

interface Props {
  user: AdminUser;
  callerRole: Role;
  busy: boolean;
  onSetRole: (role: Role) => void;
  onRevoke: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export function UserRow({
  user,
  callerRole,
  busy,
  onSetRole,
  onRevoke,
  onRestore,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState("");
  const [confirming, setConfirming] = useState(false);

  const roles: Role[] =
    callerRole === "developer" ? ["developer", "owner", "editor"] : ["owner", "editor"];
  const locked = !user.can_manage || busy;
  const reason = user.is_self
    ? t("admin.users.locked.self")
    : !user.can_manage
      ? t("admin.users.locked.developer")
      : undefined;

  return (
    <div className="flex flex-col gap-3 border-b border-border py-4 last:border-b-0 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{user.full_name ?? user.email}</p>
          {user.is_self ? (
            <Badge variant="secondary">{t("admin.users.badges.you")}</Badge>
          ) : null}
          {user.role === "developer" ? (
            <Badge variant="outline">{t("admin.users.roles.developer")}</Badge>
          ) : null}
          {user.is_last_owner ? (
            <Badge variant="outline">{t("admin.users.badges.lastOwner")}</Badge>
          ) : null}
          {!user.is_active ? (
            <Badge variant="destructive">{t("admin.users.badges.revoked")}</Badge>
          ) : null}
        </div>
        {user.full_name ? (
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {user.last_sign_in_at
            ? t("admin.users.lastSignIn", {
                date: new Date(user.last_sign_in_at).toLocaleDateString(),
              })
            : t("admin.users.neverSignedIn")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2" title={reason}>
        <Select
          value={user.role}
          disabled={locked}
          onValueChange={(value) => onSetRole(value as Role)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`admin.users.roles.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {user.is_active ? (
          <Button variant="outline" size="sm" disabled={locked} onClick={onRevoke}>
            {t("admin.users.actions.revoke")}
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled={locked} onClick={onRestore}>
            {t("admin.users.actions.restore")}
          </Button>
        )}

        {confirming ? (
          <div className="flex items-center gap-2">
            <Input
              value={confirm}
              className="w-32"
              placeholder={t("admin.users.actions.confirmWord")}
              onChange={(event) => setConfirm(event.target.value)}
            />
            <Button
              variant="destructive"
              size="sm"
              disabled={locked || confirm.trim().toUpperCase() !== "DELETE"}
              onClick={() => {
                onDelete();
                setConfirming(false);
                setConfirm("");
              }}
            >
              {t("admin.users.actions.confirmDelete")}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={locked}
            onClick={() => setConfirming(true)}
          >
            {t("admin.users.actions.delete")}
          </Button>
        )}
      </div>
    </div>
  );
}

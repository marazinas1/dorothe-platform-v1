import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/lib/auth/permissions";

interface Props {
  callerRole: Role;
  pending: boolean;
  onInvite: (input: { email: string; role: Role }) => void;
}

export function InviteUserForm({ callerRole, pending, onInvite }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");

  const roles: Role[] =
    callerRole === "developer" ? ["developer", "owner", "editor"] : ["owner", "editor"];

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        if (!email.trim()) return;
        onInvite({ email: email.trim(), role });
      }}
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="invite-email">{t("admin.users.form.email")}</Label>
        <Input
          id="invite-email"
          type="email"
          required
          autoComplete="off"
          value={email}
          placeholder={t("admin.users.form.emailPlaceholder")}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-1.5 sm:w-48">
        <Label htmlFor="invite-role">{t("admin.users.form.role")}</Label>
        <Select value={role} onValueChange={(value) => setRole(value as Role)}>
          <SelectTrigger id="invite-role">
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
      </div>
      <Button type="submit" disabled={pending} className="sm:w-auto">
        {pending ? t("admin.users.form.inviting") : t("admin.users.form.submit")}
      </Button>
    </form>
  );
}

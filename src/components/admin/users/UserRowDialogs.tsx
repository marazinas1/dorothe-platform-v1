import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface Props {
  email: string;
  open: "revoke" | "delete" | null;
  onClose: () => void;
  onRevoke: () => void;
  onDelete: () => void;
}

/** Confirmation dialogs for the two irreversible-feeling row actions. */
export function UserRowDialogs({ email, open, onClose, onRevoke, onDelete }: Props) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState("");

  return (
    <>
      <AlertDialog open={open === "revoke"} onOpenChange={(o) => !o && onClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.users.confirm.revokeTitle", { email })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.users.confirm.revokeBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.users.confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={onRevoke}>
              {t("admin.users.actions.revoke")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={open === "delete"}
        onOpenChange={(o) => {
          if (!o) {
            setTyped("");
            onClose();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.users.confirm.deleteTitle", { email })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.users.confirm.deleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={typed}
            placeholder="DELETE"
            onChange={(event) => setTyped(event.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.users.confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={typed.trim().toUpperCase() !== "DELETE"}
              onClick={() => {
                setTyped("");
                onDelete();
              }}
            >
              {t("admin.users.confirm.deleteAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { useTranslation } from "react-i18next";
import type { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fontsForRole, type FontRole } from "@/lib/theme/fonts";
import { RADIUS_SCALES, BUTTON_STYLES } from "@/lib/theme/tokens";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BrandingForm = ReturnType<typeof useForm<any>>;

function FieldShell({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function errorFor(form: BrandingForm, name: string) {
  const message = form.formState.errors[name]?.message;
  return message ? String(message) : undefined;
}

export function TextField({
  form,
  name,
  label,
}: {
  form: BrandingForm;
  name: string;
  label: string;
}) {
  return (
    <FieldShell label={label} error={errorFor(form, name)}>
      <Input {...form.register(name)} />
    </FieldShell>
  );
}

export function ColorField({
  form,
  name,
  label,
}: {
  form: BrandingForm;
  name: string;
  label: string;
}) {
  const value = (form.watch(name) as string) ?? "";
  return (
    <FieldShell label={label} error={errorFor(form, name)}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#([0-9a-f]{6})$/i.test(value) ? value : "#000000"}
          onChange={(e) => form.setValue(name, e.target.value, { shouldDirty: true })}
          className="h-9 w-12 cursor-pointer rounded border border-border bg-background"
          aria-label={label}
        />
        <Input {...form.register(name)} placeholder="#000000" />
      </div>
    </FieldShell>
  );
}

export function FontField({
  form,
  name,
  role,
  label,
}: {
  form: BrandingForm;
  name: string;
  role: FontRole;
  label: string;
}) {
  const value = (form.watch(name) as string) ?? "";
  return (
    <FieldShell label={label} error={errorFor(form, name)}>
      <Select value={value} onValueChange={(v) => form.setValue(name, v, { shouldDirty: true })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fontsForRole(role).map((f) => (
            <SelectItem key={f.key} value={f.key} style={{ fontFamily: f.stack }}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

/** Radius scale / button style pickers — registry keys only, never raw CSS. */
export function TokenChoiceField({
  form,
  name,
  label,
  kind,
}: {
  form: BrandingForm;
  name: string;
  label: string;
  kind: "radius" | "button";
}) {
  const { t } = useTranslation();
  const value = (form.watch(name) as string) ?? "";
  const keys = Object.keys(kind === "radius" ? RADIUS_SCALES : BUTTON_STYLES);
  return (
    <FieldShell label={label} error={errorFor(form, name)}>
      <Select value={value} onValueChange={(v) => form.setValue(name, v, { shouldDirty: true })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {keys.map((key) => (
            <SelectItem key={key} value={key}>
              {t(`admin.settings.branding.${kind}Option.${key}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

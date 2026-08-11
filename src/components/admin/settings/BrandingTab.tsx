import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { fontKeyForValue, resolveFontStack } from "@/lib/theme/fonts";
import { radiusScaleKey, buttonStyleKey } from "@/lib/theme/tokens";
import {
  siteSettingsQueryOptions,
  updateSiteSettings,
} from "@/lib/config/site-settings.functions";
import { BrandingSchema } from "@/lib/validation/site-settings";

import { SaveButton } from "./SaveButton";
import { BrandingPreview } from "./BrandingPreview";
import { ColorField, FontField, TextField, TokenChoiceField } from "./BrandingFields";

type Values = Record<string, string>;

/**
 * One design system: these tokens drive the public site AND the admin panel.
 * Changing the primary colour here re-tints both.
 */
export function BrandingTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(siteSettingsQueryOptions);

  const defaults: Values = {
    logo_url: data.logo_url ?? "",
    logo_dark_url: data.logo_dark_url ?? "",
    favicon_url: data.favicon_url ?? "",
    og_default_image: data.og_default_image ?? "",
    primary_color: data.primary_color ?? "",
    secondary_color: data.secondary_color ?? "",
    accent_color: data.accent_color ?? "",
    background_color: data.background_color ?? "",
    surface_color: data.surface_color ?? "",
    text_color: data.text_color ?? "",
    muted_text_color: data.muted_text_color ?? "",
    border_color: data.border_color ?? "",
    radius_scale: radiusScaleKey(data.radius_scale),
    button_style: buttonStyleKey(data.button_style),
    font_heading: fontKeyForValue(data.font_heading),
    font_body: fontKeyForValue(data.font_body),
  };

  const form = useForm<Values>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(BrandingSchema) as any,
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function save() {
    const ok = await form.trigger();
    if (!ok) throw new Error("validation");
    await updateSiteSettings({ data: { tab: "branding", values: form.getValues() } });
    await qc.invalidateQueries({ queryKey: siteSettingsQueryOptions.queryKey });
  }

  const w = form.watch();
  const label = (key: string) => t(`admin.settings.branding.${key}`);

  return (
    <form className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <TextField form={form} name="logo_url" label={label("logo_url")} />
        <TextField form={form} name="logo_dark_url" label={label("logo_dark_url")} />
        <TextField form={form} name="favicon_url" label={label("favicon_url")} />
        <TextField form={form} name="og_default_image" label={label("og_default_image")} />
        <ColorField form={form} name="primary_color" label={label("primary_color")} />
        <ColorField form={form} name="secondary_color" label={label("secondary_color")} />
        <ColorField form={form} name="accent_color" label={label("accent_color")} />
        <ColorField form={form} name="background_color" label={label("background_color")} />
        <ColorField form={form} name="surface_color" label={label("surface_color")} />
        <ColorField form={form} name="text_color" label={label("text_color")} />
        <ColorField form={form} name="muted_text_color" label={label("muted_text_color")} />
        <ColorField form={form} name="border_color" label={label("border_color")} />
        <TokenChoiceField
          form={form}
          name="radius_scale"
          kind="radius"
          label={label("radius_scale")}
        />
        <TokenChoiceField
          form={form}
          name="button_style"
          kind="button"
          label={label("button_style")}
        />
        <FontField form={form} name="font_heading" role="heading" label={label("font_heading")} />
        <FontField form={form} name="font_body" role="body" label={label("font_body")} />
        <SaveButton onSubmit={save} />
      </div>
      <div>
        <BrandingPreview
          primary={w.primary_color}
          secondary={w.secondary_color}
          accent={w.accent_color}
          fontHeading={resolveFontStack(w.font_heading) ?? ""}
          fontBody={resolveFontStack(w.font_body) ?? ""}
        />
      </div>
    </form>
  );
}

import { lazy, Suspense, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Loader2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { geocodeAddress } from "@/lib/geo/geocode.functions";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow } from "./FieldRow";

const PinMapCanvas = lazy(() => import("./PinMapCanvas"));

type Status = "idle" | "searching" | "found" | "manual" | "notFound" | "limited" | "failed";

function Skeleton() {
  return <div className="aspect-[16/9] w-full bg-muted" />;
}

/**
 * Address -> pin. The lookup is a convenience: every failure mode (not found,
 * geocoder busy, offline) leaves the same manual fallback in place, so the
 * broker can always finish the job by dragging the pin.
 */
export function AddressMapPicker({ form }: { form: ListingFormApi }) {
  const { t } = useTranslation();
  const { values } = form;
  const [status, setStatus] = useState<Status>("idle");
  const [manual, setManual] = useState(false);

  const lat = values.geo_lat == null ? null : Number(values.geo_lat);
  const lng = values.geo_lng == null ? null : Number(values.geo_lng);

  function setPoint(nextLat: number, nextLng: number) {
    form.setField("geo_lat", nextLat);
    form.setField("geo_lng", nextLng);
  }

  async function lookup() {
    setStatus("searching");
    try {
      const result = await geocodeAddress({
        data: {
          street: values.address_street ?? null,
          number: values.address_number ?? null,
          zip: values.address_zip ?? null,
          city: values.address_city ?? null,
          region: values.address_region ?? null,
          country: values.address_country ?? null,
        },
      });
      if (result.ok) {
        setPoint(Number(result.lat.toFixed(6)), Number(result.lng.toFixed(6)));
        setStatus("found");
        return;
      }
      setStatus(
        result.reason === "not_found"
          ? "notFound"
          : result.reason === "rate_limited"
            ? "limited"
            : result.reason === "no_address"
              ? "idle"
              : "failed",
      );
      if (result.reason === "no_address") setStatus("idle");
    } catch {
      setStatus("failed");
    }
  }

  const message =
    status === "searching"
      ? t("admin.listings.geocode.searching")
      : status === "found"
        ? t("admin.listings.geocode.found")
        : status === "notFound"
          ? t("admin.listings.geocode.notFound")
          : status === "limited"
            ? t("admin.listings.geocode.limited")
            : status === "failed"
              ? t("admin.listings.geocode.failed")
              : lat != null && lng != null
                ? t("admin.listings.geocode.dragHint")
                : t("admin.listings.geocode.noAddress");

  return (
    <div className="rounded-md border border-border">
      <div className="flex flex-wrap items-center gap-3 px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("admin.listings.geocode.title")}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={status === "searching"}
          onClick={() => void lookup()}
        >
          {status === "searching" ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <MapPin className="mr-2 h-3.5 w-3.5" />
          )}
          {status === "notFound" || status === "limited" || status === "failed"
            ? t("admin.listings.geocode.retry")
            : t("admin.listings.geocode.lookup")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => setManual((prev) => !prev)}
        >
          {manual
            ? t("admin.listings.geocode.useAutomatic")
            : t("admin.listings.geocode.editManually")}
        </Button>
      </div>

      <p className="px-3 pb-2 text-xs text-muted-foreground">{message}</p>

      {manual ? (
        <div className="grid gap-4 border-t border-border px-3 py-3 sm:grid-cols-2">
          <FieldRow label={t("admin.listings.fields.geo_lat")}>
            <Input
              type="number"
              step="0.000001"
              value={values.geo_lat ?? ""}
              onChange={(e) =>
                form.setField("geo_lat", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </FieldRow>
          <FieldRow label={t("admin.listings.fields.geo_lng")}>
            <Input
              type="number"
              step="0.000001"
              value={values.geo_lng ?? ""}
              onChange={(e) =>
                form.setField("geo_lng", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </FieldRow>
        </div>
      ) : null}

      {lat != null && lng != null ? (
        <div className="overflow-hidden border-t border-border">
          <ClientOnly fallback={<Skeleton />}>
            <Suspense fallback={<Skeleton />}>
              <PinMapCanvas
                lat={lat}
                lng={lng}
                onMove={(nextLat, nextLng) => {
                  setPoint(nextLat, nextLng);
                  setStatus("manual");
                }}
              />
            </Suspense>
          </ClientOnly>
        </div>
      ) : null}
    </div>
  );
}

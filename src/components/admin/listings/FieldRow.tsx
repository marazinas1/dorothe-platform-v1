import { Label } from "@/components/ui/label";

import { fieldAnchorId } from "@/lib/listings/scroll-to-field";

/**
 * Shared labelled field row used by every admin listing form section.
 * `anchor` gives the row a stable id so the publish checklist can scroll to the
 * exact field that is still missing and focus its control.
 */
export function FieldRow({
  label,
  help,
  error,
  children,
  className = "",
  anchor,
}: {
  label: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  anchor?: string;
}) {
  return (
    <div
      id={anchor ? fieldAnchorId(anchor) : undefined}
      className={`space-y-1.5 scroll-mt-28 ${className}`}
    >
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

/** Section container: hairline border, no shadow, Fraunces heading. */
export function FormSection({
  title,
  description,
  children,
  anchor,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  anchor?: string;
}) {
  return (
    <section
      id={anchor ? fieldAnchorId(anchor) : undefined}
      className="scroll-mt-28 rounded-lg border border-border bg-card p-4 sm:p-6"
    >
      <h2 className="font-heading text-lg">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

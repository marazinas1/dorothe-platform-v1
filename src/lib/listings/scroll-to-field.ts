// Checklist -> field navigation. A checklist item names a field anchor; this
// resolves it, opens any collapsed section on the way, scrolls it into view and
// focuses the first control inside it.

/** Anchor ids are stable and shared by the checklist and the form fields. */
export function fieldAnchorId(anchor: string): string {
  return `field-${anchor}`;
}

function openCollapsedAncestors(element: HTMLElement): void {
  let node: HTMLElement | null = element;
  while (node) {
    const details = node.closest("details");
    if (!details) break;
    if (!details.open) details.open = true;
    node = details.parentElement;
  }
}

export function scrollToField(anchor: string): void {
  if (typeof document === "undefined") return;
  const element = document.getElementById(fieldAnchorId(anchor));
  if (!element) return;

  openCollapsedAncestors(element);

  // Opening a <details> reflows, so scroll on the next frame.
  requestAnimationFrame(() => {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = element.querySelector<HTMLElement>(
      "input, textarea, select, button, [tabindex]:not([tabindex='-1'])",
    );
    focusable?.focus({ preventScroll: true });
  });
}

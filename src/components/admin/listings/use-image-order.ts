import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { reorderListingImages } from "@/lib/listings/admin.functions";
import type { ImageRecord } from "./ImageCard";

/**
 * Photo order lives locally while the user is arranging, and is persisted with a
 * debounce. Two rules make it feel solid:
 *  - order is authoritative locally while dirty, so a refresh arriving mid-save
 *    never snaps the tiles back to the server order;
 *  - the image objects themselves always come from the server list (looked up by
 *    id), so variants finishing upload still show through.
 */
export function useImageOrder({
  listingId,
  images,
  refresh,
  onError,
}: {
  listingId: string | null;
  images: ImageRecord[];
  refresh: () => void;
  onError: (message: string) => void;
}) {
  const [order, setOrder] = useState<string[] | null>(null);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving] = useState(false);

  // Server order is adopted only when we are not holding a local arrangement.
  useEffect(() => {
    if (dirtyRef.current) return;
    setOrder(null);
  }, [images]);

  const ordered = useMemo(() => {
    const byId = new Map(images.map((image) => [image.id, image]));
    if (!order) return images;
    const held = order
      .map((id) => byId.get(id))
      .filter((image): image is ImageRecord => Boolean(image));
    const heldIds = new Set(held.map((image) => image.id));
    // Photos uploaded while an order is held simply append.
    return [...held, ...images.filter((image) => !heldIds.has(image.id))];
  }, [images, order]);

  const persist = useCallback(
    async (ids: string[]) => {
      if (!listingId) return;
      setSaving(true);
      try {
        await reorderListingImages({ data: { listingId, order: ids } });
        dirtyRef.current = false;
        setOrder(null);
        refresh();
      } catch (error) {
        onError(error instanceof Error ? error.message : String(error));
      } finally {
        setSaving(false);
      }
    },
    [listingId, refresh, onError],
  );

  const schedule = useCallback(
    (ids: string[]) => {
      dirtyRef.current = true;
      setOrder(ids);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void persist(ids);
      }, 700);
    },
    [persist],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  /** Move the photo at `index` to `target`, keeping every other photo's order. */
  const moveTo = useCallback(
    (index: number, target: number) => {
      const ids = ordered.map((image) => image.id);
      if (target < 0 || target >= ids.length || target === index) return;
      const [moved] = ids.splice(index, 1);
      ids.splice(target, 0, moved);
      schedule(ids);
    },
    [ordered, schedule],
  );

  const move = useCallback(
    (index: number, direction: -1 | 1) => moveTo(index, index + direction),
    [moveTo],
  );

  /** Cover image = first in the gallery; same local-then-persist path as moves. */
  const makeCover = useCallback(
    (image: ImageRecord) => {
      const index = ordered.findIndex((candidate) => candidate.id === image.id);
      if (index > 0) moveTo(index, 0);
    },
    [ordered, moveTo],
  );

  return { ordered, move, moveTo, makeCover, savingOrder: saving };
}

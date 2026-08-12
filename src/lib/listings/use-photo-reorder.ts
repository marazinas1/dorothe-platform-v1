import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pointer-based reordering for the photo grid.
 *
 * Native HTML5 drag and drop is not used: it does not fire on touch devices at
 * all, so a broker on an iPad could never rearrange photos, and it gives no
 * control over the drop indicator. Pointer events cover mouse, pen and touch
 * with one code path.
 *
 * Gesture: mouse and pen start a reorder after a few pixels of movement; touch
 * starts after a short press, so a vertical swipe still scrolls the page. While
 * a reorder is active, touch scrolling is suppressed.
 *
 * The hook only reports "move photo at `from` to position `to`" once, on
 * release — the local-order-plus-debounced-persist path is untouched.
 */
const MOVE_THRESHOLD = 6;
const TOUCH_HOLD_MS = 260;

type Session = {
  from: number;
  over: number;
  pointerId: number;
  touch: boolean;
  started: boolean;
  x: number;
  y: number;
};

export function usePhotoReorder({
  onDrop,
  attribute = "data-photo-index",
}: {
  onDrop: (from: number, to: number) => void;
  attribute?: string;
}) {
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null);
  const session = useRef<Session | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const begin = useCallback(() => {
    const s = session.current;
    if (!s || s.started) return;
    s.started = true;
    setDrag({ from: s.from, over: s.over });
  }, []);

  const finish = useCallback(
    (commit: boolean) => {
      clearTimer();
      const s = session.current;
      session.current = null;
      setDrag(null);
      if (!s || !s.started) return;
      if (commit && s.over !== s.from) onDrop(s.from, s.over);
    },
    [onDrop],
  );

  useEffect(() => {
    function indexAt(x: number, y: number): number | null {
      const el = document.elementFromPoint(x, y);
      const tile = el?.closest(`[${attribute}]`) as HTMLElement | null;
      if (!tile) return null;
      const value = Number(tile.getAttribute(attribute));
      return Number.isNaN(value) ? null : value;
    }

    function onMove(event: PointerEvent) {
      const s = session.current;
      if (!s || event.pointerId !== s.pointerId) return;
      const dx = event.clientX - s.x;
      const dy = event.clientY - s.y;
      const distance = Math.hypot(dx, dy);
      if (!s.started) {
        // A touch that moves before the hold elapsed is a scroll, not a grab.
        if (s.touch) {
          if (distance > 10) finish(false);
          return;
        }
        if (distance > MOVE_THRESHOLD) begin();
        else return;
      }
      const over = indexAt(event.clientX, event.clientY);
      if (over === null || over === s.over) return;
      s.over = over;
      setDrag({ from: s.from, over });
    }

    function onUp(event: PointerEvent) {
      if (session.current && event.pointerId !== session.current.pointerId) return;
      finish(true);
    }

    function onCancel() {
      finish(false);
    }

    // Suppress page scrolling only while a reorder is actually in progress.
    function onTouchMove(event: TouchEvent) {
      if (session.current?.started) event.preventDefault();
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("touchmove", onTouchMove);
      clearTimer();
    };
  }, [attribute, begin, finish]);

  /** Attach to each tile; ignores clicks that start on a button. */
  const start = useCallback(
    (index: number, event: React.PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if ((event.target as HTMLElement).closest("button")) return;
      clearTimer();
      const touch = event.pointerType === "touch";
      session.current = {
        from: index,
        over: index,
        pointerId: event.pointerId,
        touch,
        started: false,
        x: event.clientX,
        y: event.clientY,
      };
      if (touch) timer.current = setTimeout(begin, TOUCH_HOLD_MS);
    },
    [begin],
  );

  return {
    /** Index being dragged, or null. */
    fromIndex: drag?.from ?? null,
    /** Index the photo would land on, or null. */
    overIndex: drag?.over ?? null,
    dragging: drag !== null,
    start,
  };
}

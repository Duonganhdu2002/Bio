"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

const DRAG_THRESHOLD_PX = 6;

type PointerDragState = {
  id: string;
  startX: number;
  startY: number;
  active: boolean;
  pointerId: number;
};

/**
 * Kéo-thả sắp xếp danh sách dọc bằng Pointer Events (hỗ trợ cả chuột lẫn cảm ứng,
 * không thêm dependency). Chỉ kéo từ handle — tránh xung đột chọn văn bản trên mobile.
 * `onCommit` nhận mảng id theo thứ tự mới.
 */
export function useSortableList<T extends { id: string }>({
  items,
  onCommit,
}: {
  items: T[];
  onCommit: (orderedIds: string[]) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const itemsRef = useRef(items);
  const onCommitRef = useRef(onCommit);
  const pointerRef = useRef<PointerDragState | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const overIdRef = useRef<string | null>(null);

  itemsRef.current = items;
  onCommitRef.current = onCommit;

  useEffect(() => {
    draggingIdRef.current = draggingId;
  }, [draggingId]);

  useEffect(() => {
    overIdRef.current = overId;
  }, [overId]);

  const commitReorder = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    const current = itemsRef.current;
    const from = current.findIndex((i) => i.id === fromId);
    const to = current.findIndex((i) => i.id === toId);
    if (from === -1 || to === -1 || from === to) return;
    const next = moveItem(current, from, to);
    onCommitRef.current(next.map((i) => i.id));
  }, []);

  const findItemIdFromPoint = useCallback((x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const row = el.closest("[data-sortable-id]");
    return row?.getAttribute("data-sortable-id") ?? null;
  }, []);

  const resetDrag = useCallback(() => {
    pointerRef.current = null;
    setDraggingId(null);
    setOverId(null);
  }, []);

  const finishPointerDrag = useCallback(() => {
    const dragId = draggingIdRef.current;
    const targetId = overIdRef.current;
    if (dragId && targetId && dragId !== targetId) {
      commitReorder(dragId, targetId);
    }
    resetDrag();
  }, [commitReorder, resetDrag]);

  useEffect(() => {
    if (!draggingId) return;

    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const onWindowPointerMove = (e: globalThis.PointerEvent) => {
      const state = pointerRef.current;
      if (!state?.active) return;
      e.preventDefault();
      const over = findItemIdFromPoint(e.clientX, e.clientY);
      if (over) setOverId(over);
    };

    const onWindowPointerEnd = () => finishPointerDrag();

    window.addEventListener("pointermove", onWindowPointerMove, { passive: false });
    window.addEventListener("pointerup", onWindowPointerEnd);
    window.addEventListener("pointercancel", onWindowPointerEnd);

    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerEnd);
      window.removeEventListener("pointercancel", onWindowPointerEnd);
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [draggingId, finishPointerDrag, findItemIdFromPoint]);

  function getHandleProps(id: string) {
    return {
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
        if (e.button !== 0) return;
        pointerRef.current = {
          id,
          startX: e.clientX,
          startY: e.clientY,
          active: false,
          pointerId: e.pointerId,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
        const state = pointerRef.current;
        if (!state || state.id !== id) return;

        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;

        if (!state.active) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
          state.active = true;
          setDraggingId(id);
          setOverId(id);
        }

        e.preventDefault();
        const over = findItemIdFromPoint(e.clientX, e.clientY);
        if (over) setOverId(over);
      },
      onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
        const state = pointerRef.current;
        if (!state || state.id !== id) return;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* pointer may already be released */
        }
        finishPointerDrag();
      },
      onPointerCancel: () => resetDrag(),
      onContextMenu: (e: ReactMouseEvent<HTMLElement>) => e.preventDefault(),
      className:
        "touch-none shrink-0 cursor-grab select-none p-1 text-muted-foreground active:cursor-grabbing",
      "aria-label": "Kéo để sắp xếp",
      role: "button" as const,
      tabIndex: 0,
    };
  }

  function getItemProps(id: string) {
    return {
      "data-sortable-id": id,
      "data-dragging": draggingId === id ? "true" : undefined,
      "data-drag-over":
        overId === id && draggingId !== null && draggingId !== id ? "true" : undefined,
    };
  }

  return { getItemProps, getHandleProps, draggingId, overId };
}

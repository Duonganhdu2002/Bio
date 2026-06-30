"use client";

import { useState, type DragEvent } from "react";

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Kéo-thả sắp xếp danh sách dọc bằng HTML5 Drag & Drop gốc (không thêm dependency,
 * giữ bundle dashboard nhẹ). `onCommit` nhận mảng id theo thứ tự mới.
 */
export function useSortableList<T extends { id: string }>({
  items,
  onCommit,
}: {
  items: T[];
  onCommit: (orderedIds: string[]) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function getItemProps(id: string) {
    return {
      draggable: true,
      onDragStart: (e: DragEvent) => {
        setDraggingId(id);
        e.dataTransfer.effectAllowed = "move";
      },
      onDragOver: (e: DragEvent) => {
        if (!draggingId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        if (!draggingId || draggingId === id) {
          setDraggingId(null);
          return;
        }
        const from = items.findIndex((i) => i.id === draggingId);
        const to = items.findIndex((i) => i.id === id);
        setDraggingId(null);
        if (from === -1 || to === -1 || from === to) return;
        const next = moveItem(items, from, to);
        onCommit(next.map((i) => i.id));
      },
      onDragEnd: () => setDraggingId(null),
      "data-dragging": draggingId === id ? "true" : undefined,
    };
  }

  return { getItemProps, draggingId };
}

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useSortableList } from "@/hooks/use-sortable-list";
import { queryKeys } from "@/lib/query-keys";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Link as LinkRow } from "@/lib/types";
import {
  createLink,
  deleteLink,
  reorderLinks,
  toggleLinkActive,
  updateLink,
  type LinkInput,
} from "../actions";
import { LinkFormDialog } from "./link-form-dialog";
import { getPlatformLabel } from "@/lib/links/platforms";

async function fetchLinks(profileId: string): Promise<LinkRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("profile_id", profileId)
    .order("position")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as LinkRow[];
}

function platformLabel(platform: string | null): string | null {
  if (!platform) return null;
  return getPlatformLabel(platform);
}

export function LinksManager({
  initialLinks,
  profileId,
}: {
  initialLinks: LinkRow[];
  profileId: string;
}) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LinkRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LinkRow | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const { data: links = initialLinks } = useQuery({
    queryKey: queryKeys.links,
    queryFn: () => fetchLinks(profileId),
    initialData: initialLinks,
  });

  function setLinks(updater: (prev: LinkRow[]) => LinkRow[]) {
    qc.setQueryData<LinkRow[]>(queryKeys.links, (prev) =>
      updater(prev ?? []),
    );
  }

  const createMut = useMutation({
    mutationFn: async (input: LinkInput) => {
      const res = await createLink(input);
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
    onSuccess: (link) => {
      setLinks((prev) => [...prev, link]);
      setDialogOpen(false);
      setFormError(null);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: LinkInput }) => {
      const res = await updateLink(id, input);
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
    onSuccess: (link) => {
      setLinks((prev) => prev.map((l) => (l.id === link.id ? link : l)));
      setDialogOpen(false);
      setFormError(null);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await toggleLinkActive(id, isActive);
      if (!res.ok) throw new Error(res.message);
    },
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: queryKeys.links });
      const prev = qc.getQueryData<LinkRow[]>(queryKeys.links);
      setLinks((p) => p.map((l) => (l.id === id ? { ...l, is_active: isActive } : l)));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.links, ctx.prev);
      setListError(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.links }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteLink(id);
      if (!res.ok) throw new Error(res.message);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.links });
      const prev = qc.getQueryData<LinkRow[]>(queryKeys.links);
      setLinks((p) => p.filter((l) => l.id !== id));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.links, ctx.prev);
      setListError(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.links }),
  });

  const reorderMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await reorderLinks(ids);
      if (!res.ok) throw new Error(res.message);
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: queryKeys.links });
      const prev = qc.getQueryData<LinkRow[]>(queryKeys.links);
      const byId = new Map((prev ?? []).map((l) => [l.id, l]));
      const next = ids
        .map((id, i) => {
          const l = byId.get(id);
          return l ? { ...l, position: i } : null;
        })
        .filter((l): l is LinkRow => l !== null);
      qc.setQueryData(queryKeys.links, next);
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.links, ctx.prev);
      setListError(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.links }),
  });

  const { getItemProps, draggingId } = useSortableList({
    items: links,
    onCommit: (ids) => reorderMut.mutate(ids),
  });

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(link: LinkRow) {
    setEditing(link);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSubmit(input: LinkInput) {
    if (editing) {
      updateMut.mutate({ id: editing.id, input });
    } else {
      createMut.mutate(input);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus />
          Thêm link
        </Button>
      </div>

      {listError ? (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      ) : null}

      {links.length === 0 ? (
        <Card className="items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Chưa có link nào. Thêm link đầu tiên để hiển thị trên trang bio.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {links.map((link) => {
            const label = platformLabel(link.platform);
            return (
              <li key={link.id} {...getItemProps(link.id)}>
                <Card
                  size="sm"
                  className={cn(
                    "flex-row items-center gap-2 px-3 py-2.5 transition-opacity",
                    draggingId === link.id && "opacity-50",
                    !link.is_active && "opacity-70",
                  )}
                >
                  <span className="cursor-grab text-muted-foreground active:cursor-grabbing">
                    <GripVertical className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{link.title}</p>
                      {label ? (
                        <Badge variant="neutral" className="shrink-0">
                          {label}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {link.url}
                    </p>
                  </div>
                  <Switch
                    checked={link.is_active}
                    onCheckedChange={(v) =>
                      toggleMut.mutate({ id: link.id, isActive: v })
                    }
                    aria-label="Hiển thị công khai"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(link)}
                    aria-label="Sửa"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(link)}
                    aria-label="Xoá"
                  >
                    <Trash2 />
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <LinkFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        pending={createMut.isPending || updateMut.isPending}
        error={formError}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xoá link?"
        description={
          deleteTarget
            ? `Link “${deleteTarget.title}” sẽ bị xoá khỏi trang bio.`
            : undefined
        }
        pending={deleteMut.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMut.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </>
  );
}

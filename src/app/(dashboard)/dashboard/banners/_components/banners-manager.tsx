"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useSortableList } from "@/hooks/use-sortable-list";
import { BANNER_SECTIONS, type BannerSection } from "@/lib/banner-section";
import { queryKeys } from "@/lib/query-keys";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ProfileBanner } from "@/lib/types";
import {
  createBanner,
  deleteBanner,
  reorderBanners,
  toggleBannerActive,
  updateBanner,
  type BannerInput,
} from "../actions";
import { BannerFormDialog } from "./banner-form-dialog";

async function fetchBanners(profileId: string): Promise<ProfileBanner[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profile_banners")
    .select("*")
    .eq("profile_id", profileId)
    .order("section")
    .order("position")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as ProfileBanner[];
}

function sortSectionBanners(banners: ProfileBanner[], section: BannerSection) {
  return banners
    .filter((b) => (b.section ?? "for_you") === section)
    .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
}

function BannerSectionPanel({
  section,
  meta,
  banners,
  draggingId,
  getItemProps,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}: {
  section: BannerSection;
  meta: (typeof BANNER_SECTIONS)[number];
  banners: ProfileBanner[];
  draggingId: string | null;
  getItemProps: (id: string) => Record<string, unknown>;
  onAdd: () => void;
  onEdit: (banner: ProfileBanner) => void;
  onDelete: (banner: ProfileBanner) => void;
  onToggle: (id: string, isActive: boolean) => void;
}) {
  const items = useMemo(() => sortSectionBanners(banners, section), [banners, section]);

  return (
    <Card size="sm" className="gap-0 py-0">
      <CardHeader className="flex-row items-start justify-between gap-3 border-b pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm">{meta.label}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus />
          Thêm
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {section === "brand" ? "Chưa có brand nào." : "Chưa có banner trong mục này."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((banner) => (
              <li key={banner.id} {...getItemProps(banner.id)}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 transition-opacity",
                    draggingId === banner.id && "opacity-50",
                    !banner.is_active && "opacity-70",
                  )}
                >
                  <span className="cursor-grab text-muted-foreground active:cursor-grabbing">
                    <GripVertical className="size-4" />
                  </span>
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
                    <Image
                      src={banner.image_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{banner.name}</p>
                      <Badge variant="neutral" className="shrink-0">
                        {meta.label}
                      </Badge>
                    </div>
                    {section === "brand" ? null : banner.url ? (
                      <p className="truncate text-xs text-muted-foreground">{banner.url}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Không có liên kết</p>
                    )}
                  </div>
                  <Switch
                    checked={banner.is_active}
                    onCheckedChange={(v) => onToggle(banner.id, v)}
                    aria-label="Hiển thị công khai"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(banner)}
                    aria-label="Sửa"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(banner)}
                    aria-label="Xoá"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function BannersManager({
  initialBanners,
  profileId,
  sections = BANNER_SECTIONS.map((s) => s.value),
}: {
  initialBanners: ProfileBanner[];
  profileId: string;
  sections?: BannerSection[];
}) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createSection, setCreateSection] = useState<BannerSection>("for_you");
  const [editing, setEditing] = useState<ProfileBanner | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProfileBanner | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [activeSortSection, setActiveSortSection] = useState<BannerSection>("for_you");

  const { data: banners = initialBanners } = useQuery({
    queryKey: queryKeys.banners,
    queryFn: () => fetchBanners(profileId),
    initialData: initialBanners,
  });

  function setBanners(updater: (prev: ProfileBanner[]) => ProfileBanner[]) {
    qc.setQueryData<ProfileBanner[]>(queryKeys.banners, (prev) => updater(prev ?? []));
  }

  const createMut = useMutation({
    mutationFn: async (input: BannerInput) => {
      const res = await createBanner(input);
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
    onSuccess: (banner) => {
      setBanners((prev) => [...prev, banner]);
      setDialogOpen(false);
      setFormError(null);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BannerInput }) => {
      const res = await updateBanner(id, input);
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
    onSuccess: (banner) => {
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? banner : b)));
      setDialogOpen(false);
      setFormError(null);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await toggleBannerActive(id, isActive);
      if (!res.ok) throw new Error(res.message);
    },
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: queryKeys.banners });
      const prev = qc.getQueryData<ProfileBanner[]>(queryKeys.banners);
      setBanners((p) => p.map((b) => (b.id === id ? { ...b, is_active: isActive } : b)));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.banners, ctx.prev);
      setListError(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.banners }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteBanner(id);
      if (!res.ok) throw new Error(res.message);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.banners });
      const prev = qc.getQueryData<ProfileBanner[]>(queryKeys.banners);
      setBanners((p) => p.filter((b) => b.id !== id));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.banners, ctx.prev);
      setListError(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.banners }),
  });

  const reorderMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await reorderBanners(ids);
      if (!res.ok) throw new Error(res.message);
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: queryKeys.banners });
      const prev = qc.getQueryData<ProfileBanner[]>(queryKeys.banners);
      const byId = new Map((prev ?? []).map((b) => [b.id, b]));
      const reordered = ids
        .map((id, i) => {
          const b = byId.get(id);
          return b ? { ...b, position: i } : null;
        })
        .filter((b): b is ProfileBanner => b !== null);
      const untouched = (prev ?? []).filter((b) => !ids.includes(b.id));
      qc.setQueryData(queryKeys.banners, [...untouched, ...reordered]);
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.banners, ctx.prev);
      setListError(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.banners }),
  });

  const forYouItems = useMemo(
    () => sortSectionBanners(banners, "for_you"),
    [banners],
  );
  const brandItems = useMemo(
    () => sortSectionBanners(banners, "brand"),
    [banners],
  );

  const forYouSort = useSortableList({
    items: forYouItems,
    onCommit: (ids) => reorderMut.mutate(ids),
  });
  const brandSort = useSortableList({
    items: brandItems,
    onCommit: (ids) => reorderMut.mutate(ids),
  });

  function openCreate(section: BannerSection) {
    setCreateSection(section);
    setEditing(null);
    setFormError(null);
    setActiveSortSection(section);
    setDialogOpen(true);
  }

  function openEdit(banner: ProfileBanner) {
    setEditing(banner);
    setFormError(null);
    setActiveSortSection(banner.section ?? "for_you");
    setDialogOpen(true);
  }

  function handleSubmit(input: BannerInput) {
    if (editing) {
      updateMut.mutate({ id: editing.id, input });
    } else {
      createMut.mutate(input);
    }
  }

  function getSortProps(section: BannerSection) {
    return section === "brand" ? brandSort : forYouSort;
  }

  const visibleSections = BANNER_SECTIONS.filter((meta) => sections.includes(meta.value));

  return (
    <>
      {listError ? (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-4">
        {visibleSections.map((meta) => {
          const sort = getSortProps(meta.value);
          return (
            <BannerSectionPanel
              key={meta.value}
              section={meta.value}
              meta={meta}
              banners={banners}
              draggingId={sort.draggingId}
              getItemProps={sort.getItemProps}
              onAdd={() => openCreate(meta.value)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onToggle={(id, isActive) => toggleMut.mutate({ id, isActive })}
            />
          );
        })}
      </div>

      <BannerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        profileId={profileId}
        defaultSection={editing?.section ?? createSection ?? activeSortSection}
        pending={createMut.isPending || updateMut.isPending}
        error={formError}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.section === "brand" ? "Xoá brand?" : "Xoá banner?"}
        description={
          deleteTarget
            ? deleteTarget.section === "brand"
              ? `Brand “${deleteTarget.name}” sẽ bị xoá. Sản phẩm gán brand này sẽ mất liên kết.`
              : `Banner “${deleteTarget.name}” sẽ bị xoá khỏi trang cửa hàng.`
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

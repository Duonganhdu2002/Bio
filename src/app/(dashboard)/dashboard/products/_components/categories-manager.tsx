"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useSortableList } from "@/hooks/use-sortable-list";
import {
  CATEGORY_SECTIONS,
  normalizeCategorySection,
  type CategorySection,
} from "@/lib/category-section";
import { queryKeys } from "@/lib/query-keys";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/lib/types";
import {
  createProductCategory,
  deleteProductCategory,
  reorderProductCategories,
  updateProductCategory,
} from "../category-actions";

async function fetchCategories(profileId: string): Promise<ProductCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .eq("profile_id", profileId)
    .order("section")
    .order("position")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as ProductCategory[];
}

function sortSectionCategories(categories: ProductCategory[], section: CategorySection) {
  return categories
    .filter((c) => normalizeCategorySection(c.section) === section)
    .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
}

function CategorySectionPanel({
  section,
  meta,
  categories,
  draggingId,
  getItemProps,
  editingId,
  editName,
  onEditNameChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  updatePending,
  newName,
  onNewNameChange,
  onCreate,
  createPending,
}: {
  section: CategorySection;
  meta: (typeof CATEGORY_SECTIONS)[number];
  categories: ProductCategory[];
  draggingId: string | null;
  getItemProps: (id: string) => Record<string, unknown>;
  editingId: string | null;
  editName: string;
  onEditNameChange: (value: string) => void;
  onStartEdit: (category: ProductCategory) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onDelete: (category: ProductCategory) => void;
  updatePending: boolean;
  newName: string;
  onNewNameChange: (value: string) => void;
  onCreate: () => void;
  createPending: boolean;
}) {
  const items = useMemo(
    () => sortSectionCategories(categories, section),
    [categories, section],
  );

  return (
    <Card size="sm" className="gap-0 py-0">
      <CardHeader className="flex-row items-start justify-between gap-3 border-b pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm">{meta.label}</CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onCreate();
          }}
        >
          <Input
            value={newName}
            onChange={(e) => onNewNameChange(e.target.value)}
            placeholder={`Tên ${meta.label.toLowerCase()}...`}
            className="h-9"
          />
          <Button type="submit" size="sm" disabled={createPending || !newName.trim()}>
            <Plus />
            Thêm
          </Button>
        </form>

        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Chưa có danh mục trong mục này.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((category) => (
              <li key={category.id} {...getItemProps(category.id)}>
                <Card
                  size="sm"
                  className={cn(
                    "flex-row items-center gap-2 px-3 py-2",
                    draggingId === category.id && "opacity-50",
                  )}
                >
                  <span className="cursor-grab text-muted-foreground active:cursor-grabbing">
                    <GripVertical className="size-4" />
                  </span>
                  {editingId === category.id ? (
                    <form
                      className="flex min-w-0 flex-1 gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        onSaveEdit(category.id);
                      }}
                    >
                      <Input
                        value={editName}
                        onChange={(e) => onEditNameChange(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                      <Button type="submit" size="sm" disabled={updatePending}>
                        Lưu
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={onCancelEdit}>
                        Huỷ
                      </Button>
                    </form>
                  ) : (
                    <>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">
                        {category.name}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onStartEdit(category)}
                        aria-label="Sửa danh mục"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDelete(category)}
                        aria-label="Xoá danh mục"
                      >
                        <Trash2 />
                      </Button>
                    </>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function CategoriesManager({
  initialCategories,
  profileId,
  sections = CATEGORY_SECTIONS.map((s) => s.value),
  hideHeading = false,
}: {
  initialCategories: ProductCategory[];
  profileId: string;
  sections?: CategorySection[];
  hideHeading?: boolean;
}) {
  const qc = useQueryClient();
  const [newNames, setNewNames] = useState<Record<CategorySection, string>>({
    product: "",
    brand: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: categories = initialCategories } = useQuery({
    queryKey: queryKeys.productCategories,
    queryFn: () => fetchCategories(profileId),
    initialData: initialCategories,
  });

  function setCategories(updater: (prev: ProductCategory[]) => ProductCategory[]) {
    qc.setQueryData<ProductCategory[]>(queryKeys.productCategories, (prev) =>
      updater(prev ?? []),
    );
  }

  const createMut = useMutation({
    mutationFn: async ({ name, section }: { name: string; section: CategorySection }) => {
      const res = await createProductCategory(name, section);
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
    onSuccess: (category) => {
      setCategories((prev) => [...prev, category]);
      setNewNames((prev) => ({ ...prev, [category.section]: "" }));
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await updateProductCategory(id, name);
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
    onSuccess: (category) => {
      setCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)));
      setEditingId(null);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteProductCategory(id);
      if (!res.ok) throw new Error(res.message);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.productCategories });
      const prev = qc.getQueryData<ProductCategory[]>(queryKeys.productCategories);
      setCategories((p) => p.filter((c) => c.id !== id));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.productCategories, ctx.prev);
      setError(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.productCategories });
      qc.invalidateQueries({ queryKey: queryKeys.products });
    },
  });

  const reorderMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await reorderProductCategories(ids);
      if (!res.ok) throw new Error(res.message);
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: queryKeys.productCategories });
      const prev = qc.getQueryData<ProductCategory[]>(queryKeys.productCategories);
      const byId = new Map((prev ?? []).map((c) => [c.id, c]));
      const reordered = ids
        .map((id, i) => {
          const c = byId.get(id);
          return c ? { ...c, position: i } : null;
        })
        .filter((c): c is ProductCategory => c !== null);
      const untouched = (prev ?? []).filter((c) => !ids.includes(c.id));
      qc.setQueryData(queryKeys.productCategories, [...untouched, ...reordered]);
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.productCategories, ctx.prev);
      setError(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.productCategories }),
  });

  const productItems = useMemo(
    () => sortSectionCategories(categories, "product"),
    [categories],
  );
  const brandItems = useMemo(() => sortSectionCategories(categories, "brand"), [categories]);

  const productSort = useSortableList({
    items: productItems,
    onCommit: (ids) => reorderMut.mutate(ids),
  });
  const brandSort = useSortableList({
    items: brandItems,
    onCommit: (ids) => reorderMut.mutate(ids),
  });

  function getSortProps(section: CategorySection) {
    return section === "brand" ? brandSort : productSort;
  }

  function startEdit(category: ProductCategory) {
    setEditingId(category.id);
    setEditName(category.name);
    setError(null);
  }

  const visibleSections = CATEGORY_SECTIONS.filter((meta) => sections.includes(meta.value));

  return (
    <section className="mb-5 space-y-4">
      {hideHeading ? null : (
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Danh mục</h2>
          <span className="text-xs text-muted-foreground">{categories.length} danh mục</span>
        </div>
      )}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {visibleSections.map((meta) => {
        const sort = getSortProps(meta.value);
        return (
          <CategorySectionPanel
            key={meta.value}
            section={meta.value}
            meta={meta}
            categories={categories}
            draggingId={sort.draggingId}
            getItemProps={sort.getItemProps}
            editingId={editingId}
            editName={editName}
            onEditNameChange={setEditName}
            onStartEdit={startEdit}
            onCancelEdit={() => setEditingId(null)}
            onSaveEdit={(id) => {
              if (!editName.trim()) return;
              updateMut.mutate({ id, name: editName.trim() });
            }}
            onDelete={setDeleteTarget}
            updatePending={updateMut.isPending}
            newName={newNames[meta.value]}
            onNewNameChange={(value) =>
              setNewNames((prev) => ({ ...prev, [meta.value]: value }))
            }
            onCreate={() => {
              const name = newNames[meta.value].trim();
              if (!name) return;
              createMut.mutate({ name, section: meta.value });
            }}
            createPending={createMut.isPending}
          />
        );
      })}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xoá danh mục?"
        description={
          deleteTarget
            ? `Danh mục “${deleteTarget.name}” sẽ bị xoá. Sản phẩm trong danh mục sẽ chuyển về không phân loại.`
            : undefined
        }
        pending={deleteMut.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMut.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </section>
  );
}

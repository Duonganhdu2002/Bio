"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GripVertical,
  ImageIcon,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Trash2,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useSortableList } from "@/hooks/use-sortable-list";
import { formatPrice } from "@/components/bio/price";
import { queryKeys } from "@/lib/query-keys";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Product, ProductCategory } from "@/lib/types";
import {
  createProduct,
  deleteProduct,
  reorderProducts,
  setPinnedProducts,
  toggleProductActive,
  updateProduct,
  type ProductInput,
} from "../actions";
import { ProductFormDialog } from "./product-form-dialog";

const MAX_PINNED = 3;

async function fetchProducts(profileId: string): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("profile_id", profileId)
    .order("position")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Product[];
}

function applyPinned(products: Product[], ids: string[]): Product[] {
  return products.map((p) => {
    const idx = ids.indexOf(p.id);
    if (idx >= 0) return { ...p, is_pinned: true, pinned_position: idx + 1 };
    return { ...p, is_pinned: false, pinned_position: null };
  });
}

export function ProductsManager({
  initialProducts,
  initialCategories,
  profileId,
}: {
  initialProducts: Product[];
  initialCategories: ProductCategory[];
  profileId: string;
}) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const { data: products = initialProducts } = useQuery({
    queryKey: queryKeys.products,
    queryFn: () => fetchProducts(profileId),
    initialData: initialProducts,
  });

  const { data: categories = initialCategories } = useQuery({
    queryKey: queryKeys.productCategories,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("profile_id", profileId)
        .order("position")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as ProductCategory[];
    },
    initialData: initialCategories,
  });

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const pinned = useMemo(
    () =>
      products
        .filter((p) => p.is_pinned)
        .sort((a, b) => (a.pinned_position ?? 0) - (b.pinned_position ?? 0)),
    [products],
  );
  const unpinned = useMemo(
    () =>
      products
        .filter((p) => !p.is_pinned)
        .sort((a, b) => a.position - b.position),
    [products],
  );
  const pinnedIds = pinned.map((p) => p.id);

  function setProducts(updater: (prev: Product[]) => Product[]) {
    qc.setQueryData<Product[]>(queryKeys.products, (prev) =>
      updater(prev ?? []),
    );
  }

  const createMut = useMutation({
    mutationFn: async (input: ProductInput) => {
      const res = await createProduct(input);
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
    onSuccess: (product) => {
      setProducts((prev) => [...prev, product]);
      setDialogOpen(false);
      setFormError(null);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProductInput }) => {
      const res = await updateProduct(id, input);
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
    onSuccess: (product) => {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
      setDialogOpen(false);
      setFormError(null);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await toggleProductActive(id, isActive);
      if (!res.ok) throw new Error(res.message);
    },
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: queryKeys.products });
      const prev = qc.getQueryData<Product[]>(queryKeys.products);
      setProducts((p) =>
        p.map((x) => (x.id === id ? { ...x, is_active: isActive } : x)),
      );
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.products, ctx.prev);
      setListError(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.products }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteProduct(id);
      if (!res.ok) throw new Error(res.message);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.products });
      const prev = qc.getQueryData<Product[]>(queryKeys.products);
      setProducts((p) => p.filter((x) => x.id !== id));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.products, ctx.prev);
      setListError(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.products }),
  });

  const pinnedMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await setPinnedProducts(ids);
      if (!res.ok) throw new Error(res.message);
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: queryKeys.products });
      const prev = qc.getQueryData<Product[]>(queryKeys.products);
      setProducts((p) => applyPinned(p, ids));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.products, ctx.prev);
      setListError(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.products }),
  });

  const reorderMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await reorderProducts(ids);
      if (!res.ok) throw new Error(res.message);
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: queryKeys.products });
      const prev = qc.getQueryData<Product[]>(queryKeys.products);
      const orderMap = new Map(ids.map((id, i) => [id, i]));
      setProducts((p) =>
        p.map((x) =>
          orderMap.has(x.id) ? { ...x, position: orderMap.get(x.id)! } : x,
        ),
      );
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.products, ctx.prev);
      setListError(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.products }),
  });

  const pinnedSortable = useSortableList({
    items: pinned,
    onCommit: (ids) => pinnedMut.mutate(ids),
  });
  const unpinnedSortable = useSortableList({
    items: unpinned,
    onCommit: (ids) => reorderMut.mutate([...pinnedIds, ...ids]),
  });

  function togglePin(product: Product) {
    setListError(null);
    if (product.is_pinned) {
      pinnedMut.mutate(pinnedIds.filter((id) => id !== product.id));
      return;
    }
    if (pinnedIds.length >= MAX_PINNED) {
      setListError(`Chỉ được ghim tối đa ${MAX_PINNED} sản phẩm. Bỏ ghim bớt rồi thử lại.`);
      return;
    }
    pinnedMut.mutate([...pinnedIds, product.id]);
  }

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }
  function openEdit(product: Product) {
    setEditing(product);
    setFormError(null);
    setDialogOpen(true);
  }
  function handleSubmit(input: ProductInput) {
    if (editing) updateMut.mutate({ id: editing.id, input });
    else createMut.mutate(input);
  }

  function ProductCard({
    product,
    dragging,
  }: {
    product: Product;
    dragging: boolean;
  }) {
    const priceLabel = formatPrice(product.price_cents, product.currency);
    return (
      <Card
        size="sm"
        className={cn(
          "flex-row items-center gap-3 px-3 py-2.5 transition-opacity",
          dragging && "opacity-50",
          !product.is_active && "opacity-70",
        )}
      >
        <span className="cursor-grab text-muted-foreground active:cursor-grabbing">
          <GripVertical className="size-4" />
        </span>
        <div className="relative size-11 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              sizes="44px"
              className="object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-4" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {product.is_pinned && product.pinned_position ? (
              <Badge className="shrink-0">#{product.pinned_position}</Badge>
            ) : null}
            <p className="truncate text-sm font-medium">{product.title}</p>
          </div>
          {product.category_id && categoryMap.get(product.category_id) ? (
            <p className="text-xs text-muted-foreground">
              {categoryMap.get(product.category_id)}
            </p>
          ) : null}
          {priceLabel ? (
            <p className="text-xs text-muted-foreground">{priceLabel}</p>
          ) : null}
        </div>
        <Switch
          checked={product.is_active}
          onCheckedChange={(v) =>
            toggleMut.mutate({ id: product.id, isActive: v })
          }
          aria-label="Hiển thị công khai"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(product.is_pinned && "text-primary")}
          onClick={() => togglePin(product)}
          aria-label={product.is_pinned ? "Bỏ ghim" : "Ghim"}
          title={product.is_pinned ? "Bỏ ghim" : "Ghim nổi bật"}
        >
          {product.is_pinned ? <PinOff /> : <Pin />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => openEdit(product)}
          aria-label="Sửa"
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setDeleteTarget(product)}
          aria-label="Xoá"
        >
          <Trash2 />
        </Button>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus />
          Thêm sản phẩm
        </Button>
      </div>

      {listError ? (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      ) : null}

      <section className="mb-5">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-sm font-medium">Ghim nổi bật</h2>
          <span className="text-xs text-muted-foreground">
            {pinnedIds.length}/{MAX_PINNED}
          </span>
        </div>
        {pinned.length === 0 ? (
          <Card className="items-center justify-center py-6 text-center">
            <p className="text-xs text-muted-foreground">
              Chưa ghim sản phẩm nào. Nhấn biểu tượng ghim để đưa tối đa 3 sản phẩm lên đầu trang bio.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {pinned.map((product) => (
              <li key={product.id} {...pinnedSortable.getItemProps(product.id)}>
                <ProductCard
                  product={product}
                  dragging={pinnedSortable.draggingId === product.id}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Tất cả sản phẩm</h2>
        {unpinned.length === 0 ? (
          <Card className="items-center justify-center py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {products.length === 0
                ? "Chưa có sản phẩm nào. Thêm sản phẩm đầu tiên của bạn."
                : "Tất cả sản phẩm đang được ghim."}
            </p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {unpinned.map((product) => (
              <li key={product.id} {...unpinnedSortable.getItemProps(product.id)}>
                <ProductCard
                  product={product}
                  dragging={unpinnedSortable.draggingId === product.id}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        profileId={profileId}
        categories={categories}
        pending={createMut.isPending || updateMut.isPending}
        error={formError}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xoá sản phẩm?"
        description={
          deleteTarget
            ? `Sản phẩm “${deleteTarget.title}” sẽ bị xoá khỏi trang bio.`
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

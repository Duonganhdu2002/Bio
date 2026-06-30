"use client";

import { createClient } from "@/lib/supabase/client";

export type UploadBucket = "avatars" | "products" | "covers" | "banners";

const MAX_DIMENSION: Record<UploadBucket, number> = {
  avatars: 512,
  products: 1024,
  covers: 1600,
  banners: 1200,
};

/**
 * Nén/resize ảnh phía client (canvas → webp) rồi upload lên Supabase Storage.
 * Trả về public URL để lưu vào DB và render qua `next/image`.
 *
 * Đường dẫn: `<userId>/<timestamp>-<rand>.webp` trong bucket tương ứng,
 * đồng bộ với policy Storage (chỉ owner ghi vào thư mục của mình).
 */
export async function uploadImage(
  file: File,
  bucket: UploadBucket,
  userId: string,
): Promise<{ url: string; path: string }> {
  const compressed = await compressImage(file, MAX_DIMENSION[bucket]);
  const supabase = createClient();

  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, compressed, {
      cacheControl: "31536000",
      contentType: "image/webp",
      upsert: false,
    });
  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Đọc ảnh, scale theo cạnh dài nhất, xuất blob webp (~0.82 quality). */
async function compressImage(file: File, maxDimension: number): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // Không nén được → upload file gốc.
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  if ("close" in bitmap && typeof bitmap.close === "function") {
    bitmap.close();
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.82),
  );
  return blob ?? file;
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fallback bên dưới */
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không đọc được ảnh."));
    };
    img.src = url;
  });
}

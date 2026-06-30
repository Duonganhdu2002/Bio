import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        Không tìm thấy trang
      </h1>
      <p className="mt-3 max-w-md text-pretty text-muted-foreground">
        Trang bạn tìm không tồn tại hoặc đã bị xoá.
      </p>
      <Button size="lg" className="mt-8" render={<Link href="/" />}>
        Về trang chủ
      </Button>
    </main>
  );
}

import Link from "next/link";

export function FooterCta() {
  return (
    <footer className="text-center">
      <Link
        href="/"
        className="text-[13px] text-muted-foreground/70 transition-colors hover:text-muted-foreground"
      >
        Tạo trang Bio của bạn
      </Link>
    </footer>
  );
}

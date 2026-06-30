import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Link2,
  Palette,
  Pin,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import { isSignupEnabled } from "@/lib/auth/signup-enabled";
import {
  Float,
  HoverLift,
  Marquee,
  Reveal,
  StaggerGroup,
  StaggerItem,
} from "./_components/motion";

/* =============================================================================
   TRANG CHỦ — phong cách "Địa Trung Hải hiện đại".
   Bảng màu: cát/kem (nền), đất nung terracotta (điểm nhấn chính), xanh biển
   Aegean (điểm nhấn phụ), ô liu (trung tính ấm). Font Roboto (sans).
   Toàn bộ là Server Component, hiệu ứng chỉ bằng CSS.
   ============================================================================ */

const NAV_LINKS = [
  { href: "#tinh-nang", label: "Tính năng" },
  { href: "#cach-hoat-dong", label: "Cách hoạt động" },
  { href: "#giao-dien", label: "Giao diện" },
];

const FEATURES = [
  {
    icon: Link2,
    title: "Gom mọi liên kết",
    desc: "Mạng xã hội, kênh bán hàng, newsletter… tất cả gọn trong một đường link duy nhất, dễ nhớ.",
    tone: "terracotta",
  },
  {
    icon: Pin,
    title: "Ghim sản phẩm nổi bật",
    desc: "Đưa sản phẩm hoặc liên kết quan trọng lên đầu trang để khách nhìn thấy ngay lập tức.",
    tone: "aegean",
  },
  {
    icon: BarChart3,
    title: "Thống kê theo thời gian",
    desc: "Theo dõi lượt xem trang và lượt click từng liên kết để biết điều gì đang thật sự hiệu quả.",
    tone: "olive",
  },
  {
    icon: Palette,
    title: "Giao diện tùy biến",
    desc: "Nhiều bộ giao diện đẹp mắt, đổi phong cách trang Bio chỉ với một cú nhấp.",
    tone: "terracotta",
  },
];

const STEPS = [
  {
    no: "01",
    title: "Tạo trang của bạn",
    desc: "Đăng ký miễn phí và chọn tên người dùng cho đường link riêng /@username.",
  },
  {
    no: "02",
    title: "Thêm liên kết & sản phẩm",
    desc: "Dán liên kết, sắp xếp thứ tự, ghim nội dung nổi bật và chọn giao diện ưng ý.",
  },
  {
    no: "03",
    title: "Chia sẻ & đo lường",
    desc: "Đặt link vào bio mạng xã hội, rồi theo dõi lượt xem và lượt click mỗi ngày.",
  },
];

const THEMES = [
  { key: "default", label: "Mặc định", swatch: "linear-gradient(160deg,#efe7ff,#ffffff)" },
  { key: "dark", label: "Tối", swatch: "linear-gradient(160deg,#2a2540,#16131f)" },
  {
    key: "gradient",
    label: "Gradient",
    swatch: "linear-gradient(155deg,#8b5cf6,#ec4899 45%,#f59e0b)",
  },
  { key: "minimal", label: "Tối giản", swatch: "linear-gradient(160deg,#ffffff,#f2f2f2)" },
  { key: "neon", label: "Neon", swatch: "linear-gradient(160deg,#1b1430,#0a1f2b)" },
];

const TONE: Record<string, { bg: string; fg: string }> = {
  terracotta: { bg: "bg-[#F4DFCF]", fg: "text-[#B5562F]" },
  aegean: { bg: "bg-[#D6E7EC]", fg: "text-[#1B6480]" },
  olive: { bg: "bg-[#E3E6CF]", fg: "text-[#6B7637]" },
};

export default function Home() {
  const signupEnabled = isSignupEnabled();

  return (
    <div className="min-h-svh bg-[#FBF5EA] font-sans text-[#2C2620] selection:bg-[#C0623C]/20">
      <SiteNav signupEnabled={signupEnabled} />
      <main>
        <Hero signupEnabled={signupEnabled} />
        <TrustStrip />
        <Features />
        <HowItWorks />
        <ThemeShowcase />
        <FinalCta signupEnabled={signupEnabled} />
      </main>
      <SiteFooter signupEnabled={signupEnabled} />
    </div>
  );
}

/* --------------------------------------------------------------------------- */

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-[#C0623C] text-[15px] font-bold text-[#FBF5EA] shadow-sm">
        b
      </span>
      <span className="font-sans text-2xl font-semibold tracking-tight text-[#2C2620]">Bio</span>
    </Link>
  );
}

function SiteNav({ signupEnabled }: { signupEnabled: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#EAD9C2]/70 bg-[#FBF5EA]/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Logo />
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-[#6E6457] transition-colors hover:text-[#C0623C]"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={
              signupEnabled
                ? "hidden rounded-full px-4 py-2 text-sm font-medium text-[#4A4239] transition-colors hover:bg-[#F1E4D2] sm:inline-flex"
                : "inline-flex rounded-full px-4 py-2 text-sm font-medium text-[#4A4239] transition-colors hover:bg-[#F1E4D2]"
            }
          >
            Đăng nhập
          </Link>
          {signupEnabled ? (
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#2C2620] px-4 py-2 text-sm font-medium text-[#FBF5EA] transition-transform hover:bg-[#3a332a] active:translate-y-px"
            >
              Tạo trang Bio
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#2C2620] px-4 py-2 text-sm font-medium text-[#FBF5EA] transition-transform hover:bg-[#3a332a] active:translate-y-px"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

/* --------------------------------------------------------------------------- */

function Hero({ signupEnabled }: { signupEnabled: boolean }) {
  return (
    <section className="relative overflow-hidden">
      {/* Khối trang trí: mặt trời + vòm Địa Trung Hải */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Float amount={18} duration={9} className="absolute -top-24 left-1/2 -translate-x-1/3">
          <div className="size-[520px] rounded-full bg-[radial-gradient(circle_at_center,#F6D9B0,transparent_62%)] opacity-80" />
        </Float>
        <Float amount={24} duration={11} delay={0.6} className="absolute right-[-120px] top-24">
          <div className="size-[360px] rounded-full bg-[radial-gradient(circle_at_center,#CBE2E8,transparent_60%)] opacity-70" />
        </Float>
        <Float amount={20} duration={10} delay={1.2} className="absolute bottom-[-40px] left-[-80px]">
          <div className="size-[280px] rounded-full bg-[radial-gradient(circle_at_center,#E4E8C9,transparent_60%)] opacity-70" />
        </Float>
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr]">
        <StaggerGroup mount delay={0.1} className="text-center lg:text-left">
          <StaggerItem>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E2C9A6] bg-[#FBF1E0] px-3.5 py-1.5 text-xs font-medium tracking-wide text-[#B5562F]">
              <Sparkles className="size-3.5" />
              Link-in-bio cho người sáng tạo Việt
            </span>
          </StaggerItem>

          <StaggerItem>
            <h1 className="mt-6 font-sans text-5xl font-semibold leading-[1.05] tracking-tight text-[#2C2620] sm:text-6xl lg:text-[4.25rem]">
              Một đường link,
              <br />
              <span className="text-[#C0623C]">mọi điều</span> bạn muốn chia sẻ.
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-[#6E6457] lg:mx-0">
              Gom mọi liên kết, mạng xã hội và sản phẩm vào một trang duy nhất tại{" "}
              <span className="font-medium text-[#2C2620]">/@username</span>. Ghim sản phẩm nổi bật
              và theo dõi lượt xem, lượt click theo thời gian.
            </p>
          </StaggerItem>

          <StaggerItem>
            {/* Ô nhận username */}
            <form
              action={signupEnabled ? "/signup" : "/login"}
              className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-full border border-[#E4D2B8] bg-[#FFFCF6] p-1.5 shadow-[0_8px_30px_-12px_rgba(192,98,60,0.35)] lg:mx-0"
            >
              <span className="pl-4 text-sm font-medium text-[#9A8E7C]">bio.vn/@</span>
              <input
                name="u"
                placeholder="tencuaban"
                aria-label="Tên người dùng của bạn"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#2C2620] outline-none placeholder:text-[#B7AC99]"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#C0623C] px-5 py-2.5 text-sm font-semibold text-[#FBF5EA] transition-all hover:bg-[#A8512F] active:translate-y-px"
              >
                Nhận trang
                <ArrowRight className="size-4" />
              </button>
            </form>
          </StaggerItem>

          <StaggerItem>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#7A7062] lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-[#6B7637]" /> Miễn phí để bắt đầu
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-[#6B7637]" /> Không cần thẻ
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-[#6B7637]" /> Sẵn sàng sau 2 phút
              </span>
            </div>
          </StaggerItem>
        </StaggerGroup>

        {/* Preview trang Bio dưới vòm */}
        <Reveal mount delay={0.35} y={36} className="relative mx-auto w-full max-w-sm">
          <Float amount={10} duration={6}>
            <PhonePreview />
          </Float>
        </Reveal>
      </div>
    </section>
  );
}

function PhonePreview() {
  return (
    <div className="relative">
      {/* Vòm terracotta phía sau */}
      <div
        aria-hidden
        className="absolute inset-x-6 -top-6 bottom-10 rounded-[999px_999px_28px_28px] bg-gradient-to-b from-[#D98A5E] to-[#C0623C] shadow-[0_30px_60px_-25px_rgba(192,98,60,0.6)]"
      />
      <div className="relative rounded-[2rem] border border-[#EBDCC6] bg-[#FFFCF6] p-5 shadow-[0_24px_60px_-30px_rgba(44,38,32,0.45)]">
        <div className="flex flex-col items-center text-center">
          <div className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-[#1E6E89] to-[#7E8A4F] text-2xl font-semibold text-white shadow-md">
            MC
          </div>
          <h3 className="mt-3 font-sans text-xl font-semibold text-[#2C2620]">Mai Chi</h3>
          <p className="text-sm text-[#9A8E7C]">@maichi</p>
          <p className="mt-1.5 text-sm text-[#6E6457]">Food & travel creator · Sài Gòn</p>
        </div>

        {/* Sản phẩm ghim */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#EBDCC6] bg-[#FBF1E0] p-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#F4DFCF] text-[#B5562F]">
            <ShoppingBag className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#2C2620]">Sổ tay du lịch 2026</p>
            <p className="text-xs text-[#9A8E7C]">Sản phẩm ghim</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#C0623C] px-2.5 py-1 text-xs font-semibold text-white">
            199K
          </span>
        </div>

        {/* Liên kết */}
        <div className="mt-3 space-y-2.5">
          {["Kênh YouTube", "Cửa hàng Shopee", "Newsletter hằng tuần"].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-[#EBDCC6] bg-white px-4 py-3 text-sm font-medium text-[#2C2620] shadow-sm"
            >
              {label}
              <ArrowRight className="size-4 text-[#C0623C]" />
            </div>
          ))}
        </div>
      </div>

      {/* Thẻ thống kê nổi */}
      <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-[#D6E7EC] bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:block">
        <p className="text-xs text-[#9A8E7C]">Lượt xem hôm nay</p>
        <p className="font-sans text-2xl font-semibold text-[#1B6480]">1.248</p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------- */

function TrustStrip() {
  const items = [
    "Creator",
    "KOL · KOC",
    "Nhà bán hàng",
    "Nghệ sĩ",
    "Freelancer",
    "Local brand",
    "Nhiếp ảnh gia",
    "Quán cà phê",
  ];
  return (
    <section className="border-y border-[#EAD9C2]/70 bg-[#F5E9D6] py-6">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Marquee
          className="w-full"
          items={items.map((i) => (
            <span
              key={i}
              className="font-sans text-lg font-medium text-[#7A7062]"
            >
              {i}
            </span>
          ))}
        />
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------- */

function Features() {
  return (
    <section id="tinh-nang" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <SectionHeading
          eyebrow="Tính năng"
          title="Mọi thứ cho một trang Bio chuyên nghiệp"
          desc="Đơn giản để bắt đầu, đủ mạnh để phát triển cùng bạn."
        />
      </Reveal>
      <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
        {FEATURES.map((f) => {
          const tone = TONE[f.tone];
          return (
            <StaggerItem key={f.title}>
              <HoverLift className="h-full rounded-3xl border border-[#EBDCC6] bg-[#FFFCF6] p-6 shadow-[0_2px_0_rgba(44,38,32,0.02)] transition-shadow hover:shadow-[0_24px_50px_-30px_rgba(44,38,32,0.4)]">
                <div className={`grid size-12 place-items-center rounded-2xl ${tone.bg} ${tone.fg}`}>
                  <f.icon className="size-6" />
                </div>
                <h3 className="mt-5 font-sans text-xl font-semibold text-[#2C2620]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6E6457]">{f.desc}</p>
              </HoverLift>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </section>
  );
}

/* --------------------------------------------------------------------------- */

function HowItWorks() {
  return (
    <section id="cach-hoat-dong" className="bg-[#1E6E89] text-[#F4F8F6]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-[#A9D2DC]">
            Cách hoạt động
          </p>
          <h2 className="mt-3 font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
            Lên sóng chỉ trong ba bước
          </h2>
        </Reveal>
        <StaggerGroup className="mt-14 grid gap-8 md:grid-cols-3" stagger={0.15}>
          {STEPS.map((s) => (
            <StaggerItem key={s.no} className="relative">
              <span className="font-sans text-6xl font-semibold text-[#5EA0B3]">{s.no}</span>
              <h3 className="mt-2 font-sans text-2xl font-semibold text-white">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-[#CDE5EC]">{s.desc}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------- */

function ThemeShowcase() {
  return (
    <section id="giao-dien" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <SectionHeading
          eyebrow="Giao diện"
          title="Chọn phong cách hợp với bạn"
          desc="Đổi toàn bộ diện mạo trang Bio chỉ với một cú nhấp — từ tối giản đến rực rỡ."
        />
      </Reveal>
      <StaggerGroup
        className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        stagger={0.08}
      >
        {THEMES.map((t) => (
          <StaggerItem key={t.key}>
            <HoverLift className="overflow-hidden rounded-2xl border border-[#EBDCC6] bg-[#FFFCF6]">
              <div className="h-32 w-full" style={{ background: t.swatch }} aria-hidden />
              <div className="px-4 py-3 text-sm font-medium text-[#2C2620]">{t.label}</div>
            </HoverLift>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

/* --------------------------------------------------------------------------- */

function FinalCta({ signupEnabled }: { signupEnabled: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
      <Reveal y={40} className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#C0623C] to-[#A8512F] px-6 py-16 text-center shadow-[0_30px_70px_-35px_rgba(192,98,60,0.7)] sm:px-12 sm:py-20">
        <Float amount={16} duration={8} className="pointer-events-none absolute -right-16 -top-16">
          <div aria-hidden className="size-64 rounded-full bg-white/10" />
        </Float>
        <Float amount={20} duration={10} delay={0.5} className="pointer-events-none absolute -bottom-20 -left-10">
          <div aria-hidden className="size-72 rounded-full bg-[#1E6E89]/25" />
        </Float>
        <h2 className="relative mx-auto max-w-2xl font-sans text-4xl font-semibold tracking-tight text-[#FFF7EC] sm:text-5xl">
          {signupEnabled
            ? "Sẵn sàng tạo trang Bio của riêng bạn?"
            : "Quản lý trang Bio của bạn"}
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-lg text-[#FBE6D7]">
          {signupEnabled
            ? "Miễn phí, nhanh chóng và đẹp ngay từ đầu. Đường link của bạn đang chờ."
            : "Đăng nhập để cập nhật link, sản phẩm và giao diện trang của bạn."}
        </p>
        <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
          {signupEnabled ? (
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-[#FBF5EA] px-7 py-3.5 text-base font-semibold text-[#A8512F] transition-transform hover:bg-white active:translate-y-px"
            >
              Tạo trang Bio
              <ArrowRight className="size-4" />
            </Link>
          ) : null}
          <Link
            href="/login"
            className={
              signupEnabled
                ? "inline-flex items-center rounded-full border border-white/40 px-7 py-3.5 text-base font-semibold text-[#FFF7EC] transition-colors hover:bg-white/10"
                : "inline-flex items-center gap-2 rounded-full bg-[#FBF5EA] px-7 py-3.5 text-base font-semibold text-[#A8512F] transition-transform hover:bg-white active:translate-y-px"
            }
          >
            Đăng nhập
            {!signupEnabled ? <ArrowRight className="size-4" /> : null}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------------------------------------------------------- */

function SiteFooter({ signupEnabled }: { signupEnabled: boolean }) {
  return (
    <footer className="border-t border-[#EAD9C2]/70 bg-[#F5E9D6]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
        <Logo />
        <p className="text-sm text-[#7A7062]">
          © {new Date().getFullYear()} Bio · Một đường link, mọi điều bạn muốn chia sẻ.
        </p>
        <div className="flex items-center gap-5 text-sm text-[#6E6457]">
          <Link href="/login" className="transition-colors hover:text-[#C0623C]">
            Đăng nhập
          </Link>
          {signupEnabled ? (
            <Link href="/signup" className="transition-colors hover:text-[#C0623C]">
              Đăng ký
            </Link>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

/* --------------------------------------------------------------------------- */

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-[#B5562F]">{eyebrow}</p>
      <h2 className="mt-3 font-sans text-4xl font-semibold tracking-tight text-[#2C2620] sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-[#6E6457]">{desc}</p>
    </div>
  );
}

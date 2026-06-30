"use client";

/* =============================================================================
   Bộ primitive animation cho trang chủ (Framer Motion / gói `motion`).
   Tách riêng "use client" để trang chủ vẫn là Server Component.
   - Reveal:       fade + trượt lên, kích hoạt khi cuộn tới (hoặc khi mount).
   - StaggerGroup: container cho hiệu ứng lần lượt (stagger) các con.
   - StaggerItem:  phần tử con của StaggerGroup.
   - Float:        chuyển động lơ lửng lặp vô hạn.
   - Marquee:      dải chữ chạy ngang liên tục.
   - HoverLift:    nâng nhẹ khi hover (cho thẻ).
   ============================================================================ */

import type { ReactNode } from "react";
import { motion, type Variants } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  /** true = chạy ngay khi mount (dùng cho hero); false = chạy khi cuộn tới. */
  mount?: boolean;
  duration?: number;
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  mount = false,
  duration = 0.7,
}: RevealProps) {
  const animateProps = mount
    ? { animate: { opacity: 1, y: 0 } }
    : {
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.25 },
      };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      transition={{ duration, delay, ease: EASE }}
      {...animateProps}
    >
      {children}
    </motion.div>
  );
}

type StaggerGroupProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  mount?: boolean;
};

export function StaggerGroup({
  children,
  className,
  delay = 0,
  stagger = 0.12,
  mount = false,
}: StaggerGroupProps) {
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  const animateProps = mount
    ? { animate: "show" as const }
    : { whileInView: "show" as const, viewport: { once: true, amount: 0.2 } };

  return (
    <motion.div className={className} variants={variants} initial="hidden" {...animateProps}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const variants: Variants = {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}

export function Float({
  children,
  className,
  amount = 12,
  duration = 5,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
  duration?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amount, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -8, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}

export function Marquee({
  items,
  className,
  duration = 22,
}: {
  items: ReactNode[];
  className?: string;
  duration?: number;
}) {
  const loop = [...items, ...items];
  return (
    <div className={className} style={{ overflow: "hidden", maskImage: "linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)" }}>
      <motion.div
        className="flex w-max items-center gap-10"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {loop.map((item, i) => (
          <span key={i} className="shrink-0">
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

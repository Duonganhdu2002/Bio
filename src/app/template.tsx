"use client";

/* =============================================================================
   Hiệu ứng chuyển trang mượt cho TOÀN BỘ dự án.
   `template.tsx` (khác `layout.tsx`) được re-mount sau mỗi lần điều hướng, nên
   hiệu ứng `initial → animate` chạy lại mỗi khi đổi route.
   Chỉ animate `opacity` (không dùng transform) để tránh tạo containing block
   làm hỏng `position: sticky/fixed` bên trong (nav sticky trang chủ, sidebar
   dashboard). Tôn trọng `prefers-reduced-motion`.
   ============================================================================ */

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

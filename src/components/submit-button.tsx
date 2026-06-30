"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText?: string;
  variant?: "default" | "secondary" | "outline" | "destructive" | "ghost";
  size?: "default" | "sm" | "lg";
  fullWidth?: boolean;
};

/**
 * Nút submit dùng cho Server Action: tự hiện trạng thái pending qua
 * `useFormStatus`, vô hiệu hóa trong lúc gửi. Style từ `buttonVariants`.
 */
export function SubmitButton({
  children,
  pendingText = "Đang lưu…",
  className,
  variant = "default",
  size = "default",
  fullWidth,
  disabled,
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      data-pending={pending ? "" : undefined}
      className={cn(buttonVariants({ variant, size }), fullWidth && "w-full", className)}
      {...rest}
    >
      {pending ? pendingText : children}
    </button>
  );
}

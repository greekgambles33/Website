import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-lava-300 to-lava-400 text-[#140a04] shadow-[0_10px_30px_rgba(255,90,20,0.4)] hover:-translate-y-0.5",
  secondary:
    "glass-panel text-ash-100 hover:border-lava-400/45 hover:text-white",
  ghost: "text-ash-100 hover:text-lava-300",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3.5 text-sm",
  lg: "px-8 py-4 text-base",
};

const base =
  "font-heading inline-flex items-center justify-center gap-2 rounded-[10px] font-bold uppercase tracking-[0.06em] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  target,
  rel,
  children,
}: CommonProps & { href: string; target?: string; rel?: string; children: React.ReactNode }) {
  return (
    <Link href={href} target={target} rel={rel} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}

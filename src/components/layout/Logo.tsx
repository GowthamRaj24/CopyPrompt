import Image from "next/image";
import Link from "next/link";
import { SITE_BRAND } from "@/lib/site-brand";

const LOGO_SRC = SITE_BRAND.logoSrc;

const sizeClasses = {
  sm: "size-7",
  md: "size-10",
  lg: "size-11",
} as const;

interface LogoProps {
  /** sm: footer / mobile sheet · md: header · lg: auth */
  size?: keyof typeof sizeClasses;
  /** header: gradient wordmark matching logo blues */
  variant?: "default" | "header";
  /** Show wordmark next to the mark */
  showName?: boolean;
  className?: string;
}

/**
 * Brand logo — stacked cards + terminal prompt (transparent PNG).
 * Used in header, footer, auth, and mobile nav.
 */
export function Logo({
  size = "md",
  variant = "default",
  showName = true,
  className = "",
}: LogoProps) {
  const dim = size === "sm" ? 28 : size === "lg" ? 44 : 40;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src={LOGO_SRC}
        alt=""
        width={dim}
        height={dim}
        className={`${sizeClasses[size]} shrink-0 object-contain drop-shadow-[0_2px_8px_oklch(0.54_0.225_270/0.25)]`}
        priority={size === "md"}
        aria-hidden
      />
      {showName ? (
        variant === "header" ? (
          <span className="hidden text-[15px] font-semibold tracking-[-0.03em] sm:inline">
            <span className="text-foreground/90">My </span>
            <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
              Copyprompt
            </span>
          </span>
        ) : (
          <span className="text-[14px] font-semibold tracking-[-0.02em]">
            {SITE_BRAND.displayName}
          </span>
        )
      ) : null}
    </span>
  );
}

interface LogoLinkProps extends LogoProps {
  onClick?: () => void;
}

export function LogoLink({
  size = "md",
  variant = "default",
  showName = true,
  className = "",
  onClick,
}: LogoLinkProps) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={`group transition-opacity hover:opacity-90 ${className}`}
      aria-label={`${SITE_BRAND.displayName} home`}
    >
      <Logo size={size} variant={variant} showName={showName} />
    </Link>
  );
}

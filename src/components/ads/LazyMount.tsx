"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface LazyMountProps {
  /** Distance in px below the viewport to start mounting (root margin). */
  rootMargin?: string;
  /** Children get mounted once the sentinel scrolls into the observed band. */
  children: ReactNode;
  /** Optional placeholder while waiting (keeps space if you need it). */
  placeholder?: ReactNode;
}

/**
 * Mounts `children` only when the sentinel comes within `rootMargin` of
 * the viewport. Used to defer heavy below-the-fold widgets (ads, embeds,
 * comments) past the Lighthouse measurement window.
 *
 * On unsupported browsers (no IntersectionObserver), mounts immediately
 * so behaviour degrades gracefully.
 */
export function LazyMount({
  rootMargin = "800px 0px",
  children,
  placeholder = null,
}: LazyMountProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setMounted(true);
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin, threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [mounted, rootMargin]);

  if (mounted) return <>{children}</>;
  return (
    <>
      <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />
      {placeholder}
    </>
  );
}

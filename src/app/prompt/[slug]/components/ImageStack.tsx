"use client";

import { ExpandIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface StackImage {
  id: string;
  cdnUrl: string;
  width: number;
  height: number;
  alt: string | null;
}

interface ImageStackProps {
  images: StackImage[];
  title: string;
  unoptimized?: boolean;
}

/**
 * Vertical image stack for the detail page left column.
 * Click → fullscreen lightbox.
 */
export function ImageStack({ images, title, unoptimized }: ImageStackProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20 text-[13px] text-muted-foreground">
        No images
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2.5">
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setLightboxIdx(idx)}
            className="group relative block w-full overflow-hidden rounded-xl border border-border/50 bg-muted transition-all duration-300 hover:border-primary/25"
            aria-label={`Open image ${idx + 1} fullscreen`}
          >
            <Image
              src={img.cdnUrl}
              alt={img.alt ?? `${title} ${idx + 1}`}
              width={img.width}
              height={img.height}
              unoptimized={unoptimized}
              priority={idx === 0}
              className="h-auto w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
            {/* Position chip */}
            <span className="pointer-events-none absolute top-2.5 left-2.5 inline-flex items-center rounded-full border border-white/15 bg-black/50 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-white/90 backdrop-blur-md">
              {idx + 1} / {images.length}
            </span>
            {/* Expand hint */}
            <span className="pointer-events-none absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/90 opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
              <ExpandIcon className="size-2.5" strokeWidth={2} />
              Expand
            </span>
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          src={images[lightboxIdx]?.cdnUrl ?? ""}
          alt={images[lightboxIdx]?.alt ?? title}
          width={images[lightboxIdx]?.width ?? 1024}
          height={images[lightboxIdx]?.height ?? 1024}
          unoptimized={unoptimized}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  src,
  alt,
  width,
  height,
  unoptimized,
  onClose,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  unoptimized?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        unoptimized={unoptimized}
        className="max-h-full max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <span
        aria-hidden
        className="absolute top-4 right-4 grid size-8 place-items-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md"
      >
        <XIcon className="size-3.5" strokeWidth={2} />
      </span>
    </button>
  );
}

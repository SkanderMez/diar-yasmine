import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type LogoVariant = "wordmark" | "mark" | "full";

interface LogoProps {
  variant?: LogoVariant;
  href?: string;
  className?: string;
  /** Tailwind height class, e.g. "h-7" / "h-8". The width auto-adapts to
   *  the SVG aspect ratio. Default per variant: wordmark=h-7, mark=h-8,
   *  full=h-12. */
  heightClass?: string;
}

/**
 * Logo — three variants drawn from the official brand SVGs.
 *
 * - `wordmark`: "Diar Yasmine" in script only. Best for compact headers
 *   alongside an icon-only mark elsewhere on the page.
 * - `mark`: the jasmine + arch icon, no text. Use in collapsed nav,
 *   favicons, OG corner.
 * - `full`: icon + wordmark stacked (the original SVG). Use in hero
 *   sections, footers, voucher headers — places with vertical room.
 *
 * The SVGs come from `/public/brand/`. Aspect ratios are preserved by
 * using `width="auto"` style + Next.js Image's intrinsic mode.
 */
export function Logo({
  variant = "wordmark",
  href = "/",
  className,
  heightClass,
}: LogoProps) {
  const config = {
    wordmark: {
      src: "/brand/logo-wordmark.svg",
      // viewBox 639×260, ratio ≈ 2.46
      width: 200,
      height: 80,
      defaultHeight: "h-7",
    },
    mark: {
      src: "/brand/logo-mark.svg",
      // viewBox 745×628, ratio ≈ 1.19
      width: 80,
      height: 64,
      defaultHeight: "h-8",
    },
    full: {
      src: "/brand/logo.svg",
      // viewBox 745×928, ratio ≈ 0.80
      width: 200,
      height: 248,
      defaultHeight: "h-12",
    },
  }[variant];

  return (
    <Link
      href={href}
      aria-label="Diar Yasmine"
      className={cn("inline-flex items-center", className)}
    >
      <Image
        src={config.src}
        alt="Diar Yasmine"
        width={config.width}
        height={config.height}
        priority
        className={cn(heightClass ?? config.defaultHeight, "w-auto")}
      />
    </Link>
  );
}

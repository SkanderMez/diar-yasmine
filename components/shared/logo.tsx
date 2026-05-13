import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "full" | "mark";
  href?: string;
  className?: string;
};

export function Logo({ variant = "full", href = "/", className }: LogoProps) {
  const isFull = variant === "full";
  const src = isFull ? "/brand/logo.svg" : "/brand/logo-mark.svg";

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center", className)}
      aria-label="Diar Yasmine"
    >
      <Image
        src={src}
        alt="Diar Yasmine"
        width={isFull ? 240 : 56}
        height={isFull ? 64 : 56}
        priority
      />
    </Link>
  );
}

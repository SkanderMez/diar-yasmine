import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AmenityItem {
  label: string;
  meta?: string;
  included?: boolean;
}

interface PropertyAmenitiesGridProps {
  items: AmenityItem[];
}

/**
 * Maquette `.amenities-grid` — two-column list. Each row gets a check
 * icon (primary if included) and a label; not-included items are
 * line-through + muted to communicate "this is what's NOT here".
 */
export function PropertyAmenitiesGrid({ items }: PropertyAmenitiesGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((item, i) => {
        const included = item.included ?? true;
        return (
          <li
            key={`${item.label}-${i}`}
            className={cn(
              "flex items-center gap-3 py-3",
              !included && "opacity-50",
            )}
          >
            <span className="shrink-0 text-primary">
              {included ? (
                <Check className="size-5" strokeWidth={1.75} />
              ) : (
                <Minus
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.75}
                />
              )}
            </span>
            <div>
              <div
                className={cn(
                  "font-medium text-charcoal",
                  !included && "line-through",
                )}
              >
                {item.label}
              </div>
              {item.meta && (
                <div className="text-xs text-muted-foreground">{item.meta}</div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

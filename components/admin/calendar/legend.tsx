import type { ReservationSource } from "@prisma/client";

/**
 * Tailwind class name for a reservation block, keyed by source. Kept here
 * so the reservation detail page (which uses Tailwind tokens, not the
 * admin-shell scoped tokens) can colour its source dot consistently with
 * the calendar.
 */
export function sourceBgClass(source: ReservationSource): string {
  switch (source) {
    case "DIRECT_WEB":
      return "bg-source-direct-web";
    case "WALK_IN":
      return "bg-source-walk-in";
    case "PHONE":
      return "bg-source-phone";
    case "PARTNER":
      return "bg-source-partner";
    case "BOOKING":
      return "bg-source-booking";
    case "AIRBNB":
      return "bg-source-airbnb";
    case "EXPEDIA":
      return "bg-source-expedia";
    case "OTHER":
    default:
      return "bg-source-other";
  }
}

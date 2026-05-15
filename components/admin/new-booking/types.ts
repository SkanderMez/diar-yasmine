import type { ActiveProperty } from "@/lib/queries";

/**
 * Shared types for the new-booking wizard. The page hydrates active
 * properties with their first photo so the unit picker and the sticky
 * summary can render a hero without re-querying.
 */

export type NewBookingProperty = ActiveProperty & {
  photoUrl: string | null;
  photoAlt: string | null;
};

export type PriceLineKind = "base" | "discount" | "extra" | "tax";

export interface PriceLine {
  id: string;
  kind: PriceLineKind;
  label: string;
  /**
   * For `discount`: percent (0-100) when `mode === "%"`, millimes when
   * `mode === "TND"`. For `extra`: millimes. For `tax`: percent (0-100).
   * For `base`: computed display millimes (not editable).
   */
  value: number;
  /** Only meaningful for `discount`. */
  mode?: "%" | "TND";
}

export interface ComputedPricing {
  /** Nightly rate in millimes (after season multiplier). */
  nightlyPrice: number;
  /** basePrice = nightlyPrice × nights, millimes. */
  basePrice: number;
  /** Effective discount applied, millimes. */
  discountAmount: number;
  /** Sum of all `extra` lines, millimes. */
  extrasTotal: number;
  /** Sub-total HT, millimes. */
  subtotal: number;
  /** TVA amount, millimes. */
  tax: number;
  /** Effective tax rate (0..1). */
  taxRate: number;
  /** Grand total TTC, millimes. */
  total: number;
}

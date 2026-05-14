import type { AdminChannelChip } from "@/lib/queries";

interface ListingChipsProps {
  chips: AdminChannelChip[];
  /** Optional trailing free-form chip (e.g. "Commission 18%"). */
  trailing?: React.ReactNode;
  /** Summary chip prepended before the per-listing chips. Hidden if null. */
  summary?: React.ReactNode;
}

export function ListingChips({ chips, trailing, summary }: ListingChipsProps) {
  return (
    <div className="listings" role="list">
      {summary !== undefined && summary !== null ? summary : null}
      {chips.map((chip) => (
        <span
          key={chip.unitName}
          className={`listing-chip ${chip.state}`}
          role="listitem"
          title={
            chip.state === "conflict"
              ? `Conflit · ${chip.unitName}`
              : chip.state === "revision"
                ? `En révision · ${chip.unitName}`
                : `Synchronisé · ${chip.unitName}`
          }
        >
          {chip.unitName}
        </span>
      ))}
      {trailing}
    </div>
  );
}

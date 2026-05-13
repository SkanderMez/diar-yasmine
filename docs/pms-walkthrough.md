# PMS walkthrough — for the front-desk staff

> This is a reference. Once you've used the PMS for a day or two,
> the muscle memory takes over. Bookmark this page on the reception
> tablet for your first week.

## 1. Sign in

- URL: `https://diaryasmine.tn/fr/signin`
- Use the email + password your administrator gave you. If you've
  lost them, ask the manager — there is **no self-service password
  reset for staff**.
- Sessions last **24 hours**. After that, sign back in.

## 2. The dashboard at a glance

- Top bar: search (Phase 2), Quick Book button (⌘K), language
  switcher, your user menu (sign out).
- Sidebar: 10 sections.
  - **Tableau de bord** — KPIs and today's tasks.
  - **Calendrier** ⭐ — the heart of the PMS.
  - **Réservations** — the full list.
  - **Hébergements** — the 21 units, their photos, descriptions,
    base prices.
  - **Tarification** — seasons, weekend rates, minimum stays.
  - **Clients** — guest list, merge tool, history.
  - **Canaux** — Booking/Airbnb/Expedia iCal sync.
  - **Paiements** — daily cash + card reconciliation.
  - **Rapports** — occupancy, ADR, RevPAR.
  - **Paramètres** — taxes, templates, users (ADMIN only).

## 3. Quick Book (⌘K) — the walk-in / phone shortcut ⭐

Press **⌘K** anywhere in the admin to open a single-screen booking
form. Designed for speed:

| Field | Required | Notes |
| --- | --- | --- |
| Unit | ✓ | Picker filtered by availability. |
| Check-in / check-out | ✓ | Click on the calendar above to pre-fill. |
| Adults / children | ✓ | Defaults to 2 / 0. |
| Guest name | ✓ | Autocomplete from existing guests. |
| Guest phone | ✓ | Unique key. Autocomplete by phone. |
| Guest email | optional | Skip if the guest doesn't have one. |
| Source | ✓ | Téléphone / Walk-in / Partenaire / Site direct. |
| Discount | optional | Aucune / % / Fixe / Match concurrent. |
| Payment | optional | Acompte / Total / Rien · CASH / CARD / TRANSFER. |
| Voucher delivery | optional | Email / SMS / WhatsApp / Imprimer. |

- The right column shows the live tariff breakdown as you change
  things. No surprises at confirmation.
- `Cmd+Enter` confirms. If two staff create overlapping bookings
  at the same time, **the second one will be refused** by the
  database — no double-booking is ever possible.

## 4. The calendar ⭐

- **Rows**: 21 units grouped into "Chalets" and "Bungalows", both
  collapsible.
- **Columns**: 14 / 30 / 90 days (toggle top-right).
- **Colors** correspond to the reservation source: teal = direct
  web, olive = walk-in / phone, blue = Booking, red = Airbnb,
  amber = Expedia.
- **Drag a block** to move it. The server validates and rolls back
  if the move would overlap another booking.
- **Click an empty cell** → Quick Book pre-filled with that unit
  and date.
- **Click a block** → side drawer with details + actions (check-in,
  check-out, edit, cancel, regenerate voucher).
- **Right-click a block** → quick check-in / check-out / no-show.

## 5. Check-in / check-out

Right-click the block on the day of the check-in (or the day of
departure). Choose the action.

- Check-in marks the guest CHECKED_IN and records the timestamp.
- Check-out marks them CHECKED_OUT.
- No-show marks them NO_SHOW; the room is released, the EXCLUDE
  constraint stops blocking it.

## 6. Voucher

Generated automatically at confirmation. PDF, A4, brand colors,
QR code, pricing breakdown, deposit and balance, terms, access map.

To resend later: open the reservation drawer → "Voucher" → Email /
SMS / WhatsApp / Imprimer.

## 7. Daily reconciliation

End of day: **Paiements → Aujourd'hui**. The page lists every
payment received that day with its method. Match the cash drawer
to the CASH total, the card terminal to the CARD total.

If something doesn't match, search by reservation code or guest
phone first — most discrepancies are mis-attribution, not loss.

## 8. Channel manager (Phase 5)

Once enabled, the calendar will reflect Booking/Airbnb/Expedia
bookings within ~15 minutes of import. Conflicts (a guest booked
the same dates on two channels) are highlighted in red and require
manual resolution. **Always** resolve conflicts before confirming
any new direct reservation.

## 9. Help

- Manager on call: see the topbar user menu → "Contact escalation".
- Documentation updates: this page lives in `docs/pms-walkthrough.md`
  — propose edits via PR.

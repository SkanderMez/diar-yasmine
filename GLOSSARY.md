# Domain Glossary — Diar Yasmine

## Property types
- **Chalet**: beachfront unit, wood/glass modern architecture, all
  with private pool and direct sea view. 9 units.
- **Bungalow**: garden Mediterranean style, 7 min walk from beach,
  most (not all) with private pool. 12 units.

## Reservation lifecycle
PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT
Alt: CANCELLED, NO_SHOW

## Reservation sources
- **DIRECT_WEB**: booked via diaryasmine.tn
- **WALK_IN**: client arrived in person without reservation
- **PHONE**: phoned the reception
- **PARTNER**: travel agency or partner referral
- **BOOKING / AIRBNB / EXPEDIA**: via OTA platform
- **OTHER**: anything else

## Voucher
PDF document confirming a reservation. Contains code (DY-YYYYMMDD-XXXX),
QR for verification, dates, unit, guests, pricing breakdown, payments
received, balance due, conditions, access map. Generated at booking
confirmation, sent via email/SMS/WhatsApp, or printed.

## Quick Book
The fast reservation creation flow used for walk-ins and phone
bookings. Accessible via ⌘K from anywhere in admin. Minimal required
fields (unit, dates, name, phone).

## Pricing terms
- **Base price**: nightly rate × number of nights
- **Discount**: percent (%) or fixed amount (TND) applied to base price
- **Extras**: cleaning fee, tourist tax, padel sessions, etc.
- **Subtotal**: base - discount + extras
- **Total**: subtotal + tax
- **Paid amount**: sum of all received payments
- **Balance due**: total - paid amount

## KPIs
- **Occupancy rate**: occupied nights / available nights
- **ADR (Average Daily Rate)**: revenue / occupied nights
- **RevPAR**: revenue / available nights (occupancy × ADR)

## Channel manager
System that syncs availability and reservations across multiple OTA
platforms (Booking, Airbnb, Expedia) to prevent double-booking.

## iCal
Calendar interchange format used by most OTA platforms for
import/export of reservations. Each property has its own iCal feed.

## Roles
- **ADMIN**: full access
- **MANAGER**: full access except user management and critical settings
- **RECEPTION**: front desk staff — Quick Book, calendar, check-in/out,
  payments only
- **VIEWER**: read-only

## Tunisian context
- Currency: TND (Tunisian Dinar), stored in millimes (1 TND = 1000 mil).
- Timezone: Africa/Tunis (GMT+1, no DST since 2009).
- Tax: TBD based on tourism regulations.
- Local payment: Flouci, Konnect (in addition to Stripe).

## Padel
Padelsmed.com — 2 padel courts adjacent to the property,
mentioned on the website as an experience. Separate brand but
same ownership.

## Location
Tazarka, Cap Bon, Tunisia. Coastal village.

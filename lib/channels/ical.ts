/**
 * Minimal iCalendar (RFC 5545) generator + parser for the channel manager.
 *
 * We deliberately keep this self-contained: iCal is plain text, and the
 * subset OTAs (Booking, Airbnb, Expedia) actually use is tiny:
 *   - VCALENDAR header with PRODID/VERSION
 *   - VEVENT with UID, DTSTART, DTEND, SUMMARY, STATUS
 *   - Date-only events using DTSTART;VALUE=DATE:YYYYMMDD
 *
 * No external deps. Phase 5.5 may swap in `node-ical` if we need recurring
 * events or VTIMEZONE awareness, but as of now we deal in all-day blocks
 * (check-in day → check-out day).
 */

export const ICAL_PROD_ID = "-//Diar Yasmine//PMS//FR";

export interface ICalEvent {
  uid: string;
  /** Inclusive — first day of the stay. */
  start: Date;
  /** Exclusive — checkout day (matches RFC 5545 VEVENT DTEND for all-day). */
  end: Date;
  summary: string;
  description?: string;
  status?: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  /** Last modified timestamp; lets OTAs detect updates. */
  lastModified?: Date;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDate(d: Date): string {
  // YYYYMMDD in UTC. Reservations are stored as midnight Africa/Tunis (UTC+1),
  // which means new Date() lands at 23:00 UTC the day before — we therefore
  // shift to Africa/Tunis before extracting the date component.
  const local = new Date(d.getTime() + 60 * 60 * 1000); // UTC+1
  return `${local.getUTCFullYear()}${pad(local.getUTCMonth() + 1)}${pad(local.getUTCDate())}`;
}

function formatTimestamp(d: Date): string {
  return (
    formatDate(d) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Fold a content line at 75 octets per RFC 5545. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75));
    rest = rest.slice(75);
  }
  chunks.push(rest);
  return chunks.join("\r\n ");
}

export function buildICalFeed(opts: {
  name: string;
  events: ICalEvent[];
}): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${ICAL_PROD_ID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(opts.name)}`,
  ];
  for (const event of opts.events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTAMP:${formatTimestamp(event.lastModified ?? new Date())}`);
    lines.push(`DTSTART;VALUE=DATE:${formatDate(event.start)}`);
    lines.push(`DTEND;VALUE=DATE:${formatDate(event.end)}`);
    lines.push(`SUMMARY:${escapeText(event.summary)}`);
    if (event.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeText(event.description)}`));
    }
    lines.push(`STATUS:${event.status ?? "CONFIRMED"}`);
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/**
 * Naive iCalendar parser — extracts VEVENT blocks with UID, DTSTART,
 * DTEND, SUMMARY, STATUS. Sufficient for OTA feeds; for production-grade
 * parsing of edge cases (RRULE, VTIMEZONE, escaped commas in addresses),
 * swap in `node-ical`.
 */
export interface ParsedICalEvent {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  status: string;
}

export function parseICalFeed(body: string): ParsedICalEvent[] {
  // Unfold line continuations (RFC 5545: CRLF + space/tab).
  const unfolded = body.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  const events: ParsedICalEvent[] = [];
  let current: Partial<ParsedICalEvent> | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (
        current?.uid &&
        current.start instanceof Date &&
        current.end instanceof Date
      ) {
        events.push({
          uid: current.uid,
          start: current.start,
          end: current.end,
          summary: current.summary ?? "",
          status: current.status ?? "CONFIRMED",
        });
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const left = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const property = left.split(";")[0]!.toUpperCase();

    switch (property) {
      case "UID":
        current.uid = value;
        break;
      case "DTSTART":
        current.start = parseICalDate(value);
        break;
      case "DTEND":
        current.end = parseICalDate(value);
        break;
      case "SUMMARY":
        current.summary = unescapeText(value);
        break;
      case "STATUS":
        current.status = value.toUpperCase();
        break;
    }
  }
  return events;
}

function parseICalDate(value: string): Date {
  // YYYYMMDD (all-day) or YYYYMMDDTHHMMSSZ
  if (/^\d{8}$/.test(value)) {
    const y = Number(value.slice(0, 4));
    const m = Number(value.slice(4, 6)) - 1;
    const d = Number(value.slice(6, 8));
    // Treat as midnight Africa/Tunis → UTC offset -1h.
    return new Date(Date.UTC(y, m, d, -1, 0, 0));
  }
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (match) {
    return new Date(
      Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6]),
      ),
    );
  }
  // Fallback — let JS parse and live with whatever timezone offset comes back.
  return new Date(value);
}

function unescapeText(value: string): string {
  return value
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";");
}

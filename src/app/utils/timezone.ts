/**
 * Timezone utilities for Eastern Time (America/New_York).
 * Phi Gamma Nu operates at the University of Michigan (Ann Arbor, MI - Eastern Time Zone).
 * All application windows, deadlines, and events are normalized to Eastern Time.
 */

export const EASTERN_TIMEZONE = "America/New_York";

/**
 * Converts a stored UTC ISO string (e.g. "2026-09-10T18:30:00.000Z") into
 * "YYYY-MM-DDTHH:mm" in Eastern Time (America/New_York).
 * Used for binding <input type="datetime-local" value={...} />.
 */
export function toEasternDateTimeLocal(isoString: string | null | undefined): string {
  if (!isoString || typeof isoString !== "string") return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(isoString)) {
        return isoString.slice(0, 16);
      }
      return "";
    }
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: EASTERN_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const parts = formatter.formatToParts(d);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");
    const hour = getPart("hour");
    const minute = getPart("minute");
    if (!year || !month || !day || !hour || !minute) return "";
    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch {
    return "";
  }
}

/**
 * Converts a "YYYY-MM-DDTHH:mm" string from <input type="datetime-local" />
 * into a UTC ISO string, interpreting the input strictly in Eastern Time (America/New_York).
 */
export function fromEasternDateTimeLocal(localStr: string | null | undefined): string | null {
  if (!localStr || !localStr.trim()) return null;
  const trimmed = localStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  const [, yStr, mStr, dStr, hStr, minStr] = match;
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);
  const hour = parseInt(hStr, 10);
  const minute = parseInt(minStr, 10);

  // Treat nominal date as UTC
  const nominalUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // Determine what Eastern Time displays when UTC is nominalUtc
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(nominalUtc);
  const getPart = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);

  const easternAsUtc = new Date(
    Date.UTC(
      getPart("year"),
      getPart("month") - 1,
      getPart("day"),
      getPart("hour"),
      getPart("minute"),
      getPart("second")
    )
  );

  // Shift by the Eastern offset to get real UTC
  const offsetMs = nominalUtc.getTime() - easternAsUtc.getTime();
  const realUtc = new Date(nominalUtc.getTime() + offsetMs);

  return realUtc.toISOString();
}

/**
 * Formats an ISO date string for display in Eastern Time (e.g., "Sep 10, 2026, 2:30 PM EDT").
 */
export function formatEasternDateTime(
  isoString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-US", {
      timeZone: EASTERN_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      ...options,
    });
  } catch {
    return "";
  }
}

/**
 * Formats just the date in Eastern Time (e.g., "Sep 10, 2026").
 */
export function formatEasternDate(
  isoString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      timeZone: EASTERN_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric",
      ...options,
    });
  } catch {
    return "";
  }
}

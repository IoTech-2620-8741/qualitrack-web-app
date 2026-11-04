import { LABORATORY_TIME_ZONE } from './local-date';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_DAY = 86_400;

/** Formatters by locale; building an `Intl` formatter is expensive and these run on every change detection. */
const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();
const relativeTimeFormatters = new Map<string, Intl.RelativeTimeFormat>();

/**
 * Locale that formats the dates of an application language.
 *
 * @param language - The language of the application, for example `es`
 * @returns `es-PE` for Spanish and `en-US` for any other language
 */
function localeOf(language: string): string {
  return language.startsWith('es') ? 'es-PE' : 'en-US';
}

/**
 * Formats an instant the same way everywhere: in 24 hours, in the time zone of the laboratories.
 *
 * @param value - The instant to format
 * @param language - The language of the application
 * @returns For example `3 oct 2026, 09:00` or `Oct 3, 2026, 09:00`; an empty text when there is no valid instant
 *
 * @remarks
 * The dot that `es-PE` puts after the short month is removed, so the format matches the style guide.
 */
export function formatDateTime(value: string | Date | null | undefined, language: string): string {
  const instant = toValidDate(value);
  if (!instant) return '';
  const locale = localeOf(language);
  let formatter = dateTimeFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      timeZone: LABORATORY_TIME_ZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    dateTimeFormatters.set(locale, formatter);
  }
  return formatter.format(instant).replace('.', '');
}

/**
 * Tells how long ago an instant was, in the largest unit that fits.
 *
 * @param value - The instant to compare
 * @param language - The language of the application
 * @param now - The current instant; the current time by default
 * @returns For example `hace 28 días` or `5 minutes ago`; an empty text when there is no valid instant
 *
 * @remarks
 * An instant slightly ahead of the browser clock reads as the present.
 */
export function formatRelativeTime(
  value: string | Date | null | undefined,
  language: string,
  now: Date = new Date(),
): string {
  const instant = toValidDate(value);
  if (!instant) return '';
  const locale = localeOf(language);
  let formatter = relativeTimeFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    relativeTimeFormatters.set(locale, formatter);
  }
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - instant.getTime()) / 1000));
  if (elapsedSeconds < SECONDS_PER_MINUTE) return formatter.format(-elapsedSeconds, 'second');
  if (elapsedSeconds < SECONDS_PER_HOUR) {
    return formatter.format(-Math.floor(elapsedSeconds / SECONDS_PER_MINUTE), 'minute');
  }
  if (elapsedSeconds < SECONDS_PER_DAY) {
    return formatter.format(-Math.floor(elapsedSeconds / SECONDS_PER_HOUR), 'hour');
  }
  return formatter.format(-Math.floor(elapsedSeconds / SECONDS_PER_DAY), 'day');
}

/**
 * Reads an instant, discarding what is missing or cannot be read.
 *
 * @param value - The instant, as a date or as a text the `Date` constructor understands
 * @returns The date, or `null` when there is none
 */
function toValidDate(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

import { DateTime } from 'luxon';

export function convertToUTC(dateString: string, timezone: string): string | null {
  if(!dateString) return null;
  const localDate = DateTime.fromISO(dateString, { zone: timezone });
  return localDate.toUTC().toISO();
}
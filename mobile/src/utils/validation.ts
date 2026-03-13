const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function isValidIsoDate(value: string): boolean {
  const trimmedValue = value.trim();

  if (!ISO_DATE_PATTERN.test(trimmedValue)) {
    return false;
  }

  const [yearSegment, monthSegment, daySegment] = trimmedValue.split('-');
  const year = Number(yearSegment);
  const month = Number(monthSegment);
  const day = Number(daySegment);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function parsePositiveInteger(value: string): number | null {
  const trimmedValue = value.trim();

  if (!/^\d+$/.test(trimmedValue)) {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

export function parsePositiveNumber(value: string): number | null {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

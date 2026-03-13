const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function formatWith(
  formatter: Intl.DateTimeFormat,
  value: string | null | undefined,
  fallback = 'N/A'
): string {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return formatter.format(parsed);
}

export function formatDate(value: string | null | undefined, fallback = 'N/A'): string {
  return formatWith(dateFormatter, value, fallback);
}

export function formatDateTime(value: string | null | undefined, fallback = 'N/A'): string {
  return formatWith(dateTimeFormatter, value, fallback);
}

export function formatHours(value: number | null | undefined, fallback = 'N/A'): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return `${value.toFixed(1)} hrs`;
}

export function formatMinutes(value: number | null | undefined, fallback = 'N/A'): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatStatus(value: string | null | undefined): string {
  if (!value) {
    return 'Unknown';
  }

  return value
    .split('_')
    .map((segment) =>
      segment.length > 0 ? segment[0].toUpperCase() + segment.slice(1).toLowerCase() : segment
    )
    .join(' ');
}

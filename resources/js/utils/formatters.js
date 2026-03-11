export const formatDate = (value) => {
    if (!value) {
        return '-';
    }

    const parts = String(value).split('-');
    if (parts.length === 3) {
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const day = Number(parts[2]);
        const date = new Date(year, month - 1, day);

        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            });
        }
    }

    const fallback = new Date(value);
    if (!Number.isNaN(fallback.getTime())) {
        return fallback.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        });
    }

    return value;
};

export const formatTime = (value) => {
    if (!value) {
        return '-';
    }

    const parts = String(value).split(':');
    if (parts.length < 2) {
        return value;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return value;
    }

    const meridiem = hours >= 12 ? 'PM' : 'AM';
    const hour12 = ((hours + 11) % 12) + 1;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${meridiem}`;
};

export const formatHours = (value) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    const hours = Number(value);
    if (Number.isNaN(hours)) {
        return value;
    }
    return `${hours} hrs`;
};

export const formatMinutes = (value) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    const minutes = Number(value);
    if (Number.isNaN(minutes)) {
        return value;
    }
    return `${minutes} mins`;
};

export const formatDateTime = (value) => {
    if (!value) {
        return '-';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    const date = parsed.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    });
    const time = parsed.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    return `${date} • ${time}`;
};

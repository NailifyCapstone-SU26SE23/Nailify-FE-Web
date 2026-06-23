function normalizeMinutes(value) {
  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes < 0) {
    return null;
  }

  return Math.round(minutes);
}

export function formatDurationMinutes(value) {
  const minutes = normalizeMinutes(value);

  if (minutes === null) {
    return "--";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!remainingMinutes) {
    return `${hours}h`;
  }

  return `${hours}h${remainingMinutes}m`;
}

export function formatDurationLabel(value) {
  if (typeof value === "number") {
    return formatDurationMinutes(value);
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed === "--") {
    return trimmed;
  }

  const exactMatch = trimmed.match(/^(\d+)\s*(min|mins|minutes?)$/i);
  if (exactMatch) {
    return formatDurationMinutes(Number(exactMatch[1]));
  }

  return trimmed.replace(/(\d+)\s*(min|mins|minutes?)\b/gi, (_, minutes) =>
    formatDurationMinutes(Number(minutes)),
  );
}

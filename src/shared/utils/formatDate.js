export function formatDate(value, locale = "en-US", options = {}) {
  if (!value) return "";

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(value));
}

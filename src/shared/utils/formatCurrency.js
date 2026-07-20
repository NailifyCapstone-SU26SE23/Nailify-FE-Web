export function formatCurrency(value, currency = "VND", locale = "vi-VN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

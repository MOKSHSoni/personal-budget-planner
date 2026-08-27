const LOCALES = { INR: "en-IN", USD: "en-US", EUR: "de-DE", GBP: "en-GB", JPY: "ja-JP" };

export function formatCurrency(value, currency = "INR") {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat(LOCALES[currency] || "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatMonth(month) {
  if (!month) return "";
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value).slice(0, 10) : d.toLocaleDateString("en-GB");
}

export function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value).slice(0, 10) : d.toISOString().slice(0, 10);
}

export const CURRENCIES = Object.keys(LOCALES);

export const CATEGORIES = [
  "Веб-таҳия",
  "Мобилӣ",
  "Дизайн",
  "Тарҷума",
  "Маркетинг",
  "Навиштан",
  "Дигар",
];

export function formatMoney(n: number) {
  return somoni(n);
}

export function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("tg-TJ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function statusLabel(status: string) {
  switch (status) {
    case "OPEN":
      return "Кушода";
    case "IN_PROGRESS":
      return "Дар ҷараён";
    case "COMPLETED":
      return "Анҷомёфта";
    case "PENDING":
      return "Интизорӣ";
    case "ACCEPTED":
      return "Қабулшуда";
    case "REJECTED":
      return "Радшуда";
    default:
      return status;
  }
}

export function parseSkills(s: string) {
  return s
    .split(/[,،\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function somoni(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n).replace(/\u00a0/g, " ") + " сомонӣ";
}

export function timeAgo(d: Date | string) {
  const t = typeof d === "string" ? new Date(d) : d;
  const s = Math.max(1, Math.floor((Date.now() - t.getTime()) / 1000));
  if (s < 60) return "ҳозир";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} дақиқа пеш`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} соат пеш`;
  const dd = Math.floor(h / 24);
  if (dd < 30) return `${dd} рӯз пеш`;
  return `${Math.floor(dd / 30)} моҳ пеш`;
}

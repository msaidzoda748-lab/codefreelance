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
  return new Intl.NumberFormat("tg-TJ").format(n) + " сом";
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

import type { Dict } from "@/i18n";
/** Home category chips → stored Project.category values. */
export type CatKey = keyof Omit<Dict["cats"], "label">;
export const HOME_CATEGORIES: { key: CatKey; values: string[]; tone: string }[] = [
  { key: "all", values: [], tone: "emerald" },
  { key: "web", values: ["Веб-таҳия"], tone: "emerald" },
  { key: "design", values: ["Дизайн"], tone: "purple" },
  { key: "dev", values: ["Мобилӣ", "Барномасозӣ"], tone: "sky" },
  { key: "bots", values: ["Ботҳо"], tone: "amber" },
  { key: "marketing", values: ["Маркетинг"], tone: "orange" },
];
export function catKeyOf(category: string): CatKey {
  return HOME_CATEGORIES.find((c) => c.values.includes(category))?.key ?? "all";
}

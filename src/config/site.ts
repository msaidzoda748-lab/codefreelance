/** Change the brand name in ONE place. */
export const SITE = {
  name: "Zoir Freelance",
  nameParts: ["Zoir", "Freelance"] as [string, string],
  supportEmail: "support@zoirfreelance.tj",
  city: "Душанбе, Тоҷикистон",
};
export const LANGS = ["tj", "ru", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_COOKIE = "cf-lang";

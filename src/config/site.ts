/** Change the brand name in ONE place. */
export const SITE = {
  name: "CodeFreelance",
  nameParts: ["Code", "Freelance"] as [string, string],
  supportEmail: "support@codefreelance.tj",
  city: "Душанбе, Тоҷикистон",
};
export const LANGS = ["tj", "ru", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_COOKIE = "cf-lang";

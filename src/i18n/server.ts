import { cookies } from "next/headers";
import { LANGS, LANG_COOKIE, type Lang } from "@/config/site";
import { dictionaries } from ".";
export function getLang(): Lang {
  const v = cookies().get(LANG_COOKIE)?.value as Lang | undefined;
  return v && (LANGS as readonly string[]).includes(v) ? v : "tj";
}
export function getDict() { return dictionaries[getLang()]; }

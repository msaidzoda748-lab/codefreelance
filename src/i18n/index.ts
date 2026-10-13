import tj, { type Dict } from "./tj";
import ru from "./ru";
import en from "./en";
import type { Lang } from "@/config/site";
export const dictionaries: Record<Lang, Dict> = { tj, ru, en };
export type { Dict };

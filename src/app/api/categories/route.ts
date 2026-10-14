import { NextResponse } from "next/server";
import { activeCategories } from "@/lib/queries/projects";

export const dynamic = "force-dynamic";
/** Public list of active categories (used by the quick "Post project" modal). */
export async function GET() {
  const cats = await activeCategories();
  return NextResponse.json({ items: cats.map((c) => ({ id: c.id, slug: c.slug, nameTj: c.nameTj, nameRu: c.nameRu, nameEn: c.nameEn })) });
}

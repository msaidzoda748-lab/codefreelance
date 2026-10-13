import { ApiError, str } from "./api";

export function parsePortfolio(b: Record<string, unknown>) {
  const title = str(b.title, 160);
  const link = str(b.link, 300);
  if (title.length < 2) throw new ApiError("invalid", 400, { fields: { title: "min2" } });
  if (link && !/^https?:\/\//i.test(link)) throw new ApiError("invalid", 400, { fields: { link: "required" } });
  const images = (Array.isArray(b.images) ? b.images.map(String) : str(b.images, 2000).split("\n")).map((s) => s.trim()).filter((s) => s.startsWith("/") || /^https?:\/\//.test(s)).slice(0, 6);
  return { title, description: str(b.description, 3000), tech: str(b.tech, 300), link: link || null, images: images.join("\n") };
}

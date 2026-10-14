/** Add Cloudinary auto format/quality + width transform; other URLs pass through. */
export function optImg(url: string | null | undefined, w = 800): string {
  if (!url) return "";
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/);
  if (!m || /^(f_|q_|w_|c_)/.test(m[2])) return url;
  return `${m[1]}f_auto,q_auto,c_limit,w_${w}/${m[2]}`;
}

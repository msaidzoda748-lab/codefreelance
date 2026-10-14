export const PWA_DISMISS_KEY = "cf-pwa-dismissed";
export const DISMISS_DAYS = 14;
export function isIos(ua: string) {
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && /mobile/i.test(ua));
}
export function isIosSafari(ua: string) {
  return isIos(ua) && /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
}
export function dismissedRecently(value: string | null, now = Date.now()) {
  const ts = value ? Number(value) : NaN;
  return Number.isFinite(ts) && now - ts < DISMISS_DAYS * 86400_000;
}
export function shouldRegisterSW(env: string | undefined, hasSW: boolean) {
  return env === "production" && hasSW;
}

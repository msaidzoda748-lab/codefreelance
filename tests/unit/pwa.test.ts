import { describe, it, expect } from "vitest";
import manifest from "@/app/manifest";
import { isIosSafari, dismissedRecently, shouldRegisterSW } from "@/lib/pwa";
describe("pwa", () => {
  it("manifest is installable", () => {
    const m = manifest();
    expect(m).toMatchObject({ name: "CodeFreelance", short_name: "CodeFreelance", display: "standalone", start_url: "/", theme_color: "#059669", background_color: "#F8FAF9" });
    const sizes = (m.icons || []).map((i) => i.sizes);
    expect(sizes).toContain("192x192"); expect(sizes).toContain("512x512");
  });
  it("detects iOS Safari only", () => {
    expect(isIosSafari("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1")).toBe(true);
    expect(isIosSafari("Mozilla/5.0 (iPhone) AppleWebKit CriOS/120 Mobile Safari/604.1")).toBe(false);
    expect(isIosSafari("Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537.36")).toBe(false);
  });
  it("dismiss window", () => {
    const now = 1_000_000_000_000;
    expect(dismissedRecently(String(now - 86400_000), now)).toBe(true);
    expect(dismissedRecently(String(now - 30 * 86400_000), now)).toBe(false);
    expect(dismissedRecently(null, now)).toBe(false);
  });
  it("SW only in production", () => {
    expect(shouldRegisterSW("production", true)).toBe(true);
    expect(shouldRegisterSW("development", true)).toBe(false);
    expect(shouldRegisterSW("production", false)).toBe(false);
  });
});

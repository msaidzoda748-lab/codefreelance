import { describe, expect, it } from "vitest";
import { checkWorkUrl, parseTech, parseWork } from "@/lib/works";

describe("work links", () => {
  it("accepts https and normalizes", () => {
    expect(checkWorkUrl("link", "https://example.tj").value).toBe("https://example.tj/");
    expect(checkWorkUrl("sourceUrl", "").value).toBeNull();
  });
  it("rejects http, javascript and junk", () => {
    expect(checkWorkUrl("link", "http://example.tj").error).toBe("https");
    expect(checkWorkUrl("link", "javascript:alert(1)").error).toBe("https");
    expect(checkWorkUrl("link", "https://localhost").error).toBe("https");
    expect(checkWorkUrl("link", "https://u:p@example.tj").error).toBe("https");
    expect(checkWorkUrl("downloadUrl", "not a url").error).toBe("https");
  });
  it("checks store hosts", () => {
    expect(checkWorkUrl("appStoreUrl", "https://apps.apple.com/app/id1").error).toBeUndefined();
    expect(checkWorkUrl("appStoreUrl", "https://evil.com/app").error).toBe("host");
    expect(checkWorkUrl("playUrl", "https://play.google.com/store/apps/details?id=x").error).toBeUndefined();
    expect(checkWorkUrl("playUrl", "https://play.google.com.evil.io/x").error).toBe("host");
  });
});

describe("parseWork", () => {
  it("parses a valid payload", () => {
    const w = parseWork({ title: "Shop app", tech: "React, Node, React", images: ["/uploads/a.png", "javascript:x", "https://cdn.tj/b.png"], link: "https://shop.tj" });
    expect(w.tech).toBe("React, Node");
    expect(w.images).toBe("/uploads/a.png\nhttps://cdn.tj/b.png");
    expect(w.link).toBe("https://shop.tj/");
  });
  it("reports field errors", () => {
    try { parseWork({ title: "x", playUrl: "https://x.com" }); throw new Error("no"); }
    catch (e) { expect((e as { extra?: { fields: Record<string, string> } }).extra?.fields).toMatchObject({ title: "min3", playUrl: "host" }); }
  });
  it("limits tech list", () => { expect(parseTech(Array.from({ length: 30 }, (_, i) => "t" + i).join(",")).split(", ").length).toBe(15); });
});

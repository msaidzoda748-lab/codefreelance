import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "screenshots/v6"; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
async function as(email, w = 1440, h = 900) {
  const ctx = await b.newContext({ baseURL: BASE, viewport: { width: w, height: h }, reducedMotion: "reduce", extraHTTPHeaders: { "x-forwarded-for": `10.202.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` } });
  if (email) { const r = await ctx.request.post("/api/auth/login", { data: { email, password: "password123" } }); if (!r.ok()) throw new Error(`login ${email} ${r.status()}`); }
  return ctx;
}
const shot = async (ctx, path, file, full = true) => { const p = await ctx.newPage(); await p.goto(path, { waitUntil: "load" }); await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/${file}`, fullPage: full }); await p.close(); };
const anon = await as(null);
await shot(anon, "/works", "gallery-1440.png");
const p = await anon.newPage(); await p.goto("/works?q=Food", { waitUntil: "load" }); const href = await p.locator('[data-testid="work-card"] a').first().getAttribute("href"); await p.close();
await shot(anon, href, "work-detail-1440.png");
const f = await as("mobile@demo.tj");
await shot(f, "/works/new", "create-work-form-1440.png");
const m = await as(null, 390, 844); await shot(m, "/works", "gallery-390-mobile.png", false);
console.log("ok", href); await b.close();

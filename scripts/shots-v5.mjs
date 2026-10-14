import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "screenshots/v5"; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
async function as(email, w = 1440, h = 900) {
  const ctx = await b.newContext({ baseURL: BASE, viewport: { width: w, height: h }, reducedMotion: "reduce", extraHTTPHeaders: { "x-forwarded-for": `10.201.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` } });
  if (email) { const r = await ctx.request.post("/api/auth/login", { data: { email, password: "password123" } }); if (!r.ok()) throw new Error(`login ${email} ${r.status()}`); }
  return ctx;
}
const shot = async (ctx, path, file, full = true) => { const p = await ctx.newPage(); await p.goto(path, { waitUntil: "load" }); await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/${file}`, fullPage: full }); await p.close(); };
const href = async (ctx, path, sel) => { const p = await ctx.newPage(); await p.goto(path, { waitUntil: "load" }); const h = await p.locator(sel).first().getAttribute("href"); await p.close(); return h; };
const anon = await as(null);
await shot(anon, "/", "home-1440.png");
await shot(anon, "/projects", "projects-list-1440.png");
await shot(anon, await href(anon, "/projects", 'a[href^="/projects/c"]'), "project-detail-1440.png");
const f = await as("freelancer@demo.tj");
await shot(f, "/freelancers/" + (await (await f.request.get("/api/account")).json()).user.id, "freelancer-profile-1440.png");
const c = await as("client@demo.tj");
await shot(c, "/dashboard", "client-dashboard-1440.png");
await shot(c, await href(c, "/messages", 'a[href^="/messages/"]'), "chat-1440.png", false);
await shot(c, await href(c, "/dashboard", 'a[href^="/orders/"]'), "order-milestones-1440.png");
const m = await as(null, 390, 844); await shot(m, "/", "home-390-mobile.png", false);
console.log("ok"); await b.close();

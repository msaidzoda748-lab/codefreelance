import { chromium } from "playwright-core";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "screenshots/v4";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
async function as(email, w = 1440, h = 900) {
  const ctx = await b.newContext({ baseURL: BASE, viewport: { width: w, height: h }, extraHTTPHeaders: { "x-forwarded-for": `10.200.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` } });
  if (email) { const r = await ctx.request.post("/api/auth/login", { data: { email, password: "password123" } }); if (!r.ok()) throw new Error(`login ${email} ${r.status()}`); }
  return ctx;
}
const shot = async (ctx, path, file, full = true) => { const p = await ctx.newPage(); await p.goto(path, { waitUntil: "load" }); await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}/${file}`, fullPage: full }); await p.close(); };
const c = await as("client@demo.tj"); await shot(c, "/dashboard", "dashboard-client-1440.png");
const ord = null;
const pf = await c.newPage(); await pf.goto("/dashboard", { waitUntil: "load" });
const orderHref = await pf.locator('a[href^="/orders/"]').first().getAttribute("href");
await shot(c, orderHref, "order-milestones-1440.png");
const projHref = await pf.locator('a[href^="/projects/c"]').first().getAttribute("href"); await pf.close();
const conv = await c.newPage(); await conv.goto("/messages", { waitUntil: "load" });
const convHref = await conv.locator('a[href^="/messages/"]').first().getAttribute("href"); await conv.close();
await shot(c, convHref, "chat-1440.png", false);
const f = await as("freelancer@demo.tj"); await shot(f, "/dashboard", "dashboard-freelancer-1440.png");
await shot(f, "/freelancers/" + (await (await f.request.get("/api/account")).json()).user.id, "profile-freelancer-1440.png");
const a = await as("admin@demo.tj"); await shot(a, "/admin", "admin-stats-1440.png"); await shot(a, "/admin?tab=reports", "admin-reports-1440.png"); await shot(a, "/admin?tab=audit", "admin-audit-1440.png");
const anon = await as(null); await shot(anon, "/projects", "projects-list-1440.png");
const m = await as(null, 390, 844); await shot(m, "/", "mobile-390-home.png", false); await shot(m, "/projects", "mobile-390-projects.png", false);
console.log("ok", projHref, orderHref, convHref, ord);
await b.close();

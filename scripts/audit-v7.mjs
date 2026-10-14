// Responsive audit v7. BASE=... OUT=before|after node scripts/audit-v7.mjs
import { chromium } from "playwright-core";
import fs from "fs";
const BASE = process.env.BASE || "http://localhost:3000";
const OUT = "screenshots/v7/" + (process.env.OUT || "after"); fs.mkdirSync(OUT, { recursive: true });
const WIDTHS = (process.env.W || "360,390,414,768,1024,1280,1366,1440").split(",").map(Number);
const SHOTS = new Set(["home-390","home-1366","projects-390","projects-1366","chat-390","chat-1366","admin-390","admin-1366","project-390","freelancers-390","profile-390","works-390","work-390","worknew-390","login-390","dashboard-390","dashboard-1366","messages-390","orders-390","notifications-390","newproject-390","home-768","admin-768","chat-768"]);
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const issues = [];
async function ctxFor(w, email) {
  const mobile = w < 768;
  const ctx = await b.newContext({ baseURL: BASE, viewport: { width: w, height: mobile ? 800 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1, reducedMotion: "reduce", extraHTTPHeaders: { "x-forwarded-for": `10.77.${w % 250}.${Math.floor(Math.random()*250)}` } });
  if (email) { const r = await ctx.request.post("/api/auth/login", { data: { email, password: "password123" } }); if (!r.ok()) throw new Error("login " + r.status()); }
  return ctx;
}
const base = await ctxFor(1440, "admin@demo.tj"); const bp = await base.newPage();
const ids = await bp.evaluate(async () => {
  const j = async (u) => { try { return await (await fetch(u)).json(); } catch { return null; } };
  return { };
});
await bp.goto(BASE + "/projects"); const proj = await bp.locator('a[href^="/projects/"]:not([href="/projects/new"])').first().getAttribute("href");
await bp.goto(BASE + "/freelancers"); const fl = await bp.locator('a[href^="/freelancers/"]').first().getAttribute("href");
await bp.goto(BASE + "/works"); const wk = await bp.locator('a[href^="/works/"]:not([href="/works/new"])').first().getAttribute("href");
await base.close();
const cl = await ctxFor(1440, "client@demo.tj"); const cp = await cl.newPage();
await cp.goto(BASE + "/messages"); await cp.waitForTimeout(800);
const chat = await cp.locator('a[href^="/messages/"], a[href*="/chat"]').first().getAttribute("href").catch(() => null);
await cp.goto(BASE + "/dashboard"); await cp.waitForTimeout(800);
const order = await cp.locator('a[href^="/orders/"]').first().getAttribute("href").catch(() => null);
await cl.close();
console.log({ proj, fl, wk, chat, order });
const pages = [
  ["home", "/", null], ["projects", "/projects", null], ["project", proj, "freelancer@demo.tj"], ["freelancers", "/freelancers", null], ["profile", fl, null],
  ["works", "/works", null], ["work", wk, null], ["worknew", "/works/new", "freelancer@demo.tj"], ["login", "/login", null], ["register", "/register", null],
  ["dashboard", "/dashboard", "client@demo.tj"], ["messages", "/messages", "client@demo.tj"], ["chat", chat, "client@demo.tj"], ["orders", order, "client@demo.tj"],
  ["notifications", "/notifications", "client@demo.tj"], ["newproject", "/projects/new", "client@demo.tj"], ["account", "/account", "client@demo.tj"], ["admin", "/admin", "admin@demo.tj"],
].filter((x) => x[1]);
for (const w of WIDTHS) {
  const ctxs = {};
  for (const [name, url, who] of pages) {
    const key = who || "anon"; ctxs[key] ||= await ctxFor(w, who);
    const p = await ctxs[key].newPage();
    try { await p.goto(BASE + url, { waitUntil: "load", timeout: 60000 }); } catch (e) { issues.push(`${w} ${name} load ${e.message}`); }
    await p.waitForTimeout(700);
    const r = await p.evaluate((w) => {
      const out = { ov: document.documentElement.scrollWidth - innerWidth, wide: [], small: [], clip: [] };
      for (const e of document.querySelectorAll("body *")) {
        const s = getComputedStyle(e); if (s.display === "none" || s.visibility === "hidden") continue;
        const r = e.getBoundingClientRect(); if (!r.width) continue;
        let anc = e.parentElement, scroller = false; while (anc) { const o = getComputedStyle(anc).overflowX; if (o === "auto" || o === "scroll" || o === "hidden") { scroller = true; break; } anc = anc.parentElement; }
        if (!scroller && r.right > innerWidth + 1 && out.wide.length < 6) out.wide.push(`${e.tagName}.${(e.className?.baseVal ?? e.className).toString().slice(0,50)} r=${Math.round(r.right)}`);
        if (w < 768 && (e.matches("a,button,input,select,textarea,[role=button]")) && r.height < 40 && r.height > 0 && !e.closest("p,li>span,footer") && !(e.tagName==="A" && s.display==="inline") && !(e.type==="checkbox"||e.type==="radio"||e.type==="file") && out.small.length < 12) out.small.push(`${e.tagName}:${(e.getAttribute("aria-label")||e.textContent||e.name||"").trim().slice(0,18)}=${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      return out;
    }, w);
    if (r.ov > 0) issues.push(`${w} ${name} OVERFLOW ${r.ov}px ${r.wide.join(" | ")}`);
    if (r.small.length) issues.push(`${w} ${name} small: ${r.small.join(", ")}`);
    if (SHOTS.has(`${name}-${w}`)) await p.screenshot({ path: `${OUT}/${name}-${w}.png`, fullPage: name !== "chat" });
    await p.close();
  }
  for (const c of Object.values(ctxs)) await c.close();
}
fs.writeFileSync(`${OUT}/audit.txt`, issues.join("\n") + "\n");
console.log(issues.join("\n")); console.log("issues:", issues.length);
await b.close();

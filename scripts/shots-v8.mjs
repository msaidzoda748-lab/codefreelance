// v8 desktop shots. BASE=... OUT=prefix W=1024,... LOGIN=email node scripts/shots-v8.mjs
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const BASE=process.env.BASE||"http://localhost:3100";
for (const w of (process.env.W||"1024,1280,1366,1440").split(",").map(Number)) {
  const ctx = await b.newContext({ baseURL: BASE, viewport: { width: w, height: 800 }, locale: "ru-RU" });
  await ctx.addCookies([{ name: "cf-lang", value: "ru", url: BASE }]);
  if (process.env.LOGIN) await ctx.request.post("/api/auth/login", { data: { email: process.env.LOGIN, password: "password123" } });
  const p = await ctx.newPage();
  await p.goto(BASE+"/", { waitUntil: "load", timeout: 60000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(() => { const h=document.querySelector("header > div"); const r=[...h.querySelectorAll("a,button")].map(e=>e.getBoundingClientRect().right); return {sw:document.documentElement.scrollWidth, maxRight:Math.max(...r), hsw:h.scrollWidth, hcw:h.clientWidth}; });
  console.log(w, JSON.stringify(o));
  await p.screenshot({ path: (process.env.OUT||"/tmp/loc")+`-${w}.png` });
  await ctx.close();
}
await b.close();

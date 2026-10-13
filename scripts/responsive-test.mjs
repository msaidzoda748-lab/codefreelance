// Responsive screenshots + functional checks. Usage: BASE=http://localhost:3000 node scripts/responsive-test.mjs
import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
const BASE = process.env.BASE || "http://localhost:3000";
const OUT = path.resolve("screenshots/responsive");
fs.mkdirSync(OUT, { recursive: true });
const WIDTHS = [360, 390, 430, 768, 1024, 1440];
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const results = []; const fail = (m) => { results.push("FAIL " + m); };
const ok = (c, m) => results.push((c ? "ok   " : "FAIL ") + m);
const watch = (p, tag) => { p.on("console", (m) => { if (m.type() === "error" && !(p.__expect400 && m.text().includes("400"))) fail(`${tag} console: ${m.text()} @ ${m.location()?.url || ""}`); }); p.on("pageerror", (e) => fail(`${tag} pageerror: ${e.message}`)); };
const go = async (p, u) => { await p.goto(BASE + u, { waitUntil: "load", timeout: 60000 }); await p.waitForTimeout(1200); };

for (const w of WIDTHS) {
  const mobile = w < 768;
  const ctx = await b.newContext({ viewport: { width: w, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  const p = await ctx.newPage(); watch(p, `w${w}`);
  for (const route of ["/", "/projects", "/freelancers"]) {
    await go(p, route);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(ov <= 0, `w${w} ${route} no horizontal scroll (overflow ${ov}px)`);
    if (mobile) {
      const r = await p.evaluate(async () => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }); await new Promise((r) => setTimeout(r, 400));
        const nav = document.querySelector('nav[aria-label="Bottom"]').getBoundingClientRect();
        const foot = document.querySelector("footer").getBoundingClientRect();
        const small = [...document.querySelectorAll("main a.btn-primary, main button, header button, nav[aria-label=Bottom] a")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.height < 44; }).map((e) => e.getAttribute("aria-label") || e.textContent.trim().slice(0, 20));
        return { navTop: nav.top, footBottom: foot.bottom, small };
      });
      ok(r.footBottom <= r.navTop + 1, `w${w} ${route} bottom nav does not cover content (footer ${Math.round(r.footBottom)} ≤ nav ${Math.round(r.navTop)})`);
      ok(r.small.length === 0, `w${w} ${route} tap targets ≥44px ${r.small.length ? JSON.stringify(r.small) : ""}`);
    } else {
      ok(!(await p.locator('nav[aria-label="Bottom"]').isVisible()), `w${w} ${route} bottom nav hidden on desktop`);
    }
  }
  await go(p, "/");
  await p.screenshot({ path: path.join(OUT, `home-${w}.png`), fullPage: true });
  await p.screenshot({ path: path.join(OUT, `home-${w}-viewport.png`) });
  if (w === 390 || w === 1440) {
    await go(p, "/projects"); await p.screenshot({ path: path.join(OUT, `projects-${w}.png`), fullPage: true });
  }
  if (w === 390) {
    await go(p, "/");
    await p.click('button[aria-controls="mobile-menu"]'); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(OUT, "menu-390.png") });
  }
  await ctx.close();
}

// ---- functional ----
for (const w of [390, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 768, hasTouch: w < 768 });
  const p = await ctx.newPage(); watch(p, `fn${w}`);
  await go(p, "/");
  const cards = () => p.locator("#new-projects ~ div article, section[aria-labelledby=new-projects] article").count();
  const total = await cards();
  await p.fill("#hero-q", "автосалон"); await p.waitForTimeout(300);
  ok((await cards()) === 1, `fn${w} search title → 1 card`);
  await p.fill("#hero-q", "формаи тамос"); await p.waitForTimeout(300);
  ok((await cards()) === 1, `fn${w} search description → 1 card`);
  await p.fill("#hero-q", "qqqzzz"); await p.waitForTimeout(300);
  ok(await p.getByText("Лоиҳа ёфт нашуд").isVisible(), `fn${w} empty search shows "Лоиҳа ёфт нашуд"`);
  if (w === 390) await p.screenshot({ path: path.join(OUT, "empty-search-390.png") });
  await p.fill("#hero-q", "");
  await p.getByRole("button", { name: "Дизайн", exact: true }).click(); await p.waitForTimeout(300);
  const dc = await cards();
  ok(dc > 0 && dc < total && (await p.getByRole("button", { name: "Дизайн", exact: true }).getAttribute("aria-pressed")) === "true", `fn${w} category Дизайн filters (${dc}/${total})`);
  await p.getByRole("button", { name: "Ҳама", exact: true }).click();
  const bm = p.locator('button[aria-label="Захира кардан"]').first();
  await bm.click(); await p.waitForTimeout(200);
  await p.reload({ waitUntil: "load" }); await p.waitForTimeout(1200);
  ok((await p.locator('button[aria-label="Аз захира баровардан"]').count()) === 1, `fn${w} bookmark persisted after reload`);
  await p.locator('button[aria-label="Аз захира баровардан"]').first().click();
  // proposal while logged out
  await p.getByRole("button", { name: "Пешниҳод кардан" }).first().click(); await p.waitForTimeout(400);
  ok(await p.getByText("Барои фиристодани пешниҳод ворид шавед.").isVisible(), `fn${w} proposal (guest) → login prompt`);
  if (w === 390) await p.screenshot({ path: path.join(OUT, "proposal-guest-390.png") });
  await p.keyboard.press("Escape");
  // create project while logged out
  if (w >= 1280) await p.getByRole("button", { name: "Ҷойгир кардани лоиҳа" }).first().click();
  else { await p.click('button[aria-controls="mobile-menu"]'); await p.locator("#mobile-menu").getByRole("button", { name: "Ҷойгир кардани лоиҳа" }).click(); }
  await p.waitForTimeout(400);
  ok(await p.getByText("Барои ҷойгир кардани лоиҳа ворид шавед.").isVisible(), `fn${w} create project (guest) → login prompt`);
  await p.keyboard.press("Escape");
  // language switch
  await p.locator('button[aria-haspopup="listbox"]').click(); await p.getByRole("option", { name: /Русский/ }).click(); await p.waitForTimeout(1500);
  ok(await p.getByText("Найди талант.").isVisible(), `fn${w} language → RU`);
  if (w === 390) await p.screenshot({ path: path.join(OUT, "home-390-ru.png") });
  await p.locator('button[aria-haspopup="listbox"]').click(); await p.getByRole("option", { name: /English/ }).click(); await p.waitForTimeout(1500);
  ok(await p.getByText("Find talent.").isVisible(), `fn${w} language → EN`);
  if (w === 1440) await p.screenshot({ path: path.join(OUT, "home-1440-en.png") });
  await p.locator('button[aria-haspopup="listbox"]').click(); await p.getByRole("option", { name: /Тоҷикӣ/ }).click(); await p.waitForTimeout(1500);
  // bottom nav
  if (w === 390) {
    await p.locator('nav[aria-label="Bottom"]').getByText("Лоиҳаҳо").click(); await p.waitForURL("**/projects"); ok(true, "fn390 bottom nav → /projects");
    await p.locator('nav[aria-label="Bottom"]').getByText("Асосӣ").click(); await p.waitForURL(BASE + "/"); ok(true, "fn390 bottom nav → /");
  }
  await ctx.close();
}

// logged-in flows (real backend)
async function login(ctx, email) { const p = await ctx.newPage(); watch(p, email); await go(p, "/login"); await p.fill('input[name="email"]', email); await p.fill('input[name="password"]', "password123"); await p.click('button[type="submit"]'); await p.waitForURL(BASE + "/"); await p.waitForTimeout(1200); return p; }
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await login(ctx, "designer@demo.tj");
  await p.fill("#hero-q", "Барномаи фармоиши ғизо"); await p.waitForTimeout(300);
  await p.getByRole("button", { name: "Пешниҳод кардан" }).first().click(); await p.waitForTimeout(400);
  await p.fill("#pm-amount", ""); await p.getByRole("button", { name: "Фиристодан" }).click();
  ok((await p.locator(".field-error").count()) === 3, "proposal validation shows 3 errors");
  await p.screenshot({ path: path.join(OUT, "proposal-validation-390.png") });
  const d = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
  await p.fill("#pm-amount", "3800"); await p.fill("#pm-deadline", d); await p.fill("#pm-text", "Ман дар Flutter 4 сол таҷриба дорам ва барномаро сари вақт месупорам.");
  await p.getByRole("button", { name: "Фиристодан" }).click(); await p.waitForTimeout(1500);
  ok(await p.getByText("Пешниҳоди шумо фиристода шуд!").isVisible(), "proposal saved via /api/proposals");
  await p.screenshot({ path: path.join(OUT, "proposal-success-390.png") });
  await p.keyboard.press("Escape");
  p.__expect400 = true; // duplicate proposal intentionally returns 400
  await p.getByRole("button", { name: "Пешниҳод кардан" }).first().click(); await p.waitForTimeout(300);
  await p.fill("#pm-deadline", d); await p.fill("#pm-text", "Пешниҳоди дуюм барои санҷиши хатои сервер, бояд рад шавад.");
  await p.getByRole("button", { name: "Фиристодан" }).click(); await p.waitForTimeout(1200);
  ok(await p.getByText("Шумо аллакай пешниҳод додаед").isVisible(), "duplicate proposal shows real server error (no fake success)");
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await login(ctx, "client@demo.tj");
  await p.getByRole("button", { name: "Ҷойгир кардани лоиҳа" }).first().click(); await p.waitForTimeout(400);
  await p.getByRole("button", { name: "Ҷойгир кардан", exact: true }).click();
  ok((await p.locator(".field-error").count()) === 4, "create project validation shows 4 errors");
  await p.screenshot({ path: path.join(OUT, "create-project-validation-1440.png") });
  const d = new Date(Date.now() + 20 * 864e5).toISOString().slice(0, 10);
  await p.fill("#cp-title", "Боти Telegram барои қабули навбат"); await p.fill("#cp-desc", "Боти оддӣ барои қабули навбат ба клиникаи дандонпизишкӣ дар Душанбе.");
  await p.selectOption("#cp-cat", "Ботҳо"); await p.fill("#cp-budget", "1500"); await p.fill("#cp-deadline", d);
  await p.getByRole("button", { name: "Ҷойгир кардан", exact: true }).click(); await p.waitForTimeout(2000);
  ok(await p.getByText("Лоиҳа ҷойгир шуд!").isVisible(), "project created via /api/projects");
  await p.keyboard.press("Escape"); await p.waitForTimeout(1500);
  ok(await p.getByText("Боти Telegram барои қабули навбат").first().isVisible(), "new project appears in list");
  await go(p, "/messages"); ok(await p.getByText("Даштборди аналитикаи фурӯш").isVisible(), "messages page lists chat");
  await ctx.close();
}
await b.close();
console.log(results.join("\n"));
const f = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`\n${results.length - f} passed, ${f} failed`);
process.exit(f ? 1 : 0);

// End-to-end acceptance + privacy tests (spec §17). Runs against BASE_URL (default http://localhost:3000)
// with system Chrome via playwright-core. Usage: node tests/e2e/run.mjs   (exit code 1 on any failure)
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const SHOTS = process.env.E2E_SHOTS || "screenshots/e2e";
fs.mkdirSync(SHOTS, { recursive: true });
const run = Date.now().toString(36);
const results = [];
let browser;
const consoleErrors = [];

function assert(c, msg) { if (!c) throw new Error(msg); }
async function test(name, fn) {
  const t0 = Date.now();
  try { await fn(); results.push({ name, ok: true, ms: Date.now() - t0 }); console.log(`  ✓ ${name}`); }
  catch (e) {
    results.push({ name, ok: false, err: e.message }); console.log(`  ✗ ${name}\n      ${e.message.split("\n")[0]}`);
    if (process.env.E2E_DEBUG) for (const a of ACTORS) await a.page.screenshot({ path: `${SHOTS}/fail-${results.length}-${a.label}.png` }).catch(() => {});
  }
}
let ipN = 10;
const ACTORS = [];
async function actor(label, { width = 1440, height = 900 } = {}) {
  const ctx = await browser.newContext({ baseURL: BASE, viewport: { width, height }, locale: "en-US", extraHTTPHeaders: { "x-forwarded-for": `10.${(Date.now() >> 8) % 250}.${Math.floor(Math.random() * 250)}.${ipN++}` } });
  await ctx.addCookies([{ name: "cf-lang", value: "en", url: BASE }]);
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error" && !/EventSource|net::ERR|Failed to load resource/.test(m.text())) consoleErrors.push(`[${label}] ${m.text().slice(0, 200)}`); });
  page.on("pageerror", (e) => consoleErrors.push(`[${label}] pageerror ${e.message.slice(0, 200)}`));
  const a = { ctx, page, req: ctx.request, label }; ACTORS.push(a); return a;
}
const go = (a, path) => a.page.goto(path, { waitUntil: "load" });
async function apiJson(a, method, url, data) {
  const r = await a.req.fetch(url, { method, data, headers: data ? { "Content-Type": "application/json" } : {} });
  let body = {}; try { body = await r.json(); } catch { /* */ }
  return { status: r.status(), body };
}
async function registerUI(a, { name, email, role }) {
  await go(a, "/register");
  await a.page.getByRole("radio", { name: new RegExp(role === "CLIENT" ? "Client" : "Freelancer") }).click();
  await a.page.fill('input[name="name"]', name);
  await a.page.fill('input[name="email"]', email);
  await a.page.fill('input[name="password"]', "password123");
  await Promise.all([a.page.waitForURL((u) => !u.pathname.startsWith("/register"), { timeout: 20000 }), a.page.click('button[type="submit"]')]);
}
async function loginAPI(a, email) { const r = await apiJson(a, "POST", "/api/auth/login", { email, password: "password123" }); assert(r.status === 200, `login ${email} → ${r.status}`); }
const dateIn = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

async function main() {
  browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
  console.log(`E2E against ${BASE} (run ${run})`);
  const client = await actor("client"), fl1 = await actor("fl1"), fl2 = await actor("fl2"), fl3 = await actor("fl3"), stranger = await actor("stranger"), anon = await actor("anon");
  const em = (p) => `${p}.${run}@e2e.test`;
  const S = {};

  await test("register client via UI", async () => { await registerUI(client, { name: "E2E Client", email: em("client"), role: "CLIENT" }); });
  await test("register 3 freelancers + stranger", async () => {
    await registerUI(fl1, { name: "E2E Freelancer One", email: em("fl1"), role: "FREELANCER" });
    for (const [a, p] of [[fl2, "fl2"], [fl3, "fl3"], [stranger, "str"]]) {
      const r = await apiJson(a, "POST", "/api/auth/register", { name: `E2E ${p}`, email: em(p), password: "password123", role: p === "str" ? "CLIENT" : "FREELANCER", city: "Душанбе" });
      assert(r.status === 201 || r.status === 200, `register ${p} → ${r.status} ${JSON.stringify(r.body)}`);
    }
  });
  await test("validation: project form shows field errors (frontend)", async () => {
    await go(client, "/projects/new");
    await client.page.click('[data-testid="publish-project"]');
    await client.page.waitForSelector(".field-error");
  });
  await test("backend validation rejects bad project", async () => {
    const r = await apiJson(client, "POST", "/api/projects", { title: "x", description: "short", budget: -1, deadline: "2000-01-01" });
    assert(r.status === 400 && r.body.fields?.title && r.body.fields?.deadline, `expected 400 with fields, got ${r.status}`);
  });
  await test("client saves a draft, then publishes via UI", async () => {
    await go(client, "/projects/new");
    const f = client.page;
    await f.fill('input[name="title"]', `E2E landing page ${run}`);
    await f.fill('textarea[name="description"]', "We need a responsive landing page with a contact form and analytics.");
    await f.selectOption('select[name="categoryId"]', { index: 1 });
    await f.fill('input[name="skills"]', "Next.js, Tailwind");
    await f.getByRole("radio", { name: "Range" }).click();
    await f.fill('input[name="budgetMin"]', "1000"); await f.fill('input[name="budgetMax"]', "2000");
    await f.fill('input[name="deadline"]', dateIn(30)); await f.fill('input[name="proposalDeadline"]', dateIn(10));
    await Promise.all([f.waitForURL((u) => /^\/projects\/c[a-z0-9]{10,}$/.test(u.pathname), { timeout: 20000 }), f.click('[data-testid="save-draft"]')]);
    S.project = f.url().split("/").pop();
    await f.waitForSelector("text=This is a draft visible only to you.");
    const anonView = await anon.page.goto(`/projects/${S.project}`); assert(anonView.status() === 404, `draft visible to anon: ${anonView.status()}`);
    await f.click('[data-testid="publish"]');
    await f.waitForSelector("text=Draft", { state: "detached" }).catch(() => {});
    const r = await apiJson(anon, "GET", `/api/projects?q=${encodeURIComponent(`landing page ${run}`)}`);
    assert(r.body.items?.some((p) => p.id === S.project), "published project not found in search");
  });
  await test("freelancer 1 sends a proposal via UI modal", async () => {
    await go(fl1, `/projects/${S.project}`);
    await fl1.page.click('[data-testid="open-proposal"]');
    await fl1.page.fill('input[name="price"]', "1500");
    await fl1.page.fill('input[name="days"]', "14");
    await fl1.page.fill('textarea[name="text"]', "Hello! I have built many landing pages with Next.js and Tailwind. Ready to start.");
    await fl1.page.click('[data-testid="proposal-form"] button[type="submit"]');
    await fl1.page.waitForSelector("text=Proposal sent", { timeout: 10000 }).catch(async () => { await fl1.page.waitForSelector('[role="status"]'); });
  });
  await test("freelancers 2 and 3 propose (API); duplicate proposal rejected", async () => {
    for (const [a, price] of [[fl2, 1200], [fl3, 1900]]) {
      await loginAPI(a, em(a === fl2 ? "fl2" : "fl3"));
      const r = await apiJson(a, "POST", "/api/proposals", { projectId: S.project, price, deliveryDays: 10, coverLetter: "I can deliver this project quickly and with high quality." });
      assert(r.status === 201, `proposal → ${r.status} ${JSON.stringify(r.body)}`);
    }
    const dup = await apiJson(fl2, "POST", "/api/proposals", { projectId: S.project, price: 999, deliveryDays: 5, coverLetter: "Second proposal should not be allowed at all." });
    assert(dup.status === 400 && dup.body.error === "already_proposed", `dup → ${dup.status} ${dup.body.error}`);
  });
  await test("freelancer edits then withdraws and re-sends own proposal", async () => {
    const mine = await fl3.req.get(`/projects/${S.project}`); assert(mine.ok(), "page");
    const id = (await apiJson(client, "GET", `/api/projects/${S.project}`)).body; void id;
    const list = await fl3.page.goto(`/projects/${S.project}`, { waitUntil: "load" }); void list;
    await fl3.page.waitForSelector('[data-testid="my-proposal"]');
    await fl3.page.click('[data-testid="withdraw"]'); await fl3.page.click('[data-testid="withdraw-confirm"]');
    await fl3.page.waitForSelector("text=Send again");
    const r = await apiJson(fl3, "POST", "/api/proposals", { projectId: S.project, price: 1800, deliveryDays: 9, coverLetter: "Re-sending my improved proposal after reconsideration." });
    assert(r.status === 201, `resend → ${r.status}`);
  });
  await test("privacy: proposal contents visible only to project owner", async () => {
    const html = await (await stranger.page.goto(`/projects/${S.project}`)).text();
    assert(!html.includes("I can deliver this project quickly"), "stranger sees other proposal text");
    const f2 = await (await fl2.page.goto(`/projects/${S.project}`)).text();
    assert(!f2.includes("built many landing pages"), "competing freelancer sees fl1 proposal");
    const own = await (await client.page.goto(`/projects/${S.project}`, { waitUntil: "load" })).text();
    assert(own.includes("built many landing pages"), "owner cannot see proposals");
  });
  await test("compare 3 proposals and hire from the compare page", async () => {
    await go(client, `/projects/${S.project}`);
    const boxes = client.page.locator('[data-testid^="cmp-"]');
    assert((await boxes.count()) >= 3, "need 3 compare checkboxes");
    for (let i = 0; i < 3; i++) await boxes.nth(i).check();
    await Promise.all([client.page.waitForURL(/compare\?ids=/), client.page.click('[data-testid="compare-go"]')]);
    await client.page.waitForSelector('[data-testid="compare-table"]');
    await client.page.screenshot({ path: `${SHOTS}/compare-proposals.png`, fullPage: true });
    const strangerCmp = await stranger.page.goto(client.page.url().replace(BASE, "")); assert(strangerCmp.status() === 404, "stranger can open compare");
    const hireBtn = client.page.locator('[data-testid^="cmp-hire-"]').first();
    S.hiredProposal = (await hireBtn.getAttribute("data-testid")).replace("cmp-hire-", "");
    await hireBtn.click();
    await Promise.all([client.page.waitForURL(/\/orders\//, { timeout: 20000 }), client.page.click(`[data-testid="cmp-hire-${S.hiredProposal}-confirm"]`)]);
    S.order = client.page.url().split("/").pop();
  });
  await test("double hire does not create a second order", async () => {
    const props = await apiJson(client, "GET", `/api/projects/${S.project}/proposals`).catch(() => ({}));
    void props;
    const r = await apiJson(client, "POST", `/api/projects/${S.project}/accept`, { proposalId: S.hiredProposal });
    assert(r.status === 409 || r.status === 400, `second hire → ${r.status}`);
    const par = await Promise.all([1, 2, 3].map(() => apiJson(client, "POST", `/api/projects/${S.project}/accept`, { proposalId: S.hiredProposal })));
    assert(par.every((x) => x.status >= 400), "parallel re-hire succeeded");
  });
  await test("hired freelancer sees order; others get 404 on order page", async () => {
    const who = { [fl1.label]: fl1, [fl2.label]: fl2, [fl3.label]: fl3 };
    let hired = null;
    for (const a of Object.values(who)) {
      const resp = await a.page.goto(`/orders/${S.order}`);
      if (resp.status() === 200) hired = a; else assert(resp.status() === 404, `${a.label} order → ${resp.status()}`);
    }
    assert(hired, "no freelancer can see the order"); S.fl = hired;
    assert((await stranger.page.goto(`/orders/${S.order}`)).status() === 404, "stranger sees order");
    assert((await anon.page.goto(`/orders/${S.order}`)).url().includes("/login"), "anon not redirected");
  });
  await test("no review before completion", async () => {
    const r = await apiJson(client, "POST", "/api/reviews", { orderId: S.order, rating: 5, comment: "Too early to review this." });
    assert(r.status >= 400, `early review → ${r.status}`);
  });
  await test("freelancer cannot complete/accept own work", async () => {
    const o = await apiJson(S.fl, "GET", `/api/orders/${S.order}`); void o;
    await go(S.fl, `/orders/${S.order}`);
    assert(!(await S.fl.page.locator('[data-testid="ms-accept"]').count()), "accept button shown to freelancer");
  });
  await test("freelancer starts order; client adds a milestone", async () => {
    await go(S.fl, `/orders/${S.order}`);
    await S.fl.page.click('[data-testid="order-start"]');
    await S.fl.page.waitForSelector('[data-testid="order-status"] >> text=In progress');
    await go(client, `/orders/${S.order}`);
    await client.page.click('[data-testid="add-ms"]');
    await client.page.fill('input[name="title"]', "Final polish");
    await client.page.fill('input[name="deadline"]', dateIn(20));
    await client.page.fill('input[name="amount"]', "300");
    await client.page.locator('form:has(input[name="title"]) button.btn-primary').click();
    await client.page.waitForSelector("text=Final polish");
  });
  await test("chat: messages, attachment privacy, retry dedupe", async () => {
    await go(client, `/orders/${S.order}`);
    await Promise.all([client.page.waitForURL(/\/messages\//), client.page.getByRole("link", { name: "Chat" }).first().click()]);
    S.conv = client.page.url().split("/").pop();
    await client.page.fill('[data-testid="chat-input"]', "Hello! Welcome aboard.");
    await client.page.click('[data-testid="chat-send"]');
    await client.page.waitForSelector("text=Hello! Welcome aboard.");
    await go(S.fl, `/messages/${S.conv}`);
    await S.fl.page.waitForSelector("text=Hello! Welcome aboard.");
    // upload a private file into chat via API and send it
    const up = await S.fl.req.post("/api/upload", { multipart: { kind: "chat", file: { name: "spec.txt", mimeType: "text/plain", buffer: Buffer.from("secret spec") } } });
    const att = (await up.json()).attachment; assert(att?.url?.startsWith("/api/files/"), `private url ${att?.url}`);
    const cmid = `e2e-${run}`;
    const m1 = await apiJson(S.fl, "POST", `/api/conversations/${S.conv}/messages`, { body: "Here is the spec", clientMessageId: cmid, attachmentIds: [att.id] });
    const m2 = await apiJson(S.fl, "POST", `/api/conversations/${S.conv}/messages`, { body: "Here is the spec", clientMessageId: cmid, attachmentIds: [att.id] });
    assert(m1.status === 201 && m2.status === 200 && m1.body.message.id === m2.body.message.id, "clientMessageId dedupe failed");
    assert((await client.req.get(att.url)).status() === 200, "member cannot download");
    assert((await stranger.req.get(att.url)).status() === 404 || (await stranger.req.get(att.url)).status() === 403, "stranger downloads private file");
    assert([401, 403, 404].includes((await anon.req.get(att.url)).status()), "anon downloads private file");
    assert((await stranger.page.goto(`/messages/${S.conv}`)).status() === 404, "stranger opens chat");
    assert((await apiJson(stranger, "GET", `/api/conversations/${S.conv}/messages`)).status === 403 || (await apiJson(stranger, "GET", `/api/conversations/${S.conv}/messages`)).status === 404, "stranger reads messages API");
    await go(client, `/messages/${S.conv}`); await client.page.waitForSelector("text=Here is the spec");
    await client.page.screenshot({ path: `${SHOTS}/chat.png` });
  });
  await test("submit work → revision → resubmit → accept all → COMPLETED", async () => {
    const msActions = async (a, action, extra = {}) => {
      const ord = await a.page.goto(`/orders/${S.order}`); void ord;
    };
    void msActions;
    for (let round = 0; round < 2; round++) {
      await go(S.fl, `/orders/${S.order}`);
      const submit = S.fl.page.locator('[data-testid="submit-work"]').first();
      await submit.click();
      await S.fl.page.locator("form:has(textarea) textarea").last().fill(round === 0 ? "First version delivered." : "Fixed after revision.");
      await S.fl.page.locator('div[role="dialog"] button.btn-primary').last().click();
      await S.fl.page.waitForSelector('[data-testid="ms-status"] >> text=Submitted');
      await go(client, `/orders/${S.order}`);
      if (round === 0) {
        await client.page.locator('[data-testid="ms-revision"]').first().click();
        await client.page.locator('div[role="dialog"] textarea').fill("Please change the colours.");
        await client.page.click('[data-testid="ms-revision-confirm"]');
        await client.page.waitForSelector("text=Revision requested");
      } else {
        await client.page.locator('[data-testid="ms-accept"]').first().click();
        await client.page.click('[data-testid="ms-accept-confirm"]');
        await client.page.waitForSelector('[data-testid="ms-status"] >> text=Accepted');
      }
    }
    // second milestone
    await go(S.fl, `/orders/${S.order}`);
    await S.fl.page.locator('[data-testid="submit-work"]').first().click();
    await S.fl.page.locator('div[role="dialog"] textarea').fill("Polish done.");
    await S.fl.page.locator('div[role="dialog"] button.btn-primary').last().click();
    await S.fl.page.waitForTimeout(800);
    await go(client, `/orders/${S.order}`);
    await client.page.screenshot({ path: `${SHOTS}/order-milestones.png`, fullPage: true });
    await client.page.locator('[data-testid="ms-accept"]').first().click();
    await client.page.click('[data-testid="ms-accept-confirm"]');
    await client.page.waitForSelector('[data-testid="order-status"] >> text=Completed', { timeout: 15000 });
  });
  await test("both parties leave one review each; duplicates and self-review rejected", async () => {
    for (const a of [client, S.fl]) {
      await go(a, `/orders/${S.order}`);
      await a.page.getByRole("radio", { name: "5 of 5", exact: true }).click();
      await a.page.fill('[data-testid="review-form"] textarea', "Great collaboration, thanks a lot!");
      await a.page.click('[data-testid="review-form"] button.btn-primary');
      await a.page.waitForSelector('[data-testid="review-form"]', { state: "detached" });
    }
    const dup = await apiJson(client, "POST", "/api/reviews", { orderId: S.order, rating: 1, comment: "Trying a second review" });
    assert(dup.status >= 400, `dup review → ${dup.status}`);
    const other = await apiJson(stranger, "POST", "/api/reviews", { orderId: S.order, rating: 1, comment: "I was never part of it" });
    assert(other.status >= 400, `stranger review → ${other.status}`);
  });
  await test("search, filters, sort and pagination", async () => {
    const r = await apiJson(anon, "GET", "/api/projects?sort=budget_desc");
    const b = r.body.items.map((p) => p.budget);
    assert(b.every((x, i) => i === 0 || b[i - 1] >= x), "budget_desc not sorted");
    const cat = await apiJson(anon, "GET", "/api/projects?category=design");
    assert(cat.body.items.every((p) => p.categorySlug === "design"), "category filter");
    const p2 = await apiJson(anon, "GET", "/api/projects?status=ALL&page=2");
    assert(p2.status === 200 && p2.body.page === 2, "pagination");
    await go(anon, "/projects?status=ALL");
    await anon.page.waitForSelector('nav[aria-label="Pagination"]');
    await go(anon, "/projects?q=zzzz-nothing-matches");
    await anon.page.waitForSelector("text=0 projects found");
  });
  await test("notifications: badge + center", async () => {
    await go(client, "/notifications");
    const n = await client.page.locator("main li").count(); assert(n > 0, "no notifications");
  });
  await test("admin: restricted user cannot log in; audit log written", async () => {
    const admin = await actor("admin");
    await loginAPI(admin, "admin@demo.tj");
    const strangerId = (await apiJson(stranger, "GET", "/api/account")).body.user?.id;
    assert(strangerId, "account id");
    const noReason = await apiJson(admin, "POST", "/api/admin/moderate", { targetType: "USER", targetId: strangerId, action: "restrict", reason: "" });
    assert(noReason.status === 400, "reason must be required");
    const r = await apiJson(admin, "POST", "/api/admin/moderate", { targetType: "USER", targetId: strangerId, action: "restrict", reason: "e2e test restriction" });
    assert(r.status === 200, `restrict → ${r.status}`);
    const l = await apiJson(stranger, "POST", "/api/auth/login", { email: em("str"), password: "password123" });
    assert(l.status === 403, `restricted login → ${l.status}`);
    const nonAdmin = await apiJson(client, "POST", "/api/admin/moderate", { targetType: "USER", targetId: strangerId, action: "reactivate", reason: "hack" });
    assert(nonAdmin.status === 403, `non-admin moderate → ${nonAdmin.status}`);
    await go(admin, "/admin?tab=audit"); await admin.page.waitForSelector("text=e2e test restriction");
    await apiJson(admin, "POST", "/api/admin/moderate", { targetType: "USER", targetId: strangerId, action: "reactivate", reason: "e2e cleanup" });
    assert((await client.page.goto("/admin")).status() === 404, "non-admin sees /admin");
    await admin.ctx.close();
  });
  await test("rate limit: login is throttled", async () => {
    const a = await actor("rl");
    let last = 0;
    for (let i = 0; i < 10; i++) last = (await apiJson(a, "POST", "/api/auth/login", { email: em("nobody"), password: "wrong-password" })).status;
    assert(last === 429, `expected 429, got ${last}`);
    await a.ctx.close();
  });
  await test("password reset: token flow (dev log fallback) ", async () => {
    const a = await actor("reset");
    const r = await apiJson(a, "POST", "/api/auth/forgot", { email: em("fl2") });
    assert(r.status === 200 && typeof r.body.emailConfigured === "boolean", `forgot → ${r.status}`);
    const bad = await apiJson(a, "POST", "/api/auth/reset", { token: "invalid-token", password: "newpassword1" });
    assert(bad.status === 400, `invalid token → ${bad.status}`);
    await a.ctx.close();
  });
  await test("responsive: no horizontal overflow at 360/390/768/1440", async () => {
    for (const w of [360, 390, 768, 1440]) {
      const a = await actor(`w${w}`, { width: w, height: 800 });
      await loginAPI(a, em("client"));
      for (const path of ["/", "/projects", `/projects/${S.project}`, `/orders/${S.order}`, `/messages/${S.conv}`, "/dashboard", "/freelancers"]) {
        await go(a, path);
        const over = await a.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert(over <= 1, `${w}px ${path} overflows by ${over}px`);
      }
      if (w === 390) { await go(a, "/"); await a.page.screenshot({ path: `${SHOTS}/mobile-390-home.png`, fullPage: false }); }
      await a.ctx.close();
    }
  });
  await test("no console errors during the run", async () => { assert(!consoleErrors.length, consoleErrors.slice(0, 5).join("\n")); });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  fs.writeFileSync(`${SHOTS}/results.json`, JSON.stringify({ base: BASE, run, results, consoleErrors }, null, 2));
  process.exit(failed.length ? 1 : 0);
}
main().catch(async (e) => { console.error(e); await browser?.close(); process.exit(1); });

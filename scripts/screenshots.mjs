import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const OUT = path.resolve("screenshots");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function shot(page, name) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage: true });
  console.log("saved", p);
}

const desktop = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: "tg-TJ",
});
const page = await desktop.newPage();

await page.goto(BASE + "/login", { waitUntil: "networkidle" });
await page.fill('input[name="email"]', "client@demo.tj");
await page.fill('input[name="password"]', "password123");
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle" }),
  page.click('button[type="submit"]'),
]);

// Notifications: open bell dropdown
await page.goto(BASE + "/notifications", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await shot(page, "07-notifications.png");

// Also capture bell open on home for nicer shot - navigate and click bell
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const bell = page.locator('button[aria-label="Огоҳиҳо"]');
if (await bell.count()) {
  await bell.click();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(OUT, "07-notifications.png"),
    fullPage: false,
  });
  console.log("saved dropdown version of 07");
}

// Chat with attachments
await page.goto(BASE + "/projects", { waitUntil: "networkidle" });
const cards = page.locator('a[href^="/projects/"]');
const n = await cards.count();
let chat = null;
for (let i = 0; i < n; i++) {
  const text = await cards.nth(i).innerText();
  if (text.includes("Даштборд")) {
    chat = await cards.nth(i).getAttribute("href");
    break;
  }
}
if (!chat) chat = await cards.first().getAttribute("href");
await page.goto(BASE + chat + "/chat", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await shot(page, "08-chat-attachments.png");

await desktop.close();
await browser.close();
console.log("done");

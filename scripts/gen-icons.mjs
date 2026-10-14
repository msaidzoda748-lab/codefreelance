import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const svg = (rx, pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="${rx}" fill="#059669"/><g transform="translate(${pad} ${pad}) scale(${(40 - 2 * pad) / 40})"><path d="M11 12h16l-14 16h16" stroke="#fff" stroke-width="4.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 12l3-3" stroke="#6ee7b7" stroke-width="3.4" stroke-linecap="round"/></g></svg>`;
const jobs = [["icon-192.png",192,10,0],["icon-512.png",512,10,0],["maskable-512.png",512,0,6],["apple-touch-icon.png",180,0,2]];
for (const [name, s, rx, pad] of jobs) {
  const p = await b.newPage({ viewport: { width: s, height: s } });
  await p.setContent(`<style>html,body{margin:0;background:transparent}</style><img style="width:${s}px;height:${s}px;display:block" src="data:image/svg+xml,${encodeURIComponent(svg(rx,pad))}">`);
  await p.screenshot({ path: `public/icons/${name}`, omitBackground: true });
}
await b.close();

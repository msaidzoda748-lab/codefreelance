// v9 mobile audit. BASE OUT W
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const BASE=process.env.BASE||"http://localhost:3100", OUT=process.env.OUT||"/tmp/v9";
const pages=[["home","/",0],["projects","/projects",0],["freelancers","/freelancers",0],["works","/works",0],["login","/login",0],["register","/register",0],["dashboard","/dashboard",1],["chat","/messages",1],["orders","/orders",1],["notifications","/notifications",1],["admin","/admin",2]];
for (const w of (process.env.W||"360,390,414").split(",").map(Number)) for (const [n,path,auth] of pages) {
  const ctx = await b.newContext({ baseURL: BASE, viewport:{width:w,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2, locale:"ru-RU" });
  await ctx.addCookies([{ name:"cf-lang", value:"ru", url:BASE }]);
  if (auth) await ctx.request.post("/api/auth/login",{data:{email:auth==2?"admin@demo.tj":"client@demo.tj",password:"password123"}});
  const p=await ctx.newPage();
  await p.goto(BASE+path,{waitUntil:"load",timeout:90000}); await p.waitForTimeout(1200);
  if (n==="chat") { const a=await p.$('a[href^="/messages/"]'); if(a){await a.click(); await p.waitForTimeout(2000);} }
  const r=await p.evaluate((w)=>{const over=[...document.querySelectorAll("body *")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>w+1)&&getComputedStyle(e).position!=="fixed"}).slice(0,4).map(e=>e.tagName+"."+String(e.className).slice(0,50));
   const tiny=[...document.querySelectorAll("a,button,input,select")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.height<32}).slice(0,4).map(e=>e.tagName+":"+(e.textContent||e.name||"").trim().slice(0,20)+":"+Math.round(e.getBoundingClientRect().height));
   return {sw:document.documentElement.scrollWidth,over,tiny}},w);
  console.log(w,n,JSON.stringify(r));
  await p.screenshot({path:`${OUT}-${n}-${w}.png`});
  await ctx.close();
}
await b.close();

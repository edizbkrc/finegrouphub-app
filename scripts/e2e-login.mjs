// Panelin GERÇEK login akışını headless Chrome + DevTools protokolüyle sürer (Cypress binary gerekmez).
//   E2E_USER=… E2E_PASSWORD=… node scripts/e2e-login.mjs        (PANEL=http://localhost:3000/tr)
// Panel dev sunucusu ve API çalışıyor olmalı. Ağ/konsol hatalarını (CORS dahil) ve son URL'yi yazar.
// Panelin gerçek login akışını headless Chrome + CDP ile sürer; ağ/konsol olaylarını yazar.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const PORT = 9333, URL0 = process.env.PANEL ?? "http://localhost:3000/tr";
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-gpu", "--no-sandbox", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "panel-e2e-"))}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (targets.length) break; } catch {} await sleep(250); }
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const log = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result ?? d.error); pending.delete(d.id); return; }
  const p = d.params ?? {};
  if (d.method === "Network.requestWillBeSent" && /localhost:(8000|3000\/api)/.test(p.request.url)) log.push(`→ ${p.request.method} ${p.request.url}`);
  if (d.method === "Network.responseReceived" && /localhost:(8000|3000\/api)/.test(p.response.url)) log.push(`← ${p.response.status} ${p.response.url}`);
  if (d.method === "Page.frameNavigated" && !p.frame.parentId) log.push(`⇢ navigate ${p.frame.url}`);
  if (d.method === "Network.loadingFailed") log.push(`✗ FAILED ${p.errorText} ${p.blockedReason ?? ""} ${p.corsErrorStatus ? JSON.stringify(p.corsErrorStatus) : ""}`);
  if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(p.type)) log.push(`console.${p.type}: ${p.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300)}`);
  if (d.method === "Runtime.exceptionThrown") log.push(`exception: ${(p.exceptionDetails.exception?.description ?? p.exceptionDetails.text).slice(0, 300)}`);
  if (d.method === "Log.entryAdded" && p.entry.level === "error") log.push(`log.error: ${p.entry.text} ${p.entry.url ?? ""}`.slice(0, 300));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
await send("Network.enable"); await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
await send("Page.navigate", { url: URL0 }); await sleep(4000);
log.push("sayfa: " + (await ev("location.href")));
const fill = (sel, v) => ev(`(()=>{const i=document.querySelector('${sel}');const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(i,${JSON.stringify(v)});i.dispatchEvent(new Event('input',{bubbles:true}));return !!i})()`);
log.push("alanlar: " + (await fill('[data-cy="login-username"] input', process.env.E2E_USER)) + "," + (await fill('[data-cy="login-password"] input', process.env.E2E_PASSWORD)));
await ev(`document.querySelector('[data-cy="login-submit"]').click()`); await sleep(Number(process.env.WAIT ?? 6000));
log.push("sonra: " + (await ev("location.href")));
log.push("toast: " + JSON.stringify(await ev("[...document.querySelectorAll('#notistack-snackbar, .notistack-Snackbar')].map(e=>e.textContent)")));
console.log(log.join("\n"));
ws.close(); chrome.kill();
process.exit(0);

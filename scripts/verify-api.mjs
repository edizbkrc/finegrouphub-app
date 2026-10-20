#!/usr/bin/env node
/**
 * Panel ↔ Laravel API sözleşme doğrulaması (canlı).
 *
 *   E2E_USER=... E2E_PASSWORD=... node scripts/verify-api.mjs
 *   API_URL=http://localhost:8000/hubapi   (varsayılan)
 *
 * Kimlik bilgisi yalnızca süreç ortamından okunur; diske yazılmaz, loglanmaz.
 * Yalnızca OKUMA + oturum uçlarını çağırır (login/refresh/logout); veri yazmaz.
 * Çıkış kodu: tüm kontroller geçerse 0, aksi halde 1.
 */
import { randomUUID } from "node:crypto";

const API = (process.env.API_URL ?? "http://localhost:8000/hubapi").replace(/\/$/, "");
const USER = process.env.E2E_USER;
const PASS = process.env.E2E_PASSWORD;

if (!USER || !PASS) {
  console.error("E2E_USER ve E2E_PASSWORD ortam değişkenleri gerekli.");
  process.exit(2);
}

const deviceId = `verify-${randomUUID()}`;
let failures = 0;

const check = (name, ok, detail = "") => {
  if (!ok) failures += 1;
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${!ok && detail ? `  → ${detail}` : ""}`);
  return ok;
};

const call = async (method, path, { token, body, metadata } = {}) => {
  const res = await fetch(`${API}/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": "tr-TR",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(metadata === undefined ? {} : { "M-Metadata": String(metadata) }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* gövde JSON değil */
  }
  return { http: res.status, json };
};

const envelope = (json) =>
  json && typeof json.isSuccess === "boolean" && typeof json.statusCode === "number" && Array.isArray(json.messages);

const METADATA_KEYS = [
  "name", "localizedName", "type", "display", "pinned", "mask", "filterable",
  "filterFormat", "filterComponentType", "defaultValue", "decimalPrecision",
  "displayFormat", "tooltipFormat", "metadatas",
];

const verifyList = async (label, path, token, extraBody = {}) => {
  console.log(`\n${label}  PATCH ${path}`);
  const { http, json } = await call("PATCH", path, {
    token,
    metadata: true,
    body: { pageNumber: 1, rowCount: 5, ...extraBody },
  });
  if (!check("HTTP 200 + zarf", http === 200 && envelope(json), `http=${http}`)) return;
  if (!check("isSuccess", json.isSuccess, JSON.stringify(json.messages))) return;
  check("data dizi", Array.isArray(json.data));
  check("sayfalama kökte", ["currentPageNumber", "totalPageCount", "totalDataCount"].every((k) => typeof json[k] === "number"),
    `currentPageNumber=${json.currentPageNumber} totalPageCount=${json.totalPageCount} totalDataCount=${json.totalDataCount}`);
  const metas = json.metadatas;
  if (!check("metadatas dolu (M-Metadata: true)", Array.isArray(metas) && metas.length > 0, `len=${metas?.length}`)) return;
  const missing = METADATA_KEYS.filter((k) => !(k in metas[0]));
  check("metadata alanları eksiksiz", missing.length === 0, `eksik: ${missing.join(", ")}`);
  const extra = Object.keys(metas[0]).filter((k) => !METADATA_KEYS.includes(k));
  if (extra.length) console.log(`    ℹ panelin tipinde olmayan ek alanlar: ${extra.join(", ")}`);
  const row = json.data[0];
  if (row) {
    const unknownCols = Object.keys(row).filter((k) => !metas.some((m) => m.name === k));
    console.log(`    ℹ ${json.data.length}/${json.totalDataCount} satır; metadata'sında olmayan satır alanları: ${unknownCols.join(", ") || "yok"}`);
  }
  const off = await call("PATCH", path, { token, metadata: false, body: { pageNumber: 1, rowCount: 1, ...extraBody } });
  check("M-Metadata: false → metadatas boş", off.json && (!off.json.metadatas || off.json.metadatas.length === 0));
};

// ── 1. Kimlik ─────────────────────────────────────────────────────────
console.log("Giriş  POST /account/login");
const bad = await call("POST", "/account/login", { body: { userName: "__yok__", password: "x", deviceId } });
check("yanlış kimlik: HTTP 200 + gövde 400", bad.http === 200 && bad.json?.statusCode === 400 && bad.json?.isSuccess === false);

const login = await call("POST", "/account/login", { body: { userName: USER, password: PASS, deviceId } });
if (!check("giriş başarılı", login.json?.isSuccess === true, `http=${login.http} ${JSON.stringify(login.json?.messages)}`)) process.exit(1);

const d = login.json.data;
check("data.id sayı", typeof d.id === "number", typeof d.id);
const t = d.token ?? {};
for (const k of ["accessToken", "refreshToken", "expiresIn", "refreshTokenExpiresIn"]) check(`token.${k}`, t[k] !== undefined && t[k] !== null);
check("accessibleMenuItems dizi", Array.isArray(d.accessibleMenuItems));
check("pageInformations dizi", Array.isArray(d.pageInformations));
check("menüde childrens alanı (yazım: childrens)", d.accessibleMenuItems?.some((m) => "childrens" in m));
check("systemInfo yok (panel opsiyonel bekliyor)", d.systemInfo === undefined);
let token = t.accessToken;
let refresh = t.refreshToken;

// ── 2. UI ─────────────────────────────────────────────────────────────
console.log("\nUI  GET /UI/menuItems, /UI/pages");
const menu = await call("GET", "/UI/menuItems", { token });
check("menuItems", menu.json?.isSuccess && Array.isArray(menu.json.data));
const pages = await call("GET", "/UI/pages", { token });
check("pages", pages.json?.isSuccess && Array.isArray(pages.json.data));
const pageInfo = pages.json?.data?.[0];
check("page alanları", pageInfo && ["name", "localizedName", "userCanCreate", "userCanDetail", "userCanEdit", "userCanDelete", "additionalActions"].every((k) => k in pageInfo));

console.log("\nProfil  GET /account/detail?userId=");
const detail = await call("GET", `/account/detail?userId=${d.id}`, { token });
check("account detail", detail.json?.isSuccess === true, JSON.stringify(detail.json?.messages));

// ── 3. Listeler (uygulanmış uç grupları) ──────────────────────────────
await verifyList("Kullanıcılar", "/users", token);
await verifyList("Roller", "/roles", token);
await verifyList("Yetkiler", "/permissions", token);
await verifyList("Şirketler", "/tenants", token);
await verifyList("Projeler", "/projects", token);
await verifyList("Daire tipleri", "/unittypes", token);
await verifyList("Daire durumları", "/unitstates", token);
await verifyList("Kat şablonları", "/floortemplates", token);
await verifyList("Daire şablonları", "/unittemplates", token);

// ── 4. Refresh (süresi dolmuş token senaryosu için eski token gönderilir) ─
console.log("\nRefresh  POST /account/login/refresh");
const ref = await call("POST", "/account/login/refresh", {
  token,
  body: { refreshToken: refresh, deviceId, userName: USER },
});
if (check("refresh başarılı", ref.json?.isSuccess === true, JSON.stringify(ref.json?.messages))) {
  token = ref.json.data.token.accessToken;
  check("yeni token döndü", !!token);
}

// ── 5. Çıkış ──────────────────────────────────────────────────────────
console.log("\nÇıkış  POST /account/logout");
const out = await call("POST", "/account/logout", { token, body: { userName: USER, deviceId } });
check("logout", out.json?.isSuccess === true, JSON.stringify(out.json?.messages));
// Access token stateless JWT; logout yalnızca cihaz oturumunu (refresh token) kapatır.
// Eski token süresi dolana kadar geçerli kalır — bilgi olarak yazılır, hata sayılmaz.
const after = await call("GET", "/UI/menuItems", { token });
console.log(`    ℹ logout sonrası eski access token: HTTP ${after.http} (${after.http === 200 ? "süresi dolana kadar geçerli — stateless JWT" : "reddedildi"})`);
const reuse = await call("POST", "/account/login/refresh", { token, body: { refreshToken: refresh, deviceId, userName: USER } });
check("logout sonrası refresh token kullanılamaz", reuse.json?.isSuccess === false, "oturum kapanmadı");

console.log(failures === 0 ? "\nTÜM KONTROLLER GEÇTİ" : `\n${failures} KONTROL BAŞARISIZ`);
process.exit(failures === 0 ? 0 : 1);

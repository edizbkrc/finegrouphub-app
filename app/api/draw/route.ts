import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

/**
 * Çizim editörünü (storage.fineproject.com.tr/draw/new.html) **aynı origin**
 * üzerinden sunar ve içine köprü betiğini enjekte eder.
 *
 * Neden proxy?
 * Editör ayrı bir alan adında duruyor; doğrudan iframe'e koyarsak tarayıcı
 * aynı-origin kuralı yüzünden panelin iframe içine erişmesine izin vermez,
 * yani ne poligonları yükleyebilir ne de geri okuyabiliriz. Proxy sayesinde
 * iframe `/api/draw` adresinden gelir — panelle aynı origin — ve köprü çalışır.
 *
 * Editörün kendisi kopyalanmaz: her istekte kaynağından okunur, dolayısıyla
 * oradaki güncellemeler panele kendiliğinden yansır.
 */

const EDITOR_URL = process.env.DRAW_EDITOR_URL ?? "https://storage.fineproject.com.tr/draw/new.html";

/** Editörün kaynağı sık değişmiyor; kısa bir önbellek upstream'i yormuyor. */
export const revalidate = 300;

export async function GET() {
  let html: string;

  try {
    const response = await fetch(EDITOR_URL, {
      headers: { Accept: "text/html" },
      next: { revalidate },
    });

    if (!response.ok) {
      return editorError(`Çizim editörü yüklenemedi (HTTP ${response.status}).`);
    }

    html = await response.text();
  } catch {
    return editorError("Çizim editörüne ulaşılamadı. Sunucunun internet erişimi olduğundan emin olun.");
  }

  if (!html.includes("editorCanvas")) {
    return editorError("Çizim editörü beklenen biçimde değil; köprü bağlanamadı.");
  }

  // Göreli yollar artık /api/draw altından çözülecek — <base> ile kaynağa geri bağlanır.
  const base = `<base href="${new URL(".", EDITOR_URL).href}">`;

  // Köprü SATIR İÇİ gömülür: <base> yüzünden "/draw-bridge.js" gibi kök-göreli bir
  // adres editörün kendi origin'ine çözülür ve 404 olur (bir kez bu tuzağa düşüldü).
  let bridgeSource: string;
  try {
    bridgeSource = await readFile(path.join(process.cwd(), "public", "draw-bridge.js"), "utf8");
  } catch {
    return editorError("Köprü betiği (public/draw-bridge.js) okunamadı.");
  }
  const bridge = `<script>${bridgeSource}</script>`;

  const withBase = html.includes("<base ") ? html : html.replace(/<head([^>]*)>/i, `<head$1>${base}`);
  const withBridge = withBase.includes("</body>")
    ? withBase.replace(/<\/body>/i, `${bridge}</body>`)
    : withBase + bridge;

  return new NextResponse(withBridge, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Yalnızca kendi sayfamız çerçeveleyebilsin.
      "Content-Security-Policy": "frame-ancestors 'self'",
    },
  });
}

function editorError(message: string) {
  const page = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<style>body{margin:0;display:grid;place-items:center;height:100vh;font:15px/1.5 system-ui;background:#131211;color:#F4F2EF}
div{max-width:36rem;padding:24px;text-align:center}</style></head>
<body><div><h2>Çizim editörü açılamadı</h2><p>${message}</p></div></body></html>`;

  return new NextResponse(page, {
    status: 502,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

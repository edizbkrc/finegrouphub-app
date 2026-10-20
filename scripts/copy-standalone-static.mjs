/**
 * `next build` standalone çıktısına `.next/static` ve `public` kopyalar.
 * Bunlar olmadan start:local JS/CSS yükleyemez (boş gri sayfa).
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");
const staticSrc = join(root, ".next", "static");
const staticDest = join(standalone, ".next", "static");
const publicSrc = join(root, "public");
const publicDest = join(standalone, "public");

if (!existsSync(standalone)) {
  console.error("copy-standalone-static: .next/standalone yok — önce build:local çalıştırın.");
  process.exit(1);
}

mkdirSync(join(standalone, ".next"), { recursive: true });
if (existsSync(staticDest)) rmSync(staticDest, { recursive: true, force: true });
cpSync(staticSrc, staticDest, { recursive: true });

if (existsSync(publicSrc)) {
  if (existsSync(publicDest)) rmSync(publicDest, { recursive: true, force: true });
  cpSync(publicSrc, publicDest, { recursive: true });
}

console.log("copy-standalone-static: static + public → .next/standalone");

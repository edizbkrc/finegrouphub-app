/* eslint-disable import/order */
import type { NextConfig } from "next";
import fs from "fs";
import dotenv from "dotenv";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const appEnv = process.env.NEXT_PUBLIC_APP_ENV || "local";
const envCandidates = [`.env.${appEnv}`, ".env"];
for (const envFile of envCandidates) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    break;
  }
}

console.log(
  `${process.env.NEXT_PUBLIC_APP_NAME} is running in ${process.env.NEXT_PUBLIC_APP_ENV} mode`
);

// Yerel production start'ta SW eski chunk'ları kilitlemesin.
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable:
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_APP_ENV === "local",
});

/**
 * Görsel CDN host'u sabit yazılmaz; NEXT_PUBLIC_IMAGE_BASE_URL'den türetilir.
 * Ortam değiştiğinde next.config'e dokunmak gerekmesin diye.
 */
function imageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const base = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
  if (!base) return [];

  try {
    const url = new URL(base);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/**",
      },
    ];
  } catch {
    console.warn(
      `[next.config] NEXT_PUBLIC_IMAGE_BASE_URL geçerli bir URL değil: ${base}`
    );
    return [];
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_IMAGE_BASE_URL: process.env.NEXT_PUBLIC_IMAGE_BASE_URL,
    NEXT_PUBLIC_FINE3D_URL: process.env.NEXT_PUBLIC_FINE3D_URL,
    NEXT_PUBLIC_LOG_API_SECRET: process.env.NEXT_PUBLIC_LOG_API_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET,
    LOG_API_SECRET: process.env.LOG_API_SECRET,
  },
  reactStrictMode: process.env.NODE_ENV === "production",
  productionBrowserSourceMaps: false,
  output: "standalone",

  // D4 (docs/API_ADAPTER.md §4): referans projede ikisi de `true` idi ve tip
  // hataları build'de gizleniyordu. Yeni projede kapalı — hatalar build'de patlasın.
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Büyük paketlerin tamamını derlemek yerine yalnızca kullanılan dosyayı alır.
  // Tarih seçici ve lab varsayılan listede yok; proje sayfası onları her açılışta yüklüyor.
  experimental: {
    optimizePackageImports: ["@mui/x-date-pickers", "@mui/lab", "@mui/system"],
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  images: {
    remotePatterns: imageRemotePatterns(),
  },

  /**
   * Yerel geliştirme için isteğe bağlı API proxy'si. API_PROXY_TARGET tanımlıysa
   * (örn. http://localhost:5000) `/hubapi/*` istekleri aynı origin üzerinden o
   * hedefe aktarılır; NEXT_PUBLIC_API_URL de http://localhost:3000/hubapi
   * yapılır. Böylece tarayıcı farklı porta (CORS) istek atmaz. Tanımlı değilse
   * hiçbir yönlendirme eklenmez — test/prod davranışı değişmez.
   */
  async rewrites() {
    const target = process.env.API_PROXY_TARGET?.replace(/\/+$/, "");
    if (!target) return [];
    return [{ source: "/hubapi/:path*", destination: `${target}/hubapi/:path*` }];
  },
};

module.exports = withNextIntl(withPWA(nextConfig));

import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import { generateSignature } from "./generateSignature";
import { localStorageService } from "./localStorageService";

const detectPlatform = (): string => {
  const ua = navigator.userAgent;

  if (/windows phone/i.test(ua)) return "Windows Phone";
  if (/android/i.test(ua)) return "Android";
  if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";

  return "unknown";
};

/**
 * Yakalanmamış client hatasını imzalayıp `/api/client-log`'a gönderir.
 *
 * Hata gönderimi ASLA yeni bir hata fırlatmamalı — aksi halde
 * `useGlobalErrorListener` ile sonsuz döngüye girer.
 */
export const logClientError = async (error: any): Promise<void> => {
  try {
    const secret = process.env.NEXT_PUBLIC_LOG_API_SECRET;
    if (!secret) return;

    const payload = {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      url: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: detectPlatform(),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      devicePixelRatio: window.devicePixelRatio,
      online: navigator.onLine,
      errorType: "client",
      time: new Date().toISOString(),
      performanceNow: performance.now(),
      userId: localStorageService.getItem(LocalStorageKeysEnum.UserId) ?? null,
      username: localStorageService.getItem(LocalStorageKeysEnum.Username) ?? null,
    };

    const signature = await generateSignature(payload, secret);

    // Dev sunucusunda her hata /api/client-log derlemesini tetikliyor ve paneli
    // kilitleyebiliyor; yerelde yalnızca konsola yaz.
    if (process.env.NODE_ENV !== "production") {
      console.log("Client Error Log:", payload, signature);
      return;
    }

    await fetch("/api/client-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, signature }),
    });
  } catch {
    // Loglama başarısızlığı sessizce yutulur (döngü koruması).
  }
};

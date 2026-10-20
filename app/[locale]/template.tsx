"use client";

/**
 * Locale altındaki her sayfa geçişinde yumuşak fade — sert kesmeyi önler.
 * `prefers-reduced-motion` açıksa animasyon globals.css'te kapanır.
 */
export default function LocaleTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-fade">{children}</div>;
}

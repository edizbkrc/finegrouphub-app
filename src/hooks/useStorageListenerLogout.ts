"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { clearLocalStorage } from "@helpers/Auth/logout";

/**
 * Sekmeler arası logout senkronu.
 *
 * Bir sekmede çıkış yapıldığında localStorage anahtarları silinir; `storage`
 * olayı diğer sekmelere düşer ve onlar da login ekranına yönlendirilir.
 */
export function useStorageListenerLogout() {
  const locale = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    const isLoginScreen =
      pathname === "/" || pathname === "/tr" || pathname === "/en";

    const handleStorageChange = (event: StorageEvent) => {
      const isKeyRemoved =
        event.storageArea === localStorage &&
        event.oldValue !== null &&
        event.newValue === null;

      if (isKeyRemoved && !isLoginScreen) {
        clearLocalStorage();
        window.location.href = `/${locale}`;
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
    // `locale` referansta bağımlılık listesinde yoktu; dil değişince eski
    // locale'e yönlendiren kapanış kalıyordu.
  }, [pathname, locale]);
}

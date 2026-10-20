"use client";

import { useEffect, useRef, useState } from "react";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import getAccessToken from "@helpers/Auth/getAccessToken";
import { getAppLanguage } from "@helpers/Auth/getAppLanguage";

/**
 * Çalışma alanı kilidi.
 *
 * Kilit kare başına değil, varlığın (etap, blok, kat…) bütün çalışma alanı içindir ve API her
 * yazmada (`validateLock`) başkasının canlı kilidini reddeder. Panel kilidi hiç almadığı için bu
 * koruma devrede değildi: iki kişi aynı etabı açıp birbirinin poligonlarını ezebiliyordu.
 *
 * Süre `ApplicationSettings.WorkspaceLockMinute`'tan gelir (varsayılan 5 dk); kilit yarı ömründe
 * yenilenir. Kilit başkasındaysa ekran salt okunur kalır ve kilit boşalınca kendiliğinden alınır.
 */
export type WorkspaceLockStatus = "idle" | "acquiring" | "owned" | "lockedByOther";

interface IWorkspaceLockTarget {
  projectId: number;
  entityType: number | "" | null | undefined;
  entityId: number | "" | null | undefined;
}

/** Başkasının kilidi düşsün diye yeniden deneme aralığı. */
const RETRY_MS = 30_000;
/** Yanıttaki bitiş anı okunamazsa kullanılacak yenileme aralığı (kilit en kısa 1 dk sayılır). */
const FALLBACK_RENEW_MS = 30_000;

const buildBody = ({ projectId, entityType, entityId }: IWorkspaceLockTarget) => ({
  projectId,
  entityType: Number(entityType),
  entityId: Number(entityId),
});

/** Bitiş anına kalan sürenin yarısı; çok kısa ya da okunamazsa sabit aralık. */
const renewDelayFrom = (expiresAt: unknown): number => {
  const expiresMs = typeof expiresAt === "string" ? Date.parse(expiresAt) : NaN;
  if (Number.isNaN(expiresMs)) return FALLBACK_RENEW_MS;
  return Math.max(10_000, (expiresMs - Date.now()) / 2);
};

/**
 * Sayfa kapanırken axios isteği yarıda kesilir; `keepalive` fetch tarayıcı kapansa da gider.
 * Gitmezse kilit süresi dolunca zaten düşer.
 */
const unlockOnPageHide = (body: ReturnType<typeof buildBody>) => {
  const token = getAccessToken();
  if (!token) return;
  try {
    void fetch(`${process.env.NEXT_PUBLIC_API_URL}${ApiRoutes.WorkspaceUnlock}`, {
      method: "PUT",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
        "Accept-Language": getAppLanguage(),
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Kilit süresi dolunca düşer.
  }
};

export function useWorkspaceLock(target: IWorkspaceLockTarget) {
  const [status, setStatus] = useState<WorkspaceLockStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { projectId, entityType, entityId } = target;
  const valid =
    Number.isFinite(projectId) &&
    projectId > 0 &&
    entityType !== "" &&
    entityType != null &&
    entityId !== "" &&
    entityId != null;

  useEffect(() => {
    if (!valid) {
      setStatus("idle");
      return;
    }

    const body = buildBody({ projectId, entityType, entityId });
    let cancelled = false;
    let owned = false;

    const schedule = (fn: () => void, ms: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(fn, ms);
    };

    const acquire = async () => {
      if (cancelled) return;
      try {
        // Başkasının kilidi beklenen bir durum; hata toast'ı yerine ekranda uyarı gösterilir.
        const response = await axiosInstance.post(ApiRoutes.WorkspaceLock, body, {
          withoutToast: true,
          withoutErrorToast: true,
        });
        if (cancelled) return;
        if (response.data?.isSuccess) {
          owned = true;
          setStatus("owned");
          schedule(renew, renewDelayFrom(response.data.data));
        } else {
          owned = false;
          setStatus("lockedByOther");
          schedule(acquire, RETRY_MS);
        }
      } catch {
        // Ağ hatası: kilidi bilemiyoruz; yazmayı API zaten korur, tekrar dene.
        if (!cancelled) schedule(acquire, RETRY_MS);
      }
    };

    const renew = async () => {
      if (cancelled) return;
      try {
        const response = await axiosInstance.put(ApiRoutes.WorkspaceLockRenew, body, {
          withoutToast: true,
          withoutErrorToast: true,
        });
        if (cancelled) return;
        if (response.data?.isSuccess) {
          schedule(renew, renewDelayFrom(response.data.data));
        } else {
          // Kilit düşmüş (bilgisayar uykuya girdi vb.); yeniden almayı dene.
          owned = false;
          void acquire();
        }
      } catch {
        if (!cancelled) schedule(renew, FALLBACK_RENEW_MS);
      }
    };

    const onPageHide = () => {
      if (owned) unlockOnPageHide(body);
    };

    setStatus("acquiring");
    void acquire();
    window.addEventListener("pagehide", onPageHide);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("pagehide", onPageHide);
      if (owned) {
        void axiosInstance
          .put(ApiRoutes.WorkspaceUnlock, body, { withoutToast: true, withoutErrorToast: true })
          .catch(() => undefined);
      }
    };
  }, [valid, projectId, entityType, entityId]);

  return {
    status,
    /** Kilit başkasında: yazma eylemleri kapatılmalı. */
    readOnly: status === "lockedByOther",
  };
}

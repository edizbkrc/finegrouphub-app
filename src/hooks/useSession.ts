"use client";

import { useEffect, useState } from "react";
import type { ISessionPayload } from "@/types/ISession";

/**
 * httpOnly session cookie'sinin içeriğini `/api/getsession` üzerinden okur.
 * Cookie yalnızca `{ id, token }` taşır; access token burada DEĞİLDİR.
 */
function useSession() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ISessionPayload["data"] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSession = async () => {
      try {
        const response = await fetch("/api/getsession", { method: "GET" });

        if (cancelled) return;

        if (response.ok) {
          const body = await response.json();
          setSession(body?.data?.data ?? null);
        } else {
          setSession(null);
        }
      } catch {
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return [session, loading] as const;
}

export default useSession;

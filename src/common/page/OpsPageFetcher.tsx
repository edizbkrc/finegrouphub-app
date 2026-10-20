"use client";

import { cloneElement, useCallback, useEffect, useState, type ReactElement } from "react";
import dynamic from "next/dynamic";
import { Grid, Skeleton } from "@mui/material";
import axiosInstance from "@network/axiosInstance";

const NotFoundComponent = dynamic(() => import("@components/NotFoundComponent"));

interface IOpsPageFetcherProps {
  url: string;
  params: Record<string, unknown>;
  children: ReactElement<{ data?: unknown; reFetch?: () => void }>;
}

/**
 * Sunucu sayfasından gelen `url`+`params` ile detayı çeker; `children`'a
 * `{ data, reFetch }` enjekte eder.
 */
export default function OpsPageFetcher({ url, params, children }: IOpsPageFetcherProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<unknown>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    axiosInstance
      .get(url, { params, withoutToast: true })
      .then((res) => {
        setData(res?.data?.isSuccess ? res.data.data : null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [url, params]);

  useEffect(() => {
    fetchData();
    // ⚠️ Referansta `loading` yalnızca ilk mount'ta true idi; `params`/`url`
    // değişip yeniden fetch tetiklendiğinde loading state'e geri dönülmüyordu
    // — kullanıcı eski veriyi (veya NotFoundComponent'i) bir an görebiliyordu.
    // Tekilleştirilen `fetchData` her çağrıda `setLoading(true)` yapıyor.
  }, [fetchData]);

  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid size={12}>
          <Skeleton variant="rounded" width="100%" height="20vh" />
        </Grid>
        <Grid size={12}>
          <Skeleton variant="rounded" width="100%" height="60vh" />
        </Grid>
      </Grid>
    );
  }

  if (data === null) return <NotFoundComponent />;

  return cloneElement(children, { data, reFetch: fetchData });
}

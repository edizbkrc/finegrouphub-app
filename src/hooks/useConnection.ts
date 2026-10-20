"use client";

import { useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import { getConnectionErrorMessage } from "@helpers/Network/getConnectionErrorMessage";

/** Çevrimdışı olunduğunda kullanıcıyı uyarır. */
export function useConnection() {
  useEffect(() => {
    const handleOffline = () => {
      enqueueSnackbar(getConnectionErrorMessage(), {
        variant: "error",
        autoHideDuration: 4000,
      });
    };

    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, []);
}

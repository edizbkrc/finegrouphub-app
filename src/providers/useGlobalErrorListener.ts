"use client";

import { useEffect } from "react";
import { logClientError } from "@helpers/Common/clientLogger";

/** Yakalanmamış hataları ve reddedilmiş promise'leri /api/client-log'a gönderir. */
export const useGlobalErrorListener = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logClientError(event.error ?? new Error(event.message));
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      logClientError(event.reason ?? new Error("Unhandled Rejection"));
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);
};

"use client";

import { useEffect } from "react";
import { logClientError } from "@helpers/Common/clientLogger";

/**
 * Kök layout'un kendisi patladığında devreye girer. Kendi <html>/<body>
 * kabuğunu taşımak zorundadır — bu noktada layout ağacı yok.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientError(error);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 16,
        }}
      >
        <div>
          <h1 style={{ marginBottom: 8 }}>Bir şeyler ters gitti</h1>
          <p style={{ opacity: 0.7, marginBottom: 16 }}>
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "8px 20px",
              borderRadius: 10,
              border: "1px solid currentColor",
              background: "transparent",
              cursor: "pointer",
              font: "inherit",
            }}
          >
            Tekrar dene / Try again
          </button>
        </div>
      </body>
    </html>
  );
}

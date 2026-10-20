"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { logClientError } from "@helpers/Common/clientLogger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Uygulama kökündeki hata sınırı.
 *
 * ⚠️ Referanstaki sürüm `getDerivedStateFromError` ile `hasError`'ı set ediyor
 * ama `render()` her koşulda `children` döndürüyordu — yani patlayan ağaç
 * yeniden render edilip tekrar patlıyordu. Sınır, loglayan ama aslında hiçbir
 * şeyi durdurmayan ölü koddu. Burada fallback gerçekten render edilir.
 */
export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logClientError(
      Object.assign(error, { componentStack: errorInfo.componentStack })
    );
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultFallback />;
    }

    return this.props.children;
  }
}

function DefaultFallback() {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        padding: 16,
        textAlign: "center",
      }}
    >
      <div>
        <h2 style={{ marginBottom: 8 }}>Bir şeyler ters gitti</h2>
        <p style={{ opacity: 0.7, marginBottom: 16 }}>
          Something went wrong. Please reload the page.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            border: "1px solid currentColor",
            background: "transparent",
            cursor: "pointer",
            font: "inherit",
          }}
        >
          Yenile / Reload
        </button>
      </div>
    </div>
  );
}

"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Box, Typography } from "@mui/material";
import { logClientError } from "@helpers/Common/clientLogger";
import NotFoundLottie from "@/assets/lottie/notfound.json";

const Player = dynamic(() => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player), { ssr: false });

function DefaultFallback() {
  // ⚠️ Referansta bu metin sabit İngilizceydi, hiç `t()` uygulanmamıştı —
  // Türkçe arayüzde de İngilizce görünüyordu (kural #8 ihlali).
  const t = useTranslations("Common");
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", mt: 5, textAlign: "center" }}>
      <Player autoplay loop src={NotFoundLottie} style={{ height: "200px", width: "200px" }} />
      <Typography variant="h6" sx={{ color: "text.secondary", mt: 2, fontWeight: "medium" }}>
        {t("SomethingWentWrong")}
      </Typography>
    </Box>
  );
}

interface IErrorBoundaryProps {
  fallback?: ReactNode;
  children: ReactNode;
}

interface IErrorBoundaryState {
  hasError: boolean;
}

/** Form alt ağacındaki hataları izole eder — tüm sayfayı çökertmez. */
export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  state: IErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): IErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logClientError(error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? <DefaultFallback />;
    return this.props.children;
  }
}

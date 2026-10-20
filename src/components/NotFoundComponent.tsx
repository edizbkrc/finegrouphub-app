"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Box, Button, Typography } from "@mui/material";
import NotFoundLottie from "@/assets/lottie/notfound.json";

const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
);

interface INotFoundComponentProps {
  message?: string;
  width?: number | string;
  height?: number | string;
  mt?: number;
  backHref?: string;
}

export default function NotFoundComponent({
  message,
  width,
  height,
  mt,
  backHref,
}: INotFoundComponentProps) {
  const t = useTranslations();
  const title = message || t("Table.NotFound");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        mt: mt ?? 5,
        textAlign: "center",
      }}
    >
      <Player
        autoplay
        loop
        src={NotFoundLottie}
        style={{ height: height || "200px", width: width || "200px" }}
      />
      <Typography variant="h6" sx={{ color: "text.secondary", mt: 2, fontWeight: "medium" }}>
        {title}
      </Typography>
      {backHref && (
        <Link href={backHref}>
          <Button
            variant="text"
            sx={{
              mt: 2,
              color: "primary.main",
              textTransform: "none",
              fontSize: "16px",
              fontWeight: 500,
              "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
            }}
          >
            {/* ⚠️ Referansta bu metin sabit Türkçe idi ("Geri Dön") — İngilizce
                arayüzde de Türkçe görünüyordu (kural #8 ihlali). */}
            {t("Button.Back")}
          </Button>
        </Link>
      )}
    </Box>
  );
}

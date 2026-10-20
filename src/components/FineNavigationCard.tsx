"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Box, Typography, type SxProps } from "@mui/material";

/**
 * Production hub'daki görsel kenarlı gezinme kartı.
 * Referanstaki sabit lacivert zemin yerine tema token'ları kullanılır; böylece
 * açık/koyu mod ve turuncu vurgu paneldeki diğer kartlarla tutarlı kalır.
 */
export default function FineNavigationCard({
  label,
  href,
  imageUrl,
  active = false,
  dataCy,
  sx,
}: {
  label: string;
  /** Locale öneki içermez; kart kendisi ekler. */
  href: string;
  imageUrl: string;
  active?: boolean;
  dataCy?: string;
  sx?: SxProps;
}) {
  const locale = useLocale();
  // Görsel yüklenemezse kart boş kalmasın diye yer tutucuya düşülür.
  const [hasError, setHasError] = useState(false);

  return (
    <Link href={`/${locale}${href}`} prefetch style={{ display: "contents" }} data-cy={dataCy}>
      <Box
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          bgcolor: "background.paper",
          color: "text.primary",
          border: "1px solid",
          borderColor: active ? "primary.main" : "divider",
          borderRadius: "10px",
          position: "relative",
          width: "100%",
          height: 150,
          overflow: "hidden",
          transition: "border-color .2s ease, box-shadow .2s ease",
          "&:hover": { borderColor: "primary.main", boxShadow: 2 },
          ...sx,
        }}
      >
        {/* Metin görselin üstünde kalsın diye zIndex verilir. */}
        <Typography variant="h5" sx={{ position: "relative", zIndex: 1, fontWeight: 700, color: active ? "primary.main" : "text.primary" }}>
          {label}
        </Typography>
        <Box sx={{ position: "absolute", top: -30, right: -50, opacity: 0.9 }}>
          <Image alt={label} width={230} height={230} src={hasError ? "/placeholder.png" : imageUrl} unoptimized onError={() => setHasError(true)} />
        </Box>
      </Box>
    </Link>
  );
}

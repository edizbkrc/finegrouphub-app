import { Box } from "@mui/material";

/**
 * Sayfa içeriği kabı.
 *
 * ⚠️ Referansta arka plan `tableBg.main` olarak veriliyordu — böyle bir palet
 * slotu temada TANIMLI DEĞİL, dolayısıyla arka plan hiç uygulanmıyordu.
 * Temada var olan `contentBackground` kullanılıyor.
 */
export default function OpsLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box component="section" sx={{ p: [2, 4], backgroundColor: "contentBackground.main" }}>
      {children}
    </Box>
  );
}

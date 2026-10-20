import type { ReactNode } from "react";
import { Stack, Typography } from "@mui/material";

/** Detay kartlarında "etiket — değer" satırı. */
export default function InfoRow({ label, value, strong = false }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.75 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: "right", fontWeight: strong ? 700 : 500 }}>
        {value ?? "-"}
      </Typography>
    </Stack>
  );
}

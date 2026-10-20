import { Box, Typography } from "@mui/material";
import { getTranslations } from "next-intl/server";

export default async function NotFoundPage() {
  const t = await getTranslations();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Box textAlign="center">
        <Typography variant="h3" color="text.primary" gutterBottom>
          404
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t("Common.PageNotFound")}
        </Typography>
      </Box>
    </Box>
  );
}

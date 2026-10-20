"use client";

import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useTranslations } from "next-intl";

interface DayNightToggleProps {
  nightPreview: boolean;
  hasNightImage: boolean;
  onSelectDay: () => void;
  onSelectNight: () => void;
}

/** Panorama üzerinde gündüz / gece geçişi — ayrı tur yoktur. */
export default function DayNightToggle({
  nightPreview,
  hasNightImage,
  onSelectDay,
  onSelectNight,
}: DayNightToggleProps) {
  const t = useTranslations("VirtualTourBuilder");

  return (
    <Box
      sx={{
        position: "absolute",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        pointerEvents: "none",
      }}
    >
      <ToggleButtonGroup
        exclusive
        value={nightPreview ? "night" : "day"}
        onChange={(_, value) => {
          if (value === "night") onSelectNight();
          if (value === "day") onSelectDay();
        }}
        sx={{
          pointerEvents: "auto",
          bgcolor: "rgba(15,18,28,0.78)",
          backdropFilter: "blur(10px)",
          borderRadius: 999,
          p: 0.5,
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          "& .MuiToggleButton-root": {
            color: "#fff",
            border: 0,
            borderRadius: "999px !important",
            px: 2.5,
            py: 0.75,
            textTransform: "none",
            fontWeight: 700,
            "&.Mui-selected": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": { bgcolor: "primary.dark" },
            },
          },
        }}
      >
        <ToggleButton value="day" data-cy="tour-day-view">
          <LightModeIcon sx={{ mr: 1, fontSize: 18 }} />
          {t("dayView")}
        </ToggleButton>
        <ToggleButton value="night" data-cy="tour-night-view">
          <DarkModeIcon sx={{ mr: 1, fontSize: 18 }} />
          {t("nightView")}
        </ToggleButton>
      </ToggleButtonGroup>
      {!hasNightImage && (
        <Typography
          variant="caption"
          sx={{
            color: "#fff",
            bgcolor: "rgba(0,0,0,0.5)",
            px: 1.5,
            py: 0.5,
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          {t("dayNightHint")}
        </Typography>
      )}
    </Box>
  );
}

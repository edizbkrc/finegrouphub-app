import type { ComponentType } from "react";
import { Stack, Tooltip, Typography, type SxProps } from "@mui/material";

interface IOpsInfoCardProps {
  sx?: SxProps;
  IconComponent: ComponentType<{ sx?: SxProps }>;
  title: string;
  value: string;
  onClick?: () => void;
  disabledHover?: boolean;
}

export default function OpsInfoCard({ sx, IconComponent, title, value, onClick, disabledHover }: IOpsInfoCardProps) {
  return (
    <Tooltip title={value} disableHoverListener={disabledHover || value.length <= 20}>
      <Stack
        direction="row"
        sx={{ px: [1, 2], py: 1, borderRadius: "10px", backgroundColor: "itemBackground.main", alignItems: "center", cursor: onClick ? "pointer" : "default", ...sx }}
        onClick={onClick}
      >
        <IconComponent sx={{ fontSize: "24px" }} />
        <Stack direction="column" sx={{ ml: [1, 2] }}>
          <Typography variant="h6" sx={{ fontSize: "12px" }}>
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="borderHoverd.main"
            sx={{
              fontSize: "16px",
              maxWidth: disabledHover ? undefined : 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: disabledHover ? undefined : "nowrap",
            }}
          >
            {value || "-"}
          </Typography>
        </Stack>
      </Stack>
    </Tooltip>
  );
}

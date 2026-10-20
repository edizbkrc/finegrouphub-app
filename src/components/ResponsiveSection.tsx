"use client";

import type { ReactNode } from "react";
import Grid, { type GridSize } from "@mui/material/Grid";
import { Box, useMediaQuery, useTheme, type Breakpoint, type SxProps } from "@mui/material";
import CustomTabs from "@components/CustomTabs";

type ResponsiveStyleValue<T> = T | Array<T | null> | { [key in Breakpoint]?: T | null };

interface ISection {
  label: string;
  component: ReactNode;
  icon?: string | React.ReactElement;
  size?: ResponsiveStyleValue<GridSize>;
  sx?: SxProps;
}

/** Geniş ekranda yan yana kartlar, dar ekranda sekmeler — aynı içerik iki farklı düzende. */
export default function ResponsiveSection({ sections, breakPoint, defaultTab }: { sections: ISection[]; breakPoint?: Breakpoint; defaultTab?: number }) {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up(breakPoint || "lg"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isScroll = isMobile && sections.length > 3;

  if (isLargeScreen) {
    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {sections.map((section, index) => (
          <Grid key={index} sx={section.sx} size={section?.size || { xs: 12, sm: 12, md: 12, lg: Math.floor(12 / sections.length) as GridSize }}>
            {section?.component}
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      <Box sx={{ width: "100%" }}>
        <CustomTabs
          tabs={sections.map(({ label, component, icon }) => ({ label, content: component, icon }))}
          variant={isScroll ? "scrollable" : "fullWidth"}
          propsValue={defaultTab}
        />
      </Box>
    </Grid>
  );
}

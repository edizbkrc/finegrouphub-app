import React from "react";
import { Box, Paper, Skeleton, Stack } from "@mui/material";
import Grid from "@mui/material/Grid";

const DashboardSkeleton = () => {
  return (
    <Box>
      <Grid container spacing={4}>
        {/* Ana gelir/gider bölümü */}
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 8 }}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Stack direction={"row"} spacing={1} alignItems="center">
              <Skeleton variant="text" width={150} height={40} />
              <Skeleton variant="text" width={100} height={24} />
            </Stack>

            <Grid
              container
              spacing={2}
              mt={2}
              sx={{
                backgroundColor: "contentBackground.main",
                p: 2,
                borderRadius: "10px",
              }}
            >
              <Grid size={{ xs: 12, sm: 12, md: 12, lg: 6 }}>
                <Paper sx={{ p: 2, display: "flex", alignItems: "center" }}>
                  <Skeleton variant="circular" width={80} height={80} />
                  <Stack direction="column" sx={{ ml: 2, flexGrow: 1 }}>
                    <Skeleton variant="text" width={60} height={20} />
                    <Skeleton variant="text" width={100} height={30} />
                  </Stack>
                  <Skeleton variant="rounded" width={80} height={40} />
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 12, lg: 6 }}>
                <Paper
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "transparent",
                  }}
                  elevation={0}
                >
                  <Skeleton variant="circular" width={80} height={80} />
                  <Stack direction="column" sx={{ ml: 2, flexGrow: 1 }}>
                    <Skeleton variant="text" width={60} height={20} />
                    <Skeleton variant="text" width={100} height={30} />
                  </Stack>
                  <Skeleton variant="rounded" width={80} height={40} />
                </Paper>
              </Grid>
            </Grid>

            <Box mt={2} sx={{ width: "100%", height: 250 }}>
              <Skeleton variant="rectangular" width="100%" height={250} />
            </Box>
          </Paper>
        </Grid>

        {/* Yan bölüm - Proje ve Firma sayıları */}
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 4 }}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                  height: 225,
                  overflow: "hidden",
                }}
              >
                <Box flexGrow={1} sx={{ p: 1 }}>
                  <Skeleton variant="text" width={180} height={32} />
                  <Skeleton
                    variant="text"
                    width={50}
                    height={48}
                    sx={{ mt: 2 }}
                  />
                </Box>
                <Skeleton
                  variant="circular"
                  width={150}
                  height={150}
                  sx={{ position: "absolute", top: 20, right: 20 }}
                />
              </Paper>
            </Grid>
            <Grid size={12} sx={{ mt: 3 }}>
              <Paper
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                  height: 225,
                  overflow: "hidden",
                }}
              >
                <Box flexGrow={1} sx={{ p: 1 }}>
                  <Skeleton variant="text" width={180} height={32} />
                  <Skeleton
                    variant="text"
                    width={50}
                    height={48}
                    sx={{ mt: 2 }}
                  />
                </Box>
                <Skeleton
                  variant="circular"
                  width={150}
                  height={150}
                  sx={{ position: "absolute", top: 20, right: 20 }}
                />
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Zaman çizelgesi skeleton */}
      <Paper sx={{ p: 3, mt: 4 }} elevation={3}>
        <Skeleton variant="text" width={150} height={32} sx={{ mb: 3 }} />
        <Box sx={{ overflowX: "auto" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              gap: 3,
              flexWrap: "wrap",
            }}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <Stack
                direction={["column", "row"]}
                key={index}
                sx={{
                  alignItems: "center",
                }}
              >
                <Stack direction={"column"} spacing={1} alignItems="center">
                  <Skeleton variant="text" width={120} height={20} />
                  <Skeleton variant="rounded" width={100} height={10} />
                  <Skeleton variant="text" width={140} height={24} />
                </Stack>
                <Skeleton
                  variant="circular"
                  width={20}
                  height={20}
                  sx={{ ml: [0, 3], mt: [2, 0] }}
                />
              </Stack>
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default DashboardSkeleton;

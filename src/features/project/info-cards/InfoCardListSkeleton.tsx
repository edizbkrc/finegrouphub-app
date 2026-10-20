"use client";

import { Box, Card, CardContent, Grid, Skeleton, Tab, Tabs } from "@mui/material";

export default function InfoCardListSkeleton() {
  return (
    <>
      {[1, 2, 3].map((key) => (
        <Grid key={key} size={{ xs: 12, lg: 6 }}>
          <Card elevation={3}>
            <CardContent>
              <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
              <Tabs value={0}>
                {[1, 2].map((tab) => (
                  <Tab key={tab} label={<Skeleton variant="text" width={80} height={24} />} disabled />
                ))}
              </Tabs>
              <Grid container spacing={2} alignItems="flex-start" sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Skeleton variant="rectangular" height={240} sx={{ width: "100%", borderRadius: 2 }} />
                </Grid>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Skeleton variant="text" height={24} width="90%" />
                    <Skeleton variant="text" height={24} width="95%" />
                    <Skeleton variant="text" height={24} width="80%" />
                    <Skeleton variant="text" height={24} width="70%" />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </>
  );
}

import { memo } from "react";
import { Box, Grid, Paper, Skeleton } from "@mui/material";

const CARD_COUNT = 6;
const ROW_COUNT = 4;

function SkeletonCard() {
  return (
    <Grid size={{ xs: 12, md: 4 }}>
      <Paper elevation={3} sx={{ padding: 2, borderRadius: "10px" }}>
        <Skeleton variant="text" width="60%" height={40} sx={{ marginBottom: 3 }} />
        <Grid container spacing={3}>
          {Array.from({ length: ROW_COUNT }).map((_, index) => (
            <Grid size={12} key={index}>
              <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: "10px" }} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Grid>
  );
}

function OpsPageFormSkeleton() {
  return (
    <Box data-cy="ops-form-loading">
      <Skeleton variant="text" width="100%" height={150} sx={{ marginBottom: 3, borderRadius: "10px" }} />
      <Grid container spacing={3}>
        {Array.from({ length: CARD_COUNT }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </Grid>
    </Box>
  );
}

export default memo(OpsPageFormSkeleton);

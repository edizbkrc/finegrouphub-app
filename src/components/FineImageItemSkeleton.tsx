import { Box, Skeleton, Stack } from "@mui/material";

export default function FineImageItemSkeleton() {
  return (
    <Box sx={{ borderRadius: 2, boxShadow: 1, p: 2, bgcolor: "background.paper", height: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Skeleton variant="rounded" width={120} height={32} />
        <Skeleton variant="circular" width={24} height={24} />
      </Stack>

      <Skeleton variant="rectangular" height={200} sx={{ width: "100%", mt: 1, borderRadius: 1 }} />

      <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
        <Stack direction="row" alignItems="center" spacing={1} flexGrow={1}>
          <Skeleton variant="rounded" width={80} height={28} />
          <Skeleton variant="rounded" width={80} height={28} />
          <Skeleton variant="rounded" width={80} height={28} />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={64} height={32} />
          <Skeleton variant="rounded" width={64} height={32} />
        </Stack>
      </Stack>
    </Box>
  );
}

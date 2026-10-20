import { Box, CircularProgress } from "@mui/material";

export default function TableLoading() {
  return (
    <Box
      sx={{
        position: "absolute",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.1)",
      }}
    >
      <CircularProgress />
    </Box>
  );
}

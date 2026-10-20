import { Close } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";

export default function OpsModalHeader({
  title,
  handleClose,
}: {
  title: string;
  handleClose: () => void;
}) {
  return (
    <Box
      sx={{
        p: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "itemBackground.main",
      }}
    >
      <Typography variant="h5">{title}</Typography>
      <IconButton onClick={handleClose} aria-label="close" data-cy="modal-close">
        <Close sx={{ color: "text.primary" }} />
      </IconButton>
    </Box>
  );
}

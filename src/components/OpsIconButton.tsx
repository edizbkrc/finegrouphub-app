import { IconButton, styled } from "@mui/material";

const OpsIconButton = styled(IconButton)(({ theme }) => ({
  borderRadius: "10px",
  backgroundColor: theme.palette.itemBackground.main,
  color: theme.palette.mode === "light" ? "#595856" : "#fff",
  ":hover": {
    backgroundColor: theme.palette.secondary.main,
    color: "#fff",
  },
}));

export default OpsIconButton;

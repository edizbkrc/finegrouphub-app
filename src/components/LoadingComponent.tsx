"use client";

import dynamic from "next/dynamic";
import { Backdrop } from "@mui/material";
import LottieFile from "@/assets/lottie/loading-finehub.json";

const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
);

export default function LoadingComponent({ open }: { open: boolean }) {
  return (
    <Backdrop
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 999999 }}
      open={open}
    >
      <Player
        autoplay
        loop
        src={LottieFile}
        style={{ height: "200px", width: "200px" }}
      />
    </Backdrop>
  );
}

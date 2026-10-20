"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Box, Drawer, useScrollTrigger } from "@mui/material";
import { useOpsModal } from "@hooks/useOpsModal";

/** OpsForm'u saran sağdan açılan drawer. `useOpsModal` ile görünürlük yönetilir. */
export default function OpsFormModal({
  children,
  setTrigger,
}: {
  children: ReactNode;
  setTrigger?: (trigger: boolean) => void;
}) {
  const { opsModalVisible, closeOpsModal } = useOpsModal();
  const [isReady, setIsReady] = useState(false);
  const [contentRef, setContentRef] = useState<HTMLElement | null>(null);

  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 0, target: contentRef ?? undefined });

  useEffect(() => setTrigger?.(trigger), [trigger, setTrigger]);
  useEffect(() => setIsReady(true), []);

  return (
    <Drawer
      open={opsModalVisible && isReady}
      onClose={closeOpsModal}
      anchor="right"
      data-cy="ops-modal-content"
      sx={{
        "& .MuiDrawer-paper": {
          width: "100%",
          maxWidth: ["100%", 500, 600],
          overflow: "hidden",
          overflowY: "auto",
          p: 1,
          pt: 0,
          pl: 2,
          borderRadius: "10px",
          backgroundImage: "none",
          backgroundColor: "card2.main",
        },
      }}
    >
      <Box sx={{ p: 4, px: 2, borderRadius: "10px", overflowY: "auto", position: "relative", height: "100%" }} ref={setContentRef}>
        {children}
      </Box>
    </Drawer>
  );
}

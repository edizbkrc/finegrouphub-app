"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import LoadingComponent from "@components/LoadingComponent";
import OpsModalHeader from "@components/OpsModalHeader";
import { Divider, Drawer } from "@mui/material";
import CompanyStatusUpdate from "./CompanyStatusUpdate";

type CompanyMainDrawerProps = {
  data?: any;
  isOpen: boolean;
  handleClose: (isRefresh?: boolean) => void;
};

/** Firma durum güncelleme çekmecesi (sağdan açılır). */
const CompanyMainDrawer = ({ isOpen, handleClose, data }: CompanyMainDrawerProps) => {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={() => handleClose(false)}
      sx={{
        "& .MuiDrawer-paper": {
          width: "100%",
          maxWidth: ["100%", 500, 600],
          overflow: "hidden",
          overflowY: "auto",
          pt: 0,
          borderRadius: "10px",
          backgroundImage: "none",
          backgroundColor: "card2.main",
        },
      }}
    >
      <LoadingComponent open={loading} />
      <OpsModalHeader title={t("Tenant.TenantStatusUpdate")} handleClose={() => handleClose(false)} />
      <Divider />
      <CompanyStatusUpdate data={data} setLoading={setLoading} handleClose={handleClose} />
    </Drawer>
  );
};

export default CompanyMainDrawer;

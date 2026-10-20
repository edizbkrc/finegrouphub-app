import { memo } from "react";
import { useTranslations } from "next-intl";
import { Box, Typography } from "@mui/material";
import { AuditFieldsList, type IAuditInfo } from "@common/page/AuditFieldsList";

function OpsFormAuditInfo({ auditInfo }: { auditInfo?: IAuditInfo }) {
  const t = useTranslations("Form");

  return (
    <Box sx={{ borderRadius: "10px", boxShadow: 1, mt: 4, overflow: "auto", backgroundColor: "background.default", width: "100%" }}>
      <Typography sx={{ p: 2, py: 1, fontWeight: "Bold", fontSize: "20px", width: "100%" }}>{t("Info")}</Typography>
      <AuditFieldsList auditInfo={auditInfo} />
    </Box>
  );
}

export default memo(OpsFormAuditInfo);

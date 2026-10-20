import { useTranslations } from "next-intl";
import { Grid, InputLabel, Tooltip, Typography } from "@mui/material";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";

export interface IAuditInfo {
  creationDate?: string;
  creatorUserName?: string;
  lastModificationDate?: string;
  lastModifierUserName?: string;
}

/**
 * `creationDate/creatorUserName/lastModificationDate/lastModifierUserName`
 * satırlarını render eder. Referansta `OpsFormAuditInfo` (modal formu) ve
 * `OpsPageFormHeader` (tam sayfa formu) bu mantığı birebir kopyalamıştı.
 */
export function AuditFieldsList({ auditInfo, width }: { auditInfo?: IAuditInfo; width?: string }) {
  const t = useTranslations("Form");

  const auditFields: Record<string, string> = {
    creationDate: auditInfo?.creationDate ? getLocalizedMoment(auditInfo.creationDate).format("LLL") : "",
    creatorUserName: auditInfo?.creatorUserName ?? "",
    lastModificationDate: auditInfo?.lastModificationDate ? getLocalizedMoment(auditInfo.lastModificationDate).format("LLL") : "-",
    lastModifierUserName: auditInfo?.lastModifierUserName ?? "",
  };

  return (
    <>
      {Object.keys(auditFields).map((key) => (
        <Grid
          container
          key={key}
          sx={{ borderBottom: "1px dashed", borderColor: "borderdashed.main", p: 2, "&:last-child": { borderBottom: "none" }, display: "flex", alignItems: "center", width }}
        >
          <Grid size={6}>
            <Tooltip title={t(key as never)} arrow>
              <InputLabel sx={{ fontSize: "16px" }}>{t(key as never)}</InputLabel>
            </Tooltip>
          </Grid>
          <Grid size={6} pl={2}>
            <Typography variant="body1" sx={{ fontWeight: "Bold" }}>
              {auditFields[key] || "-"}
            </Typography>
          </Grid>
        </Grid>
      ))}
    </>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Box, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import TuneIcon from "@mui/icons-material/Tune";
import type { IFeatureSpecification } from "@/features/offer/types";

function SectionLabel({ children }: { children: string }) {
  return (
    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.08em" }}>
      {children}
    </Typography>
  );
}

/** Proje teknik özellikleri: sayısal olanlar kutucuk, evet/hayır olanlar etiket olarak. */
export default function ProjectFeatureSpecs({ features }: { features: IFeatureSpecification[] }) {
  const t = useTranslations();
  const label = (spec: IFeatureSpecification) => spec.featureName ?? spec.featureAlias;

  const counts = features.filter((spec) => typeof spec.value !== "boolean");
  const toggles = features.filter((spec) => typeof spec.value === "boolean");

  return (
    <Grid size={{ xs: 12 }}>
      <Box
        sx={{
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: 2.5,
        }}
        data-cy="project-feature-specs"
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <TuneIcon color="primary" sx={{ width: 22, height: 22 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            {t("Offer.TechnicalSpecifications")}
          </Typography>
        </Stack>

        {features.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        )}

        {counts.length > 0 && (
          <>
            <SectionLabel>{t("Project.Quantities")}</SectionLabel>
            <Box
              sx={{
                mt: 1,
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)", xl: "repeat(6, 1fr)" },
              }}
            >
              {counts.map((spec) => (
                <Box
                  key={spec.featureAlias}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", px: 1.75, py: 1.5, minWidth: 0 }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                    {spec.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block" title={label(spec)}>
                    {label(spec)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}

        {counts.length > 0 && toggles.length > 0 && <Divider sx={{ my: 2.5 }} />}

        {toggles.length > 0 && (
          <>
            <SectionLabel>{t("Project.Features")}</SectionLabel>
            <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
              {toggles.map((spec) => (
                <Chip
                  key={spec.featureAlias}
                  variant="outlined"
                  color={spec.value ? "success" : "default"}
                  icon={spec.value ? <CheckCircleIcon /> : <RemoveCircleOutlineIcon />}
                  label={label(spec)}
                  sx={{ fontWeight: 600, ...(spec.value ? {} : { color: "text.disabled" }) }}
                />
              ))}
            </Stack>
          </>
        )}
      </Box>
    </Grid>
  );
}

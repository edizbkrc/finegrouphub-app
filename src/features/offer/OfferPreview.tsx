"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useLocale, useTranslations } from "next-intl";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ApiRoutes } from "@network/ApiRoutes";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";

interface IProvidedService {
  rowName?: string | null;
  unitPrice?: number | null;
  count: number;
  price?: number | null;
  vatPercentage?: number | null;
  displayOrder: number;
}

interface IFeaturePreview {
  name?: string | null;
  description?: string | null;
  displayOrder: number;
}

interface IOfferPreviewData {
  projectName?: string;
  companyName?: string;
  companyAddress?: string;
  text?: string | null;
  minDeliveryDurationInDays: number;
  maxDeliveryDurationInDays: number;
  discountAmount?: number;
  dailyMaintenancePriceWithoutVat?: number;
  maintenanceDurationInDays: number;
  totalVatAmount?: number;
  totalPriceWithoutVat?: number;
  totalPriceWithVat?: number;
  prePaymentAmountWithVat?: number;
  currencySymbol?: string;
  date?: string;
  expirationDate?: string;
  servicesProvided?: IProvidedService[];
  features?: IFeaturePreview[];
  extraPriceWithoutVat?: number;
  extraPriceWithVat?: number;
  extraPriceDescription?: string | null;
}

/**
 * Müşteriye gönderilen teklif önizlemesi. Oturum gerektirmez (middleware'de
 * public); API ucu da public: PATCH /v1/preview/offer { correlationId, offerId }.
 */
export default function OfferPreview({ correlationId, offerId }: { correlationId: string; offerId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<IOfferPreviewData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    axios
      .patch(
        `${process.env.NEXT_PUBLIC_API_URL}${ApiRoutes.PreviewOffer}`,
        { correlationId, offerId: Number(offerId) },
        { headers: { "Accept-Language": locale === "en" ? "en-US" : "tr-TR" } }
      )
      .then((res) => {
        if (res?.data?.isSuccess && res.data.data) {
          setData(res.data.data as IOfferPreviewData);
          setState("ready");
        } else setState("notfound");
      })
      .catch(() => setState("notfound"));
  }, [correlationId, offerId, locale]);

  if (state === "loading")
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );

  if (state === "notfound" || !data)
    return (
      <Container sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5">{t("OfferPreview.NotFound")}</Typography>
      </Container>
    );

  const symbol = data.currencySymbol || "₺";
  const money = (value?: number | null) =>
    `${new Intl.NumberFormat(locale === "en" ? "en-US" : "tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value ?? 0))} ${symbol}`;
  const date = (value?: string) => (value ? getLocalizedMoment(value).format("LL") : "-");
  const services = [...(data.servicesProvided ?? [])].filter((s) => s.count > 0).sort((a, b) => a.displayOrder - b.displayOrder);
  const features = [...(data.features ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack direction={["column", "row"]} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            {t("Offer.OfferPreview")}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {data.projectName}
          </Typography>
          <Typography color="text.secondary">{data.companyName}</Typography>
          {data.companyAddress && (
            <Typography variant="body2" color="text.secondary">
              {data.companyAddress}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: ["left", "right"] }}>
          <Typography variant="body2">
            {t("Form.Date")}: {date(data.date)}
          </Typography>
          <Typography variant="body2">
            {t("Form.ExpirationDate")}: {date(data.expirationDate)}
          </Typography>
          <Typography variant="body2">
            {t("Offer.DeliveryDurations")}:{" "}
            {t("Offer.DeliveryRange", { min: data.minDeliveryDurationInDays, max: data.maxDeliveryDurationInDays })}
          </Typography>
        </Box>
      </Stack>

      {data.text && (
        <Typography sx={{ whiteSpace: "pre-wrap", mb: 3 }}>{data.text}</Typography>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("OfferPreview.service")}</TableCell>
                <TableCell align="right">{t("Form.Count")}</TableCell>
                <TableCell align="right">{t("OfferPreview.UnitPriceColumn")}</TableCell>
                <TableCell align="right">{t("Form.Price")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service, index) => (
                <TableRow key={`${service.rowName}-${index}`}>
                  <TableCell>{service.rowName}</TableCell>
                  <TableCell align="right">{service.count}</TableCell>
                  <TableCell align="right">{money(service.unitPrice)}</TableCell>
                  <TableCell align="right">{money(service.price)}</TableCell>
                </TableRow>
              ))}
              {!!data.extraPriceWithoutVat && (
                <TableRow>
                  <TableCell colSpan={3}>{data.extraPriceDescription || t("Form.ExtraPriceWithoutVat")}</TableCell>
                  <TableCell align="right">{money(data.extraPriceWithoutVat)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Divider sx={{ my: 2 }} />
          <Grid container justifyContent="flex-end">
            <Grid size={{ xs: 12, sm: 7, md: 6 }}>
              {[
                [t("Form.DiscountAmount"), money(-(data.discountAmount ?? 0))],
                [t("OfferPreview.subtotal"), money(data.totalPriceWithoutVat)],
                [t("OfferPreview.vatTotal"), money(data.totalVatAmount)],
              ].map(([label, value]) => (
                <Stack key={label} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                  <Typography color="text.secondary">{label}</Typography>
                  <Typography>{value}</Typography>
                </Stack>
              ))}
              <Stack direction="row" justifyContent="space-between" sx={{ py: 1 }}>
                <Typography variant="h6">{t("Offer.TotalPriceWithVat")}</Typography>
                <Typography variant="h6" fontWeight={700}>
                  {money(data.totalPriceWithVat)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">{t("Form.PrePaymentAmountWithVat")}</Typography>
                <Typography>{money(data.prePaymentAmountWithVat)}</Typography>
              </Stack>
              {data.maintenanceDurationInDays > 0 && (
                <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
                  {t("OfferPreview.MaintenanceNote", {
                    days: data.maintenanceDurationInDays,
                    daily: money(data.dailyMaintenancePriceWithoutVat),
                  })}
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {features.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t("OfferPreview.IncludedFeatures")}
          </Typography>
          <Grid container spacing={2}>
            {features.map((feature, index) => (
              <Grid key={`${feature.name}-${index}`} size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography fontWeight={600}>{feature.name}</Typography>
                    {feature.description && (
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
}

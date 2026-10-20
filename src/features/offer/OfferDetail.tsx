"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import ArrowBack from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import AddIcon from "@mui/icons-material/Add";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import ReceiptIcon from "@mui/icons-material/Receipt";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import { OpsPageNames } from "@enums/OpsPageNames";
import { usePageAction } from "@hooks/usePageAction";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import { getCurrencyFormat } from "@helpers/Common/getCurrencyFormat";
import StateChangeDialog from "@components/dialogs/StateChangeDialog";
import CompleteOfferDialog from "./CompleteOfferDialog";
import OfferHistoryDrawer from "./OfferHistoryDrawer";
import OfferSendEmailDrawer from "./OfferSendEmailDrawer";
import { OfferStateEnum, type IOfferDetail, type IOfferHistoryItem } from "./types";

const STATE_COLOR: Record<number, "default" | "info" | "success" | "error" | "warning"> = {
  [OfferStateEnum.Draft]: "default",
  [OfferStateEnum.SentToCustomer]: "info",
  [OfferStateEnum.Completed]: "success",
  [OfferStateEnum.RejectedByCustomer]: "error",
  [OfferStateEnum.RejectedByFineHub]: "error",
  [OfferStateEnum.Versioned]: "warning",
};

const FROZEN = [OfferStateEnum.Completed, OfferStateEnum.Versioned];

// API'nin kabul ettiği hedef durumlar (OfferUpdateState): Müşteriye Gönderildi, iki red durumu.
const REJECT_STATES = [OfferStateEnum.RejectedByCustomer, OfferStateEnum.RejectedByFineHub];
const UPDATABLE_STATES = [OfferStateEnum.SentToCustomer, ...REJECT_STATES];

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.75 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: "right", fontWeight: 500 }}>
        {value ?? "-"}
      </Typography>
    </Stack>
  );
}

/**
 * Teklif detayı: özet kartlar + aksiyon çubuğu + versiyon geçmişi.
 * Aksiyonlar (finehub OfferDetailForm ile aynı): Önizleme, Geçmiş, Durum Güncelle,
 * E-posta, Tamamla (→ sipariş), Yeni Versiyon. Tamamlanmış/versiyonlanmış teklifte
 * (API kilitler) düğmeler gizlenmez, pasif kalır.
 */
export default function OfferDetail({ data, reFetch }: { data?: IOfferDetail; reFetch?: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [history, setHistory] = useState<IOfferHistoryItem[]>([]);
  const [stateOpen, setStateOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const canUpdateState = usePageAction(OpsPageNames.OfferManagement, "UpdateOfferState");
  const canComplete = usePageAction(OpsPageNames.OfferManagement, "CompleteOffer");
  const canNewVersion = usePageAction(OpsPageNames.OfferManagement, "CreateNewVersion");
  const canPreview = usePageAction(OpsPageNames.OfferManagement, "OfferPreview");

  useEffect(() => {
    if (!data?.correlationId) return;
    axiosInstance
      .get(ApiRoutes.OfferHistory, { params: { correlationId: data.correlationId }, withoutToast: true })
      .then((res) => setHistory((res?.data?.data as IOfferHistoryItem[]) ?? []))
      .catch(() => setHistory([]));
  }, [data?.correlationId, data?.state]);

  if (!data) return null;

  const price = data.priceSpecs ?? {};
  const currency = price.currencyDescription || "TRY";
  const money = (value?: number) => getCurrencyFormat(value ?? 0, currency);
  const date = (value?: string) => (value ? getLocalizedMoment(value).format("LL") : "-");
  const frozen = FROZEN.includes(data.state);

  const updateState = async ({ stateTo, reason }: { stateTo: number; reason: string }) => {
    const res = await axiosInstance
      .put(ApiRoutes.OfferState, { id: data.id, stateTo, rejectReason: reason || null })
      .catch(() => null);
    if (!res?.data?.isSuccess) return false;
    reFetch?.();
    return true;
  };

  return (
    <Box>
      <Stack direction={["column", "row"]} justifyContent="space-between" alignItems={["stretch", "center"]} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Link href={`/${locale}${Routes.Offers}`}>
            <Button startIcon={<ArrowBack />} color="inherit">
              {t("Form.Back")}
            </Button>
          </Link>
          <Box>
            <Typography variant="h5">{data.projectName}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Chip size="small" color={STATE_COLOR[data.state] ?? "default"} label={t(`OfferState.${data.state}`)} data-cy="offer-state" />
              <Typography variant="caption" color="text.secondary">
                #{data.id} · {data.tenant?.name}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        {/* Sağ üst: Önizleme + Geçmiş */}
        <Stack direction={["column", "row"]} spacing={1}>
          {canPreview && data.correlationId && (
            <Link href={`/${locale}/offer-preview/${data.correlationId}/${data.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outlined" startIcon={<ReceiptIcon />} fullWidth data-cy="offer-preview">
                {t("Offer.OfferPreview")}
              </Button>
            </Link>
          )}
          <Button variant="outlined" startIcon={<ManageSearchIcon />} onClick={() => setHistoryOpen(true)} data-cy="offer-history">
            {t("Offer.OfferHistory")}
          </Button>
        </Stack>
      </Stack>

      {/* Alt aksiyon çubuğu: Durum Güncelle, E-posta, Tamamla (→ sipariş), Yeni Versiyon */}
      <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
        {canUpdateState && (
          <Button variant="contained" startIcon={<AutorenewIcon />} disabled={frozen} onClick={() => setStateOpen(true)} data-cy="offer-state-update">
            {t("Offer.StateUpdate")}
          </Button>
        )}
        {canUpdateState && (
          <Button variant="contained" startIcon={<SendIcon />} disabled={frozen} onClick={() => setEmailOpen(true)} data-cy="offer-email">
            {t("Offer.SendEmail")}
          </Button>
        )}
        {canComplete && (
          <Button variant="contained" color="success" startIcon={<TaskAltIcon />} disabled={frozen} onClick={() => setCompleteOpen(true)} data-cy="offer-complete">
            {t("Offer.CompleteOrder")}
          </Button>
        )}
        {canNewVersion &&
          (frozen ? (
            <Button variant="outlined" startIcon={<AddIcon />} disabled data-cy="offer-new-version">
              {t("Offer.NewOffer")}
            </Button>
          ) : (
            <Link href={`/${locale}${Routes.Offer}/${data.id}/new-version`}>
              <Button variant="outlined" startIcon={<AddIcon />} data-cy="offer-new-version">
                {t("Offer.NewOffer")}
              </Button>
            </Link>
          ))}
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t("Offer.ProjectInfo")}
              </Typography>
              <InfoRow label={t("Form.Tenant")} value={data.tenant?.name} />
              <InfoRow label={t("Form.ProjectName")} value={data.projectName} />
              <InfoRow label={t("Form.FeatureGroups")} value={data.featureGroup?.name} />
              <InfoRow label={t("Form.Date")} value={date(data.date)} />
              <InfoRow label={t("Form.ExpirationDate")} value={date(data.expirationDate)} />
              <InfoRow
                label={t("Offer.DeliveryDurations")}
                value={t("Offer.DeliveryRange", { min: data.minDeliveryDurationInDays ?? 0, max: data.maxDeliveryDurationInDays ?? 0 })}
              />
              {data.text && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {data.text}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t("Offer.PricingAndCurrency")}
              </Typography>
              <InfoRow label={t("Form.Currency")} value={currency} />
              <InfoRow label={t("Offer.ServicePriceWithoutVat")} value={money(price.servicePriceWithoutVat)} />
              <InfoRow label={t("Offer.ServicePriceWithVat")} value={money(price.servicePriceWithVat)} />
              {!!price.extraPriceWithoutVat && (
                <InfoRow label={price.extraPriceDescription || t("Form.ExtraPriceWithoutVat")} value={money(price.extraPriceWithVat)} />
              )}
              <InfoRow label={t("Form.DiscountAmount")} value={money(price.discountAmount)} />
              <InfoRow
                label={t("Offer.Maintenance")}
                value={t("Offer.MaintenanceValue", {
                  days: price.maintenanceDurationInDays ?? 0,
                  daily: money(price.dailyMaintenancePriceWithVat),
                })}
              />
              <InfoRow label={t("Form.PrePaymentAmountWithVat")} value={money(price.prePaymentAmountWithVat)} />
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle1">{t("Offer.TotalPriceWithVat")}</Typography>
                <Typography variant="subtitle1" fontWeight={700} data-cy="offer-total">
                  {money(price.totalPriceWithVat)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t("Offer.TechnicalSpecifications")}
              </Typography>
              {(data.featureSpecifications ?? []).map((spec) => (
                <InfoRow
                  key={spec.featureAlias}
                  label={spec.featureName ?? spec.featureAlias}
                  value={typeof spec.value === "boolean" ? (spec.value ? t("Form.Yes") : t("Form.No")) : spec.value}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t("Offer.OfferHistory")}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>{t("Form.Date")}</TableCell>
                    <TableCell>{t("Form.State")}</TableCell>
                    <TableCell align="right">{t("Form.TotalPrice")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id} selected={item.id === data.id}>
                      <TableCell>
                        {item.id === data.id ? (
                          item.id
                        ) : (
                          <Link href={`/${locale}${Routes.Offer}/${item.id}`}>{item.id}</Link>
                        )}
                      </TableCell>
                      <TableCell>{date(item.date)}</TableCell>
                      <TableCell>{item.stateDescription}</TableCell>
                      <TableCell align="right">{money(item.totalPriceWithVat)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <StateChangeDialog
        open={stateOpen}
        title={t("Offer.StateUpdate")}
        enumName="OfferUpdateState"
        currentState={data.state}
        allowedStates={UPDATABLE_STATES}
        reasonLabel={t("Form.RejectReason")}
        reasonRequiredFor={REJECT_STATES}
        onClose={() => setStateOpen(false)}
        onSubmit={updateState}
      />
      {/* Tamamlanınca API oluşan siparişin id'sini döner → siparişe git. */}
      <CompleteOfferDialog
        open={completeOpen}
        offerId={data.id}
        onClose={() => setCompleteOpen(false)}
        onCompleted={(orderId) => {
          if (orderId) router.push(`/${locale}${Routes.Order}/${orderId}`);
          else reFetch?.();
        }}
      />
      <OfferHistoryDrawer isOpen={historyOpen} handleClose={() => setHistoryOpen(false)} data={data} />
      {emailOpen && (
        <OfferSendEmailDrawer
          isOpen={emailOpen}
          handleClose={(isRefresh) => {
            setEmailOpen(false);
            // Mail, taslak/reddedilmiş teklifi "Müşteriye Gönderildi"ye çeker.
            if (isRefresh) reFetch?.();
          }}
          data={data}
        />
      )}
    </Box>
  );
}

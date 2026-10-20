"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
  Typography,
} from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import PaymentsIcon from "@mui/icons-material/Payments";
import ApartmentIcon from "@mui/icons-material/Apartment";
import AddIcon from "@mui/icons-material/Add";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import { OpsPageNames } from "@enums/OpsPageNames";
import { usePageAction } from "@hooks/usePageAction";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import { getCurrencyFormat } from "@helpers/Common/getCurrencyFormat";
import InfoRow from "@components/InfoRow";
import OrderStateDialog from "./OrderStateDialog";
import AddPaymentDialog from "./AddPaymentDialog";
import OrderPaymentList from "./OrderPaymentList";
import { OrderPaymentStateEnum, OrderStateEnum, type IOrderDetail, type IOrderPayments } from "./types";

const STATE_COLOR: Record<number, "default" | "info" | "success" | "error" | "warning"> = {
  [OrderStateEnum.WaitingApproval]: "warning",
  [OrderStateEnum.Rejected]: "error",
  [OrderStateEnum.Approved]: "info",
  [OrderStateEnum.Planning]: "info",
  [OrderStateEnum.Completed]: "success",
};

const PAYMENT_COLOR: Record<number, "default" | "warning" | "success"> = {
  [OrderPaymentStateEnum.NotPaid]: "default",
  [OrderPaymentStateEnum.PrePaymentCompleted]: "warning",
  [OrderPaymentStateEnum.PaymentCompleted]: "success",
};

/** Sipariş detayı: durum ve ödeme aksiyonları, fiyat/ödeme özeti, durum geçmişi. */
export default function OrderDetail({ data, reFetch }: { data?: IOrderDetail; reFetch?: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const [payments, setPayments] = useState<IOrderPayments | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [stateOpen, setStateOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const canUpdateState = usePageAction(OpsPageNames.OrderManagement, "UpdateOrderState");
  const canPay = usePageAction(OpsPageNames.OrderManagement, "UpdatePayment");
  const canAddSubOrder = usePageAction(OpsPageNames.OrderManagement, "AddSubOrder");

  const loadPayments = useCallback(() => {
    if (!data?.id) return;
    setPaymentsLoading(true);
    axiosInstance
      .get(ApiRoutes.OrderPayment, { params: { orderId: data.id }, withoutToast: true })
      .then((res) => setPayments(res?.data?.isSuccess ? (res.data.data as IOrderPayments) : null))
      .catch(() => setPayments(null))
      .finally(() => setPaymentsLoading(false));
  }, [data?.id]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments, data?.paymentState]);

  if (!data) return null;

  const price = data.priceSpecs ?? {};
  const currency = price.currencyDescription || "TRY";
  const money = (value?: number) => getCurrencyFormat(value ?? 0, currency);
  const date = (value?: string) => (value ? getLocalizedMoment(value).format("LL") : "-");
  const dateTime = (value?: string) => (value ? getLocalizedMoment(value).format("LLL") : "-");
  const refresh = () => {
    reFetch?.();
    loadPayments();
  };

  const companyHref = data.tenant?.id ? `/${locale}${Routes.Company}/${encodeURIComponent(data.tenant.id)}` : undefined;
  // API alt siparişi yalnızca tamamlanmış ana siparişe izin verir; butonu burada gizlemek reddedilen isteği önler.
  const showAddSubOrder = canAddSubOrder && !!data.projectId && data.isMainOrder && data.state === OrderStateEnum.Completed;

  return (
    <Box>
      <Stack direction={["column", "row"]} justifyContent="space-between" alignItems={["stretch", "center"]} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Link href={`/${locale}${Routes.Orders}`}>
            <Button startIcon={<ArrowBack />} color="inherit">
              {t("Form.Back")}
            </Button>
          </Link>
          <Box>
            <Typography variant="h5">{data.projectName}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }} flexWrap="wrap">
              <Chip size="small" color={STATE_COLOR[data.state] ?? "default"} label={t(`OrderState.${data.state}`)} data-cy="order-state" />
              <Chip size="small" variant="outlined" color={PAYMENT_COLOR[data.paymentState] ?? "default"} label={t(`OrderPaymentState.${data.paymentState}`)} />
              <Typography variant="caption" color="text.secondary">
                #{data.id} ·{" "}
                {companyHref ? (
                  <Link href={companyHref} style={{ color: "inherit", textDecoration: "underline" }}>
                    {data.tenant?.name}
                  </Link>
                ) : (
                  data.tenant?.name
                )}{" "}
                · {data.isMainOrder ? t("Order.MainOrder") : t("Order.SubOrder")}
              </Typography>
            </Stack>
          </Box>
        </Stack>
        <Stack direction={["column", "row"]} spacing={1}>
          {data.projectId && (
            <Link href={`/${locale}${Routes.Project}/${data.projectId}`}>
              <Button variant="outlined" startIcon={<ApartmentIcon />} fullWidth>
                {t("Order.GoToProject")}
              </Button>
            </Link>
          )}
          {showAddSubOrder && (
            <Link href={`/${locale}${Routes.Order}/${data.id}/${data.projectId}${Routes.SubOrder}`}>
              <Button variant="outlined" startIcon={<AddIcon />} fullWidth data-cy="order-add-sub-order">
                {t("Order.AddSubOrder")}
              </Button>
            </Link>
          )}
          {canPay && data.paymentState !== OrderPaymentStateEnum.PaymentCompleted && data.state !== OrderStateEnum.Rejected && (
            <Button variant="outlined" startIcon={<PaymentsIcon />} onClick={() => setPaymentOpen(true)} data-cy="order-pay">
              {t("Order.Pay")}
            </Button>
          )}
          {canUpdateState && data.state !== OrderStateEnum.Completed && data.state !== OrderStateEnum.Rejected && (
            <Button variant="contained" startIcon={<PublishedWithChangesIcon />} onClick={() => setStateOpen(true)} data-cy="order-update-state">
              {t("Order.UpadateOrder")}
            </Button>
          )}
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t("Offer.OrderInfo")}
              </Typography>
              <InfoRow
                label={t("Form.Tenant")}
                value={
                  companyHref ? (
                    <Link href={companyHref} style={{ color: "inherit", textDecoration: "underline" }} title={t("Order.GoToCompany")}>
                      {data.tenant?.name}
                    </Link>
                  ) : (
                    data.tenant?.name
                  )
                }
              />
              <InfoRow label={t("Form.FeatureGroups")} value={data.featureGroup?.name} />
              <InfoRow label={t("Form.ServiceEndDate")} value={date(data.serviceEndDate)} />
              {(data.projectAddresses ?? []).map((address, index) => (
                <InfoRow
                  key={address.id ?? index}
                  label={t("Form.FullAddress")}
                  value={[address.fullAddress, address.city, address.state].filter(Boolean).join(", ")}
                />
              ))}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
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
          <Stack spacing={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {t("Offer.PricingAndCurrency")}
                </Typography>
                <InfoRow label={t("Offer.ServicePriceWithVat")} value={money(price.servicePriceWithVat)} />
                {!!price.extraPriceWithoutVat && <InfoRow label={price.extraPriceDescription || t("Form.ExtraPriceWithoutVat")} value={money(price.extraPriceWithVat)} />}
                <InfoRow label={t("Form.DiscountAmount")} value={money(price.discountAmount)} />
                <InfoRow label={t("Form.PrePaymentAmountWithVat")} value={money(price.prePaymentAmountWithVat)} />
                <InfoRow label={t("Offer.TotalPriceWithVat")} value={money(price.totalPriceWithVat)} strong />
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {t("Order.Payments")}
                </Typography>
                <OrderPaymentList payments={payments} loading={paymentsLoading} money={money} />
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {t("Order.History")}
                </Typography>
                {(data.updates ?? []).map((update, index) => (
                  <Box key={index} sx={{ py: 0.75, borderBottom: 1, borderColor: "divider" }}>
                    <Typography variant="body2">
                      {t(`OrderState.${update.stateFrom}`)} → <strong>{t(`OrderState.${update.stateTo}`)}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dateTime(update.updateTime)} · {update.updaterUserName}
                      {update.description ? ` · ${update.description}` : ""}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <OrderStateDialog open={stateOpen} order={data} onClose={() => setStateOpen(false)} onUpdated={refresh} />
      <AddPaymentDialog
        open={paymentOpen}
        orderId={data.id}
        prePaymentAmount={price.prePaymentAmountWithVat}
        remainingAmount={payments?.remainingPaymentAmountWithVat}
        prePaymentDone={data.paymentState !== OrderPaymentStateEnum.NotPaid}
        onClose={() => setPaymentOpen(false)}
        onAdded={refresh}
      />
    </Box>
  );
}

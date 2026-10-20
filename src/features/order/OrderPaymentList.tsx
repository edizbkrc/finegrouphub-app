"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Box, Chip, LinearProgress, Skeleton, Stack, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import InfoRow from "@components/InfoRow";
import { MAINTENANCE_PAYMENT_CATEGORY, type IOrderPayments } from "./types";

/**
 * Siparişin ödeme özeti ve ödeme kalemleri.
 * Özet: toplam / ödenen / kalan + ilerleme çubuğu; kalemler en yeni üstte, belgeleri indirilebilir.
 */
export default function OrderPaymentList({
  payments,
  loading,
  money,
}: {
  payments: IOrderPayments | null;
  loading: boolean;
  money: (value?: number) => string;
}) {
  const t = useTranslations();

  // Yeni ödeme en üstte görünsün diye tarihe göre azalan sıralanır; API sıralamayı garanti etmiyor.
  const items = useMemo(
    () => [...(payments?.payments ?? [])].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
    [payments?.payments]
  );

  // "Kalan" API'de indirim düşülerek hesaplanır; ilerleme çubuğu da aynı paydayı (toplam - indirim) kullanmalı ki %100'e ulaşabilsin.
  const total = payments?.totalPaymentAmountWithVat ?? 0;
  const discount = payments?.discountAmount ?? 0;
  const payable = Math.max(total - discount, 0);
  const remaining = payments?.remainingPaymentAmountWithVat ?? 0;
  const paid = Math.max(payable - remaining, 0);
  const percent = payable > 0 ? Math.min(100, Math.round((paid / payable) * 100)) : 100;

  if (loading && !payments) return <Skeleton variant="rounded" height={160} />;

  return (
    <Box data-cy="order-payments">
      <InfoRow label={t("Order.TotalPayment")} value={money(total)} />
      {discount > 0 && <InfoRow label={t("Form.DiscountAmount")} value={money(discount)} />}
      <InfoRow label={t("Order.Paid")} value={money(paid)} />
      <InfoRow label={t("Order.RemainingPayment")} value={money(remaining)} strong />
      <LinearProgress variant="determinate" value={percent} color={percent >= 100 ? "success" : "primary"} sx={{ my: 1.5, height: 8, borderRadius: 4 }} />

      <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
        {t("Order.PaymentCount", { count: items.length })}
      </Typography>

      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>
          {t("Order.NoPayments")}
        </Typography>
      )}

      <Stack divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />} sx={{ mt: 0.5 }}>
        {items.map((payment) => {
          const isMaintenance = payment.categoryId === MAINTENANCE_PAYMENT_CATEGORY;
          return (
            <Box key={payment.id} sx={{ py: 1.25 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {payment.date ? getLocalizedMoment(payment.date).format("LL") : "-"}
                  </Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    color={isMaintenance ? "info" : "default"}
                    label={isMaintenance ? t("Order.PaymentCategoryMaintenance") : t("Order.PaymentCategoryOrder")}
                  />
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {money(payment.amount)}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.25 }}>
                {payment.bankAccount?.name ?? "-"}
              </Typography>
              {payment.description && (
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                  {payment.description}
                </Typography>
              )}
              {(payment.documents ?? []).length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                  {(payment.documents ?? []).map((document, index) => (
                    <Chip
                      key={document.id ?? index}
                      size="small"
                      icon={<AttachFileIcon />}
                      component="a"
                      // URL API'nin ürettiği kısa ömürlü imzalı adrestir; yeni sekmede açılıp indirilir.
                      href={document.url ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      clickable={!!document.url}
                      label={document.fileName ?? t("Form.Download")}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

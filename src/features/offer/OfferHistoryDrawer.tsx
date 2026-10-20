"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, Drawer, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReceiptIcon from "@mui/icons-material/Receipt";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import { getCurrencyFormat } from "@helpers/Common/getCurrencyFormat";
import { CurrencyEnum } from "@helpers/types/CurrencyEnum";
import InfoRow from "@components/InfoRow";
import LoadingComponent from "@components/LoadingComponent";
import NotFoundComponent from "@components/NotFoundComponent";
import OpsModalHeader from "@components/OpsModalHeader";
import type { IOfferDetail, IOfferHistoryItem } from "./types";

interface IOfferHistoryDrawerProps {
  data?: IOfferDetail;
  isOpen: boolean;
  handleClose: (isRefresh?: boolean) => void;
}

const CURRENCY_CODES: Record<number, string> = {
  [CurrencyEnum.TRY]: "TRY",
  [CurrencyEnum.USD]: "USD",
};

/**
 * Teklif geçmişi çekmecesi: aynı correlationId altındaki tüm versiyonlar.
 * Her versiyonun tutarları kendi para biriminde gelir; açık olan teklif dışındakilere
 * "Teklif Bilgileri" bağlantısı konur.
 */
export default function OfferHistoryDrawer({ isOpen, handleClose, data }: IOfferHistoryDrawerProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [history, setHistory] = useState<IOfferHistoryItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !data?.correlationId) return;
    setLoading(true);
    axiosInstance
      .get(ApiRoutes.OfferHistory, { params: { correlationId: data.correlationId }, withoutToast: true })
      .then((res) => {
        if (res?.data?.isSuccess) setHistory((res.data.data as IOfferHistoryItem[]) ?? []);
      })
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [isOpen, data?.correlationId]);

  const money = (value: number | undefined | null, item: IOfferHistoryItem) =>
    getCurrencyFormat(value ?? 0, CURRENCY_CODES[item.currencySnap?.currency ?? -1]);

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
      <OpsModalHeader title={t("Offer.OfferHistory")} handleClose={() => handleClose(false)} />
      <Divider />
      <Box sx={{ p: 3 }}>
        {history && history.length > 0
          ? history.map((offer) => (
              <Accordion key={offer.id} square sx={{ mb: 2 }} defaultExpanded={offer.id === data?.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack>
                    <Typography sx={{ fontWeight: "bold", fontSize: "18px" }}>{t(`OfferState.${offer.state}`)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      #{offer.id} · {offer.date ? getLocalizedMoment(offer.date).format("LLL") : "-"}
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <InfoRow label={t("Form.Description")} value={offer.stateDescription} />
                  <InfoRow label={t("Form.MaintanenceTime")} value={`${offer.maintenanceDurationInDays ?? 0} ${t("Form.Day")}`} />
                  <InfoRow
                    label={t("Form.PreviousOfferTotalPriceWithVat")}
                    value={offer.previousOfferId ? money(offer.previousOfferTotalPriceWithVat, offer) : "-"}
                  />
                  <InfoRow label={t("Form.PrePaymentAmountWithVat")} value={money(offer.prePaymentAmount, offer)} />
                  <InfoRow label={t("Form.TotalPrice")} value={money(offer.totalPriceWithVat, offer)} strong />
                  {offer.id !== data?.id && (
                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                      <Link href={`/${locale}${Routes.Offer}/${offer.id}`} style={{ textDecoration: "none" }}>
                        <Button variant="outlined" startIcon={<ReceiptIcon />} onClick={() => handleClose(false)}>
                          {t("Form.OfferInfo")}
                        </Button>
                      </Link>
                    </Stack>
                  )}
                </AccordionDetails>
              </Accordion>
            ))
          : !loading && <NotFoundComponent />}
      </Box>
    </Drawer>
  );
}

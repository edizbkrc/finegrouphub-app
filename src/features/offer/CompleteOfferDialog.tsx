"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import moment from "moment";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField, Typography } from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";

interface ICompleteOfferDialogProps {
  open: boolean;
  offerId: number;
  onClose: () => void;
  /** API, oluşan siparişin id'sini döner; çağıran taraf siparişe yönlendirir. */
  onCompleted: (orderId?: number) => void;
}

const EMPTY_ADDRESS = {
  contactNameSurname: "",
  contactPhone: "",
  country: "Türkiye",
  state: "",
  city: "",
  fullAddress: "",
  zipCode: "",
};

/**
 * Teklifi tamamlar: müşteri kabul etti → sipariş "Onay Bekliyor" olarak açılır.
 * Proje adresi siparişe ve oluşacak projeye taşınır.
 */
export default function CompleteOfferDialog({ open, offerId, onClose, onCompleted }: ICompleteOfferDialogProps) {
  const t = useTranslations();
  const [serviceEndDate, setServiceEndDate] = useState("");
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setServiceEndDate(moment().add(1, "year").format("YYYY-MM-DD"));
    setAddress(EMPTY_ADDRESS);
  }, [open]);

  const set = (key: keyof typeof EMPTY_ADDRESS) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((prev) => ({ ...prev, [key]: event.target.value }));

  // API (CompleteOfferValidator → addressInfos) bu alanları zorunlu tutar: ad-soyad, ülke, il, ilçe, açık adres.
  const valid =
    !!serviceEndDate &&
    !!address.contactNameSurname.trim() &&
    !!address.country.trim() &&
    !!address.state.trim() &&
    !!address.city.trim() &&
    !!address.fullAddress.trim();

  const submit = () => {
    setSaving(true);
    axiosInstance
      .put(ApiRoutes.OfferComplete, {
        id: offerId,
        serviceEndDate: moment(serviceEndDate).endOf("day").toISOString(),
        projectAddresses: [{ ...address, addressType: 1 }],
      })
      .then((res) => {
        if (!res?.data?.isSuccess) return;
        onClose();
        onCompleted(typeof res.data.data === "number" ? res.data.data : undefined);
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const field = (key: keyof typeof EMPTY_ADDRESS, label: string, md = 6, required = false) => (
    <Grid size={{ xs: 12, md }}>
      <TextField fullWidth size="small" label={t(label)} required={required} value={address[key]} onChange={set(key)} />
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t("Offer.CompleteOrder")}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("Offer.CompleteOrderInfo")}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label={t("Form.ServiceEndDate")}
              required
              value={serviceEndDate}
              onChange={(event) => setServiceEndDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle2">{t("Offer.CompleteOrderAddressTitle")}</Typography>
          </Grid>
          {field("contactNameSurname", "Form.NameSurname", 6, true)}
          {field("contactPhone", "Form.ContactPhone")}
          {field("country", "Form.Country", 4, true)}
          {field("state", "Form.City", 4, true)}
          {field("city", "Form.District", 4, true)}
          {field("fullAddress", "Form.FullAddress", 9, true)}
          {field("zipCode", "Form.ZipCode", 3)}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Form.Cancel")}</Button>
        <Button variant="contained" onClick={submit} disabled={!valid || saving} data-cy="offer-complete-submit">
          {t("Offer.CompleteOrder")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

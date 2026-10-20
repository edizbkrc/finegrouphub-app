"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import moment from "moment";
import { useSnackbar } from "notistack";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { toEnumLookupParams, toLookupRequest } from "@network/adapters";
import AttachmentPicker from "@components/AttachmentPicker";
import { OpsFileTypeEnum } from "@common/enums/OpsFileTypeEnum";
import { toUploadRequests, type IAttachment } from "@common/helpers/attachments";
import { uploadPendingFiles } from "@common/helpers/processFormUploads";

interface IOption {
  value: number | string;
  name: string;
}

/**
 * OrderUpdatePaymentState: API tutarı bu türlerde kendisi hesaplar, istekteki `amount` yok sayılır.
 * Ön ödeme (1, 5) → siparişteki ön ödeme tutarı; tamamlama (2, 6) → kalan tutar.
 * Kısmi ödemelerde (3, 4) tutarı kullanıcı girer.
 */
const PREPAYMENT_KINDS = [1, 5];
const COMPLETION_KINDS = [2, 6];

/** Siparişe ödeme ekler (ön ödeme, kısmi, tamamı — çek dahil). Gelir kaydı API'de otomatik oluşur. */
export default function AddPaymentDialog({
  open,
  orderId,
  prePaymentAmount,
  remainingAmount,
  prePaymentDone,
  onClose,
  onAdded,
}: {
  open: boolean;
  orderId: number;
  /** Siparişteki ön ödeme tutarı (KDV dahil). */
  prePaymentAmount?: number;
  /** Henüz ödenmemiş tutar (KDV dahil). */
  remainingAmount?: number;
  /** Ön ödeme alındıysa ön ödeme türleri listeden çıkarılır; tekrar seçilirse API aynı tutarı yeniden tahsil eder. */
  prePaymentDone: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const t = useTranslations();
  const { enqueueSnackbar } = useSnackbar();
  const [kinds, setKinds] = useState<IOption[]>([]);
  const [banks, setBanks] = useState<IOption[]>([]);
  const [documents, setDocuments] = useState<IAttachment[]>([]);
  const [form, setForm] = useState({ paymentKind: "" as number | "", amount: "", date: "", bankAccountId: "" as number | "", description: "", sendMail: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      paymentKind: "",
      amount: "",
      date: moment().format("YYYY-MM-DD"),
      bankAccountId: "",
      description: "",
      sendMail: false,
    });
    setDocuments([]);
    axiosInstance
      .get(ApiRoutes.LookupsEnum, { params: toEnumLookupParams("OrderUpdatePaymentState"), withoutToast: true })
      .then((res) => setKinds(((res?.data?.data as { value: number; name: string }[]) ?? []).map((k) => ({ value: k.value, name: k.name }))))
      .catch(() => setKinds([]));
    axiosInstance
      .patch(ApiRoutes.Lookups, toLookupRequest({ entityName: "BankAccount", requestedPropertyNames: ["Name"] }), { withoutToast: true })
      .then((res) => {
        const rows = (res?.data?.data?.[0]?.data as { Id: number; Name: string }[]) ?? [];
        setBanks(rows.map((row) => ({ value: row.Id, name: row.Name })));
      })
      .catch(() => setBanks([]));
  }, [open]);

  const visibleKinds = useMemo(
    () => (prePaymentDone ? kinds.filter((kind) => !PREPAYMENT_KINDS.includes(Number(kind.value))) : kinds),
    [kinds, prePaymentDone]
  );

  const kind = form.paymentKind === "" ? null : Number(form.paymentKind);
  const amountIsAutomatic = kind !== null && (PREPAYMENT_KINDS.includes(kind) || COMPLETION_KINDS.includes(kind));

  const round = (value?: number) => (value ? String(Math.round(value * 100) / 100) : "");

  // Tür değişince tutar otomatik doldurulur; otomatik türlerde alan kilitlidir ki ekranla API'nin hesabı ayrışmasın.
  const handleKindChange = (value: number) => {
    const autoAmount = PREPAYMENT_KINDS.includes(value) ? round(prePaymentAmount) : COMPLETION_KINDS.includes(value) ? round(remainingAmount) : "";
    setForm((prev) => ({ ...prev, paymentKind: value, amount: autoAmount }));
  };

  // Ön ödeme tutarı 0 olabilir (API bunu geçerli sayar); diğer türlerde tutar > 0 şart.
  const amountValid = kind !== null && (PREPAYMENT_KINDS.includes(kind) || COMPLETION_KINDS.includes(kind) || Number(form.amount) > 0);
  const valid = kind !== null && amountValid && !!form.date && form.bankAccountId !== "";

  const submit = () => {
    setSaving(true);
    axiosInstance
      .post(ApiRoutes.OrderPayment, {
        id: orderId,
        paymentKind: form.paymentKind,
        amount: Number(form.amount) || 0,
        date: moment(form.date).toISOString(),
        bankAccountId: form.bankAccountId,
        description: form.description.trim() || null,
        documents: toUploadRequests(documents),
        sendMailToCompany: form.sendMail,
      })
      .then(async (res) => {
        if (!res?.data?.isSuccess) return;
        // Önce kayıt oluşur, belgeler ardından API'nin döndüğü imzalı adreslere yüklenir; yükleme hatası ödemeyi geri almaz.
        await uploadPendingFiles(res.data, documents, () =>
          enqueueSnackbar(t("Toast.ImageUploadError"), { variant: "error", autoHideDuration: 5000 })
        );
        onAdded();
        onClose();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("Order.Pay")}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth required label={t("Form.PaymentKind")} value={form.paymentKind} onChange={(e) => handleKindChange(Number(e.target.value))}>
              {visibleKinds.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              required
              type="number"
              label={t("Form.Amount")}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              disabled={amountIsAutomatic}
              inputProps={{ min: 0, step: "0.01" }}
            />
          </Grid>
          {amountIsAutomatic && (
            <Grid size={12}>
              <Alert severity="info" variant="outlined">
                {t("Order.AutoAmountInfo")}
              </Alert>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth required type="date" label={t("Form.Date")} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth required label={t("Form.BankAccount")} value={form.bankAccountId} onChange={(e) => setForm({ ...form, bankAccountId: Number(e.target.value) })}>
              {banks.map((bank) => (
                <MenuItem key={bank.value} value={bank.value}>
                  {bank.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField fullWidth multiline minRows={2} label={t("Form.Description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} inputProps={{ maxLength: 500 }} />
          </Grid>
          <Grid size={12}>
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
              {t("Form.Documents")}
            </Typography>
            <AttachmentPicker value={documents} onChange={setDocuments} fileType={OpsFileTypeEnum.Document} label={t("Form.AttachFile")} disabled={saving} />
          </Grid>
          <Grid size={12}>
            <FormControlLabel control={<Checkbox checked={form.sendMail} onChange={(e) => setForm({ ...form, sendMail: e.target.checked })} />} label={t("Form.SendMailToCompany")} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Form.Cancel")}</Button>
        <Button variant="contained" onClick={submit} disabled={!valid || saving} data-cy="order-payment-submit">
          {t("Form.Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

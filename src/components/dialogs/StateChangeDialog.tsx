"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { toEnumLookupParams } from "@network/adapters";

export interface IStateOption {
  value: number;
  name: string;
}

export interface IStateChangeSubmit {
  stateTo: number;
  reason: string;
  sendMailToCompany: boolean;
}

interface IStateChangeDialogProps {
  open: boolean;
  title: string;
  /** Seçenekler bu enum'dan (GET /v1/Lookups/enum) gelir. */
  enumName: string;
  /** Mevcut durum — seçeneklerden çıkarılır. */
  currentState?: number | null;
  /** İzin verilen hedef durumlar; verilmezse enum'un tamamı. */
  allowedStates?: number[];
  reasonLabel?: string;
  /** Bu durumlar seçilince açıklama zorunlu olur (örn. iptal/red). */
  reasonRequiredFor?: number[];
  showSendMail?: boolean;
  onClose: () => void;
  onSubmit: (data: IStateChangeSubmit) => Promise<boolean>;
}

/**
 * Ortak durum değiştirme penceresi (proje, teklif, sipariş, proje ön süreci...).
 * API çağrısını `onSubmit` yapar; `true` dönerse pencere kapanır.
 */
export default function StateChangeDialog({
  open,
  title,
  enumName,
  currentState,
  allowedStates,
  reasonLabel,
  reasonRequiredFor = [],
  showSendMail = false,
  onClose,
  onSubmit,
}: IStateChangeDialogProps) {
  const t = useTranslations();
  const [options, setOptions] = useState<IStateOption[]>([]);
  const [stateTo, setStateTo] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [sendMail, setSendMail] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStateTo("");
    setReason("");
    setSendMail(false);
    axiosInstance
      .get(ApiRoutes.LookupsEnum, { params: toEnumLookupParams(enumName), withoutToast: true })
      .then((res) => {
        if (!res?.data?.isSuccess) return;
        const all = (res.data.data as IStateOption[]) ?? [];
        setOptions(
          all.filter(
            (option) =>
              option.value !== currentState && (!allowedStates || allowedStates.includes(option.value))
          )
        );
      })
      .catch(() => setOptions([]));
  }, [open, enumName, currentState, allowedStates]);

  const reasonRequired = stateTo !== "" && reasonRequiredFor.includes(stateTo);
  const canSubmit = stateTo !== "" && (!reasonRequired || reason.trim().length > 0) && !saving;

  const submit = async () => {
    if (stateTo === "") return;
    setSaving(true);
    const ok = await onSubmit({ stateTo, reason: reason.trim(), sendMailToCompany: sendMail }).finally(() =>
      setSaving(false)
    );
    if (ok) onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {options.length === 0 ? (
            <Typography color="text.secondary">{t("Common.NoStateTransition")}</Typography>
          ) : (
            <TextField
              select
              fullWidth
              label={t("Form.State")}
              value={stateTo}
              onChange={(event) => setStateTo(Number(event.target.value))}
              inputProps={{ "data-cy": "state-change-select" }}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={reasonLabel ?? t("Form.Reason")}
            required={reasonRequired}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            inputProps={{ maxLength: 1000 }}
          />
          {showSendMail && (
            <FormControlLabel
              control={<Checkbox checked={sendMail} onChange={(event) => setSendMail(event.target.checked)} />}
              label={t("Form.SendMailToCompany")}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Form.Cancel")}</Button>
        <Button variant="contained" onClick={submit} disabled={!canSubmit} data-cy="state-change-submit">
          {t("Form.Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

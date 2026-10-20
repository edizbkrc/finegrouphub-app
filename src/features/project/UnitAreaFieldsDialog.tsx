"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { useProject } from "./ProjectContext";
import {
  DEFAULT_LABEL_KEY,
  LANGUAGE_ID,
  UNIT_AREA_FIELD_KEYS,
  readUnitAreaFields,
  type IUnitAreaField,
  type IUnitAreaFields,
  type UnitAreaFieldKey,
} from "./unitAreaFields";

interface IRowState {
  hidden: boolean;
  tr: string;
  en: string;
}

type IDialogState = Record<UnitAreaFieldKey, IRowState>;

const NAME_MAX_LENGTH = 100;

const nameOf = (field: IUnitAreaField | null | undefined, languageId: number) =>
  field?.translations?.find((row) => row?.languageId === languageId)?.name ?? "";

const toState = (fields: IUnitAreaFields | null): IDialogState => {
  const state = {} as IDialogState;
  UNIT_AREA_FIELD_KEYS.forEach((key) => {
    const field = fields?.[key];
    state[key] = { hidden: field?.hidden === true, tr: nameOf(field, LANGUAGE_ID.tr), en: nameOf(field, LANGUAGE_ID.en) };
  });
  return state;
};

const emptyState = (): IDialogState => toState(null);

/** Boş ad gönderilmez: API zaten atıyor, ama "varsayılanı kullan" niyeti gövdede de açık olsun. */
const toPayload = (state: IDialogState): IUnitAreaFields => {
  const payload: IUnitAreaFields = {};
  UNIT_AREA_FIELD_KEYS.forEach((key) => {
    const row = state[key];
    const translations = [
      { name: row.tr.trim(), languageId: LANGUAGE_ID.tr },
      { name: row.en.trim(), languageId: LANGUAGE_ID.en },
    ].filter((item) => item.name !== "");
    payload[key] = { hidden: row.hidden, translations };
  });
  return payload;
};

/**
 * Projenin mülk alan adları (Brüt / Net / Kapı içi): yeniden adlandırma + gizleme.
 *
 * Ayrı uç yok; mevcut PUT /v1/projects/project ile config içine yazılır. Mevcut config'i
 * yayıp yalnız unitAreaFields değiştiriliyor, çünkü API config'i bütünüyle değiştiriyor —
 * yaymazsak tema/canvas/mobileViewMode silinirdi.
 */
export default function UnitAreaFieldsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations();
  const { projectId, project, reload } = useProject();
  const [state, setState] = useState<IDialogState>(() => toState(readUnitAreaFields(project)));
  const [saving, setSaving] = useState(false);

  const update = (key: UnitAreaFieldKey, patch: Partial<IRowState>) =>
    setState((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const handleSave = () => {
    setSaving(true);
    const currentConfig = (project?.config as Record<string, unknown> | null | undefined) ?? {};
    axiosInstance
      .put(ApiRoutes.ProjectDetail, {
        id: projectId,
        config: { value: { ...currentConfig, unitAreaFields: toPayload(state) }, isUpdated: true },
      })
      .then((res) => {
        if (res?.data?.isSuccess) {
          // Formlar ve Excel şeması etiketleri ProjectContext'ten okuyor; yenilenmeden eski ad kalır.
          reload();
          onClose();
        }
      })
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth data-cy="unit-area-fields-dialog">
      <DialogTitle>{t("Modal.UnitAreaFields")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info">{t("Form.UnitAreaFieldsInfo")}</Alert>
          {UNIT_AREA_FIELD_KEYS.map((key) => {
            const row = state[key];
            const defaultLabel = t(`Form.${DEFAULT_LABEL_KEY[key]}`);
            return (
              <Grid container spacing={2} alignItems="center" key={key} data-cy={`unit-area-field-${key}`}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography fontWeight={700}>{defaultLabel}</Typography>
                  <FormControlLabel
                    control={<Switch checked={row.hidden} onChange={(event) => update(key, { hidden: event.target.checked })} />}
                    label={t("Form.HideField")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("Form.TurkishName")}
                    placeholder={defaultLabel}
                    value={row.tr}
                    onChange={(event) => update(key, { tr: event.target.value })}
                    slotProps={{ htmlInput: { maxLength: NAME_MAX_LENGTH } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("Form.EnglishName")}
                    placeholder={defaultLabel}
                    value={row.en}
                    onChange={(event) => update(key, { en: event.target.value })}
                    slotProps={{ htmlInput: { maxLength: NAME_MAX_LENGTH } }}
                  />
                </Grid>
              </Grid>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions>
        {/* Yalnız formu sıfırlar; kayıt yine Kaydet ile — yanlışlıkla tıklanırsa İptal ile dönülebilsin. */}
        <Button onClick={() => setState(emptyState())} disabled={saving} sx={{ mr: "auto" }}>
          {t("Button.ResetToDefault")}
        </Button>
        <Button onClick={onClose} disabled={saving}>
          {t("Button.Cancel")}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {t("Button.Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import AutoSelect from "@common/inputs/AutoSelect";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import { getLanguageOptions } from "./companyHelpers";

interface IProps {
  open: boolean;
  data: any;
  onClose: () => void;
  onSaved: () => void;
}

type FormValues = {
  isActive: boolean;
  serviceProvided: boolean;
  fullCompanyName: string;
  name: string;
  languageId: number | null;
};

/**
 * Genel Bilgiler → Düzenle diyaloğu.
 * Kaydedilebilir alanlar UpdateTenant’a gider; kimlik/parola/para birimi salt okunur özetde kalır.
 */
export default function CompanyGeneralInfoEditDialog({ open, data, onClose, onSaved }: IProps) {
  const t = useTranslations();
  const tf = useTranslations("Form");
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      isActive: false,
      serviceProvided: false,
      fullCompanyName: "",
      name: "",
      languageId: null,
    },
  });

  useEffect(() => {
    if (!open || !data) return;
    reset({
      isActive: !!data.isActive,
      serviceProvided: !!data.serviceProvided,
      fullCompanyName: data.fullCompanyName ?? "",
      name: data.name ?? "",
      languageId: data.languageId ?? null,
    });
  }, [open, data, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!data?.id) return;
    setSaving(true);

    const body: Record<string, unknown> = { id: data.id };
    const wrap = (value: unknown) => ({ value, isUpdated: true });

    if (values.isActive !== !!data.isActive) body.isActive = wrap(values.isActive);
    if (values.serviceProvided !== !!data.serviceProvided) body.serviceProvided = wrap(values.serviceProvided);
    if (values.fullCompanyName !== (data.fullCompanyName ?? "")) body.fullCompanyName = wrap(values.fullCompanyName);
    if (values.name !== (data.name ?? "")) body.name = wrap(values.name);
    if (values.languageId !== (data.languageId ?? null)) body.languageId = wrap(values.languageId);

    // Hiçbir alan değişmediyse kapat.
    if (Object.keys(body).length === 1) {
      setSaving(false);
      onClose();
      return;
    }

    try {
      const res = await axiosInstance.put(ApiRoutes.CompanyDetail, body);
      if (res?.data?.isSuccess) {
        onSaved();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("Tenant.EditGeneralInfo")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} color="primary" />}
                label={t("Form.IsActive")}
              />
            )}
          />
          <Controller
            name="serviceProvided"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} color="primary" />}
                label={t("Form.WasServiceProvided")}
              />
            )}
          />
          <TextField
            label={tf("FullBusinessName")}
            fullWidth
            error={!!errors.fullCompanyName}
            helperText={errors.fullCompanyName?.message}
            {...register("fullCompanyName", {
              required: tf("Required"),
              maxLength: { value: 200, message: tf("MaxLength200") },
            })}
          />
          <TextField
            label={tf("CompanyDisplayName")}
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register("name", {
              required: tf("Required"),
              maxLength: { value: 100, message: tf("MaxLength100") },
            })}
          />
          <AutoSelect
            key={`lang-${data?.languageId ?? "none"}-${open}`}
            control={control}
            defaultValue={
              data?.languageId ? { id: data.languageId, title: data.languageName ?? "" } : null
            }
            register={register as any}
            setValue={setValue as any}
            t={tf}
            variant="outlined"
            error={!!errors.languageId}
            errorMessage={errors.languageId?.message?.toString()}
            formItem={{
              name: "languageId",
              label: "ContactLanguage",
              type: FormItemTypeEnum.AUTO_COMPLETE,
              visibility: FormItemVisibilityEnum.Both,
              registerOptions: { required: tf("Required") },
              autoCompleteProps: { getOptions: getLanguageOptions },
            }}
          />
          <TextField label={t("Login.TennantId")} value={data?.id ?? ""} fullWidth disabled />
          <TextField label={tf("MainCurrency")} value={data?.mainCurrencyDescription ?? "-"} fullWidth disabled />
          <TextField label={tf("InitialUserPassword")} value={data?.initialUserPassword ?? ""} fullWidth disabled />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} color="inherit">
          {t("Button.Cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit(onSubmit)()}
          disabled={saving || !isDirty}
        >
          {t("Button.Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

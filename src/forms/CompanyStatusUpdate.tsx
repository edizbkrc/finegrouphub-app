"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import AutoSelect from "@common/inputs/AutoSelect";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { Save } from "@mui/icons-material";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import { getTenantProjectOptions } from "./helpers/companyHelpers";

/** `TenantOperationType` enum değerleri (Laravel `TenantOperationType`). */
const OPERATION_SUSPEND = 0;
const OPERATION_PERMANENT_SUSPEND = 1;
const OPERATION_ACTIVATE = 2;

type TenantStatusUpdateProps = {
  data: any;
  setLoading: (loading: boolean) => void;
  handleClose: (isRefresh?: boolean) => void;
};

/** Firma durum güncelleme formu (askıya al / kalıcı askıya al / aktif et). */
const CompanyStatusUpdate = ({ data, setLoading, handleClose }: TenantStatusUpdateProps) => {
  const t = useTranslations();
  const tf = useTranslations("Form");
  const [transactionType, setTransactionType] = useState<number | "">("");
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const isActive = !!data?.isActive;
  const isActivating = transactionType === OPERATION_ACTIVATE;

  const onSubmit = (formData: Record<string, unknown>) => {
    if (transactionType === "") return;

    setLoading(true);
    axiosInstance
      .put(ApiRoutes.TenantStatus, {
        ...formData,
        id: data?.id,
        transactionType,
        // Proje seçici yalnızca "Aktif Et"te görünüyor; başka işlemde eski seçim sızmasın.
        ...(!isActivating && { projectIdList: [] }),
      })
      .then((res) => {
        if (res?.data?.isSuccess) handleClose(true);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Box sx={{ p: 3, mt: 3 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl fullWidth>
          <InputLabel>{tf("State")}</InputLabel>
          <Select
            label={tf("State")}
            fullWidth
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as number)}
            sx={{ mb: 2 }}
          >
            {/* Aktif firma askıya alınabilir; pasif firma yalnızca aktif edilebilir. */}
            {isActive && <MenuItem value={OPERATION_SUSPEND}>{t(`TenantOperationType.${OPERATION_SUSPEND}`)}</MenuItem>}
            {isActive && (
              <MenuItem value={OPERATION_PERMANENT_SUSPEND}>{t(`TenantOperationType.${OPERATION_PERMANENT_SUSPEND}`)}</MenuItem>
            )}
            {!isActive && <MenuItem value={OPERATION_ACTIVATE}>{t(`TenantOperationType.${OPERATION_ACTIVATE}`)}</MenuItem>}
          </Select>
        </FormControl>

        {/*
          Referansta bu seçici her işlemde görünüyordu. Laravel ChangeTenantStatusHandler
          `projectIdList`'i yalnızca Activate'te kullanıyor (askıya almada firmanın tüm
          aktif projeleri zaten iptal edilir) — gereksiz seçici kullanıcıyı yanıltır.
        */}
        {isActivating && (
          <Box sx={{ mt: 3 }}>
            <AutoSelect
              t={tf}
              register={register}
              control={control}
              setValue={setValue}
              error={!!errors?.projectIdList}
              errorMessage={errors?.projectIdList?.message?.toString() || ""}
              variant="outlined"
              formItem={{
                name: "projectIdList",
                label: "Projects",
                type: FormItemTypeEnum.AUTO_COMPLETE,
                visibility: FormItemVisibilityEnum.Both,
                placeholder: tf("PlaceHolderValue", { value: tf("Projects") }),
                autoCompleteProps: {
                  isMultiple: true,
                  getOptions: getTenantProjectOptions(data?.id),
                },
              }}
            />
          </Box>
        )}

        <TextField
          sx={{ mt: 3 }}
          variant="outlined"
          fullWidth
          multiline
          label={tf("Reason")}
          rows={6}
          type="text"
          placeholder={tf("PlaceHolderValue", { value: tf("Reason") })}
          error={!!errors?.reason}
          helperText={errors?.reason?.message?.toString() || ""}
          {...register("reason", {
            // API (ChangeTenantStatusValidator) gerekçeyi zorunlu tutuyor: 10–2500 karakter.
            required: tf("Required"),
            minLength: { value: 10, message: tf("MinLength", { min: 10 }) },
            maxLength: { value: 2500, message: tf("MaxLength", { max: 2500 }) },
            setValueAs: (value) => value || undefined,
          })}
        />

        <Button
          type="submit"
          disabled={isSubmitting || transactionType === ""}
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<Save />}
          sx={{ mt: 3, mb: 2 }}
        >
          {tf("Save")}
        </Button>
      </form>
    </Box>
  );
};

export default CompanyStatusUpdate;

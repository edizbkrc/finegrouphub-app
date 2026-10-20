"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Box, Button, Divider, IconButton, Stack, TextField, Typography } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { AutoSelect, TelInput } from "@common/inputs";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormCustomComponent } from "@common/types/IFormCustomComponent";

interface ICompanyAddressListProps extends IFormCustomComponent {
  /** Adres dizisinin form yolu (`contactInfo.addresses` veya `projectAddresses`). */
  formKey?: string;
  maxAddresses?: number;
  /** Sekme içindeyse dış kart/başlık basılmaz. */
  embedded?: boolean;
  /** Boş listede otomatik bir satır ekle (firma oluşturmada zorunlu). */
  requireAtLeastOne?: boolean;
  titleKey?: string;
  indexTitleKey?: string;
}

function getByPath(obj: unknown, path: string): unknown {
  if (!obj || !path) return undefined;
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object") return (current as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

/**
 * `finehub-app`teki `ProjectFormAdress`'in sadeleştirilmiş kopyası.
 *
 * Ülke/il/ilçe metin; `id` / `*Id` / `geoPoint` satır yayılımıyla korunur.
 */
export default function CompanyAddressList({
  apiData,
  formState,
  formKey = "contactInfo.addresses",
  maxAddresses = 5,
  embedded,
  requireAtLeastOne = true,
  titleKey = "Tenant.AddressInfo",
  indexTitleKey = "Tenant.AddressInfoIndex",
}: ICompanyAddressListProps) {
  const t = useTranslations();
  const tf = useTranslations("Form");
  const { control, errors, setValue, register } = formState || {};
  const [addresses, setAddresses] = useState<any[]>([]);

  const formErrors = errors as any;
  const getError = (index: number, field: string) => {
    const row = getByPath(formErrors, `${formKey}.${index}`) as Record<string, { message?: string }> | undefined;
    return row?.[field];
  };

  useEffect(() => {
    const initial = (getByPath(apiData, formKey) as any[]) ?? [];
    if (Array.isArray(initial) && initial.length > 0) {
      setAddresses(initial);
      initial.forEach((address: any, index: number) => setValue?.(`${formKey}.${index}`, address));
    } else if (requireAtLeastOne) {
      setAddresses([{ contactNameSurname: "" }]);
    } else {
      setAddresses([]);
    }
  }, [apiData, setValue, formKey, requireAtLeastOne]);

  const updateFormValue = (updated: any[]) => {
    setAddresses(updated);
    setValue?.(formKey, updated, { shouldDirty: true });
  };

  const handleChange = (index: number, field: string, value: unknown) =>
    updateFormValue(addresses.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const handleAdd = () => {
    if (addresses.length < maxAddresses) updateFormValue([...addresses, { contactNameSurname: "" }]);
  };

  const handleRemove = (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    if (requireAtLeastOne && updated.length === 0) {
      updateFormValue([{ contactNameSurname: "" }]);
      return;
    }
    updateFormValue(updated);
  };

  const renderText = (
    index: number,
    field: string,
    label: string,
    options: { required?: boolean; max?: number; multiline?: boolean } = {}
  ) => (
    <TextField
      label={tf(label)}
      placeholder={tf("PlaceHolderValue", { value: tf(label) })}
      fullWidth
      multiline={options.multiline}
      rows={options.multiline ? 3 : undefined}
      value={addresses[index]?.[field] || ""}
      error={!!getError(index, field)}
      helperText={getError(index, field)?.message}
      {...register?.(`${formKey}.${index}.${field}`, {
        ...(options.required && { required: tf("Required") }),
        ...(options.max && { maxLength: { value: options.max, message: tf("MaxLength", { max: options.max }) } }),
      })}
      onChange={(e) => handleChange(index, field, e.target.value)}
    />
  );

  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        {!embedded ? (
          <Typography variant="subtitle1" fontWeight={700}>
            {t(titleKey)}
          </Typography>
        ) : (
          <span />
        )}
        {addresses.length < maxAddresses && (
          <Button variant="contained" size="small" onClick={handleAdd} startIcon={<Add />} data-cy="address-add">
            {t("Button.Add")}
          </Button>
        )}
      </Stack>

      {addresses.map((address, index) => (
        <Box key={index}>
          {index > 0 && <Divider sx={{ mb: 2 }} />}
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" color="text.secondary">
                {t(indexTitleKey, { index: index + 1 })}
              </Typography>
              {(index > 0 || !requireAtLeastOne) && (
                <IconButton color="error" size="small" onClick={() => handleRemove(index)} aria-label={t("Button.Remove")}>
                  <Delete />
                </IconButton>
              )}
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>{renderText(index, "contactNameSurname", "NameSurname", { required: true, max: 70 })}</Box>
              <Box sx={{ flex: 1 }}>
                <TelInput
                  control={control}
                  defaultValue={address?.contactPhone}
                  register={register as any}
                  setValue={setValue as any}
                  t={tf}
                  variant="outlined"
                  error={!!getError(index, "contactPhone")}
                  errorMessage={getError(index, "contactPhone")?.message}
                  formItem={{
                    name: `${formKey}.${index}.contactPhone`,
                    label: "ContactPhone",
                    type: FormItemTypeEnum.PHONE,
                    visibility: FormItemVisibilityEnum.Both,
                    onChange: (_data, val) => handleChange(index, "contactPhone", val),
                  }}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>{renderText(index, "country", "Country", { required: true, max: 70 })}</Box>
              <Box sx={{ flex: 1 }}>{renderText(index, "city", "City", { required: true, max: 70 })}</Box>
              <Box sx={{ flex: 1 }}>{renderText(index, "state", "District", { required: true, max: 70 })}</Box>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1 }}>{renderText(index, "zipCode", "ZipCode")}</Box>
              <Box sx={{ flex: 1 }}>
                <AutoSelect
                  key={`address-type-${index}-${address?.addressType ?? "none"}`}
                  control={control}
                  defaultValue={
                    address?.addressType ? { id: address.addressType, title: t(`AddressType.${address.addressType}`) } : null
                  }
                  register={register as any}
                  setValue={setValue as any}
                  t={tf}
                  variant="outlined"
                  error={!!getError(index, "addressType")}
                  errorMessage={getError(index, "addressType")?.message}
                  formItem={{
                    name: `${formKey}.${index}.addressType`,
                    label: "AddressType",
                    type: FormItemTypeEnum.AUTO_COMPLETE,
                    visibility: FormItemVisibilityEnum.Both,
                    onChange: (_data, val) => handleChange(index, "addressType", val),
                    registerOptions: { required: tf("Required") },
                    placeholder: tf("PlaceHolderValue", { value: tf("AddressType") }),
                    autoCompleteProps: { enumName: "AddressType" },
                  }}
                />
              </Box>
            </Stack>

            {renderText(index, "fullAddress", "FullAddress", { required: true, max: 500, multiline: true })}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

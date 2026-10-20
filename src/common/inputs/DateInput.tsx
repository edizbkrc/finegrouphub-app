import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import moment from "moment";
import { DatePicker } from "@mui/x-date-pickers";
import type { ICommonInputProps } from "../types/ICommonInputProps";

/**
 * Cypress ortamı DIŞINDA input her zaman salt okunur — kullanıcı yalnızca
 * takvimden seçim yapabilir, klavyeden serbest metin giremez (format hatalarını
 * önler). Cypress'te `cy.type()` ile doldurulabilmesi için bu kısıtlama kalkar.
 */
export default function DateInput({
  formItem,
  error,
  errorMessage,
  defaultValue,
  register,
  setValue,
  apiData,
  t,
  isEdit,
  variant,
  control,
}: ICommonInputProps) {
  const isTest = process.env.NEXT_PUBLIC_APP_ENV === "cypress";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setValue(formItem?.name, defaultValue || null);
    }, 100);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Controller
      name={formItem?.name}
      control={control}
      defaultValue={defaultValue ? moment(defaultValue) : null}
      render={({ field }) => (
        <DatePicker
          {...register(formItem?.name, { ...formItem?.registerOptions })}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          closeOnSelect
          value={moment(field?.value)}
          label={variant === "outlined" ? t(formItem.label) : undefined}
          minDate={formItem?.minDate ? moment(formItem?.minDate) : undefined}
          maxDate={formItem?.maxDate ? moment(formItem?.maxDate) : undefined}
          disabled={formItem?.handleDisabled?.(isEdit, apiData) ?? false}
          onChange={(newValue) => {
            field.onChange(newValue);
            setValue(formItem?.name, moment(newValue).format(), { shouldDirty: true });
            formItem?.onChange?.(apiData, moment(newValue).format());
          }}
          slotProps={{
            field: { readOnly: !isTest },
            textField: {
              variant,
              fullWidth: true,
              error: !!error,
              helperText: errorMessage,
              color: "secondary",
              onClick: isTest ? undefined : () => setOpen(true),
              inputProps: {
                "data-cy": `input-${formItem.name}`,
                readOnly: !isTest,
                onKeyDown: isTest
                  ? undefined
                  : (event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    },
              },
            },
          }}
        />
      )}
    />
  );
}

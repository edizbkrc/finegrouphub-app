import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { TextField } from "@mui/material";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import type { ICommonInputProps } from "../types/ICommonInputProps";

export default function NumericInput({
  formItem,
  error,
  errorMessage,
  defaultValue,
  register,
  setValue: setFormValue,
  apiData,
  t,
  isEdit,
  variant,
}: ICommonInputProps) {
  const { triggerValue } = formItem || {};
  const allowNegative = formItem?.allowNegative ?? false;
  const isDecimal = formItem?.type === FormItemTypeEnum.Decimal;

  const calculatedDefaultValue =
    defaultValue === undefined || defaultValue === null
      ? undefined
      : isDecimal
        ? parseFloat(defaultValue).toFixed(2)
        : defaultValue;

  const [value, setValue] = useState(calculatedDefaultValue);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    const commit = (v: string) => {
      setValue(v);
      setFormValue(formItem?.name, v, { shouldDirty: true, shouldValidate: true });
    };

    if (newValue === "" || (allowNegative && newValue === "-")) {
      commit(newValue);
      return;
    }

    const hasNegative = newValue.startsWith("-");
    const numericPart = hasNegative ? newValue.slice(1) : newValue;

    if (!allowNegative && newValue.includes("-")) return;
    if (allowNegative && (newValue.indexOf("-") > 0 || (newValue.match(/-/g) || []).length > 1)) return;

    if (!isDecimal) {
      if (/^-?\d*$/.test(newValue)) {
        commit(newValue);
        formItem?.onChange?.(apiData, newValue);
      }
      return;
    }

    const dotCount = (numericPart.match(/\./g) || []).length;
    const dotIndex = numericPart.indexOf(".");

    if (/^-?\d*\.?\d{0,2}$/.test(newValue) && dotCount <= 1 && (dotIndex === -1 || dotIndex > 0)) {
      commit(newValue);
      formItem?.onChange?.(apiData, newValue);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", allowNegative ? "-" : ""];
    if (allowedKeys.includes(event.key)) return;

    const isNumber = /^[0-9]$/.test(event.key);
    const isDot = isDecimal && event.key === ".";

    if (!isNumber && !isDot) event.preventDefault();
    if (isDot && value?.includes(".")) event.preventDefault();
  };

  useEffect(() => {
    setFormValue(formItem?.name, calculatedDefaultValue, { shouldDirty: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (calculatedDefaultValue !== undefined && calculatedDefaultValue !== null) {
      setValue(calculatedDefaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedDefaultValue]);

  useEffect(() => {
    if (triggerValue !== undefined && triggerValue !== null) {
      setValue(triggerValue);
      setFormValue(formItem?.name, triggerValue, { shouldDirty: true, shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerValue]);

  // ⚠️ Referansta `inputMode: FormItemTypeEnum.Decimal ? "decimal" : "numeric"`
  // yazılmıştı — sağ taraf `formItem?.type` DEĞİL, enum'un kendisiydi (her
  // zaman truthy "decimal" string'i). Bu, TAM SAYI (NUMBER) alanlarında bile
  // mobilde ondalık klavye açılmasına yol açıyordu. `isDecimal` kullanılıyor.
  const inputMode = isDecimal ? "decimal" : "numeric";

  return (
    <TextField
      variant={variant}
      fullWidth
      label={variant === "outlined" ? (formItem.labelText ?? t(formItem.label)) : undefined}
      type="text"
      inputMode={inputMode}
      placeholder={formItem?.placeholder || t("PlaceHolderValue", { value: t(formItem.label) })}
      error={!!error}
      helperText={errorMessage}
      disabled={formItem?.inputDisabled?.(isEdit, apiData) ?? false}
      defaultValue={calculatedDefaultValue}
      value={value}
      onKeyDown={handleKeyDown}
      slotProps={{
        inputLabel: { shrink: value !== undefined && value !== null && value !== "" },
        htmlInput: {
          step: isDecimal ? "0.01" : 1,
          pattern: isDecimal ? "[0-9]*" : undefined,
          inputMode,
        },
        input: {
          inputProps: { "data-cy": `input-${formItem.name}`, inputMode },
        },
      }}
      {...register(formItem?.name, {
        ...formItem?.registerOptions,
        setValueAs:
          formItem?.registerOptions?.setValueAs ??
          ((v) => {
            if (v === undefined || v === null || v === "") return undefined;
            const numeric = isDecimal ? parseFloat(v) : Number(v);
            return isNaN(numeric) ? undefined : numeric;
          }),
      })}
      onChange={handleChange}
    />
  );
}

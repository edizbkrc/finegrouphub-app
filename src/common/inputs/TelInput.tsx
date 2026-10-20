import { Controller } from "react-hook-form";
import { TextField } from "@mui/material";
import MaskedInput from "react-text-mask";
import type { ICommonInputProps } from "../types/ICommonInputProps";

const DEFAULT_TEL_PLACEHOLDER = "+90 123 456 7890";
const PHONE_MASK = ["+", "9", "0", " ", /\d/, /\d/, /\d/, " ", /\d/, /\d/, /\d/, " ", /\d/, /\d/, /\d/, /\d/];

export default function TelInput({
  formItem,
  error,
  errorMessage,
  defaultValue,
  apiData,
  t,
  isEdit,
  control,
  variant,
  setValue,
}: ICommonInputProps) {
  return (
    <Controller
      name={formItem.name}
      control={control}
      defaultValue={defaultValue}
      rules={
        formItem?.registerOptions
          ? { required: t("Required"), minLength: { message: t("MinLength13"), value: 13 } }
          : undefined
      }
      render={({ field: { onChange, value } }) => (
        <MaskedInput
          mask={PHONE_MASK}
          placeholder={formItem?.placeholder ?? DEFAULT_TEL_PLACEHOLDER}
          guide={false}
          value={value}
          onChange={(e) => {
            const trimmed = e.target.value.replace(/\s+/g, "");
            onChange(trimmed);
            formItem?.onChange?.(apiData, trimmed);
            setValue(formItem.name, trimmed.trim());
          }}
          render={(ref, inputProps) => (
            <TextField
              {...inputProps}
              inputRef={ref}
              variant={variant}
              disabled={formItem?.handleDisabled?.(isEdit, apiData) ?? false}
              label={variant === "outlined" ? t(formItem.label) : undefined}
              fullWidth
              error={!!error}
              helperText={errorMessage}
              slotProps={{ input: { inputProps: { "data-cy": `input-${formItem.name}` } } }}
            />
          )}
        />
      )}
    />
  );
}

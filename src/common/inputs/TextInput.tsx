import { TextField } from "@mui/material";
import type { ICommonInputProps } from "../types/ICommonInputProps";

export default function TextInput({
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
}: ICommonInputProps) {
  return (
    <TextField
      variant={variant}
      fullWidth
      multiline={formItem?.multiLine}
      label={variant === "outlined" ? t(formItem.label) : undefined}
      rows={formItem?.rows}
      type={formItem?.type}
      placeholder={formItem?.placeholder || t("PlaceHolderValue", { value: t(formItem.label) })}
      error={!!error}
      helperText={errorMessage}
      disabled={formItem?.handleDisabled?.(isEdit, apiData) ?? false}
      defaultValue={defaultValue}
      slotProps={{
        input: { inputProps: { "data-cy": `input-${formItem.name}` } },
      }}
      {...register(formItem?.name, {
        ...formItem?.registerOptions,
        setValueAs: (value) => value || undefined,
        onChange: (e) => {
          setValue(formItem?.name, e.target.value, { shouldDirty: true });
          formItem?.onChange?.(apiData, e.target.value);
        },
      })}
    />
  );
}

import { useEffect } from "react";
import type { UseFormWatch } from "react-hook-form";
import { TextField } from "@mui/material";
import type { ICommonInputProps } from "../types/ICommonInputProps";

/** Salt okunur, hesaplanmış değer gösteren alan (ör. toplam, özet metin). */
export interface ILabelFieldsProps extends ICommonInputProps {
  watch?: UseFormWatch<any>;
}

export default function LabelFields({ formItem, defaultValue, t, variant, watch, apiData, register, setValue }: ILabelFieldsProps) {
  const values = watch?.();
  const text = formItem?.getLabelText?.(values, apiData) ?? defaultValue;
  const value = formItem?.getLabelValue?.(values, apiData) ?? defaultValue;

  useEffect(() => {
    setValue(formItem?.name, value, { shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <TextField
      value={text}
      variant={variant}
      fullWidth
      multiline={formItem?.multiLine}
      label={variant === "outlined" ? t(formItem.label) : undefined}
      rows={formItem?.rows}
      type={formItem?.type}
      placeholder={formItem?.placeholder || t("PlaceHolderValue", { value: t(formItem.label) })}
      disabled
      defaultValue={defaultValue}
      slotProps={{ input: { inputProps: { "data-cy": `input-${formItem.name}` } } }}
      {...register(formItem?.name, { ...formItem?.registerOptions })}
    />
  );
}

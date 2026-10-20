import { useState } from "react";
import { Box, FormControl, FormControlLabel, FormHelperText, FormLabel, Stack, Switch } from "@mui/material";
import type { ICommonInputProps } from "../types/ICommonInputProps";

export default function SwitchInput({
  formItem,
  error,
  errorMessage,
  defaultValue,
  register,
  setValue,
  apiData,
  isEdit,
  variant,
  t,
}: ICommonInputProps) {
  const [switchValue, setSwitchValue] = useState<boolean>(!!defaultValue);

  const options = formItem?.options ?? [
    { label: t("Yes"), value: true },
    { label: t("No"), value: false },
  ];
  const trueLabel = options.find((opt) => opt?.value === true)?.label;
  const falseLabel = options.find((opt) => opt?.value === false)?.label;

  const baseInput = (
    <FormControl error={!!error}>
      <FormControlLabel
        control={
          <Switch
            checked={switchValue}
            disabled={formItem?.handleDisabled?.(isEdit, apiData) ?? false}
            {...register(formItem?.name, { ...formItem?.registerOptions })}
            onChange={(event, checked) => {
              setSwitchValue(checked);
              setValue(formItem?.name, checked, { shouldDirty: true });
              formItem?.onChange?.(apiData, checked);
            }}
            data-cy={`input-${formItem.name}`}
          />
        }
        label={switchValue ? trueLabel : falseLabel}
      />
      {error && <FormHelperText>{errorMessage}</FormHelperText>}
    </FormControl>
  );

  if (variant !== "outlined") return baseInput;

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Stack direction="row" alignItems="center">
        {formItem?.icon}
        <FormLabel sx={{ marginLeft: formItem?.icon ? 1 : 0 }}>{t(formItem.label)}</FormLabel>
      </Stack>
      {baseInput}
    </Box>
  );
}

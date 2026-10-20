import { Controller } from "react-hook-form";
import { FormControl, FormControlLabel, FormHelperText, FormLabel, Radio, RadioGroup } from "@mui/material";
import type { ICommonInputProps } from "../types/ICommonInputProps";

export default function RadioInput({
  formItem,
  error,
  errorMessage,
  defaultValue,
  setValue,
  apiData,
  control,
  t,
  variant,
}: ICommonInputProps) {
  return (
    <Controller
      name={formItem.name}
      control={control}
      defaultValue={defaultValue}
      render={() => (
        <FormControl error={!!error}>
          {variant === "outlined" && <FormLabel>{t(formItem.label)}</FormLabel>}
          <RadioGroup
            defaultValue={defaultValue}
            onChange={(event, v) => {
              setValue(formItem.name, v === "true", { shouldDirty: true });
              formItem?.onChange?.(apiData, v === "true");
            }}
            data-cy={`input-${formItem.name}`}
          >
            {formItem?.options?.map((opt) => (
              <FormControlLabel key={String(opt?.value)} value={opt?.value} control={<Radio />} label={opt?.label} />
            ))}
          </RadioGroup>
          {error && <FormHelperText>{errorMessage}</FormHelperText>}
        </FormControl>
      )}
    />
  );
}

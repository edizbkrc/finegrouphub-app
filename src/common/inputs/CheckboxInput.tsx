import type { InputHTMLAttributes } from "react";
import { Controller } from "react-hook-form";
import { Checkbox, FormControl, FormHelperText } from "@mui/material";
import type { ICommonInputProps } from "../types/ICommonInputProps";

export default function CheckboxInput({ formItem, error, errorMessage, defaultValue, apiData, control }: ICommonInputProps) {
  return (
    <FormControl error={!!error}>
      <Controller
        name={formItem.name}
        control={control}
        defaultValue={defaultValue}
        render={({ field }) => (
          <>
            {/*
              ⚠️ Referansta `{...field}` sonrasında `onChange={(e, checked) =>
              formItem?.onChange?.(apiData, checked)}` yazılmıştı — bu, spread
              edilen `field.onChange`'i EZİYORDU. Sonuç: checkbox'a tıklamak
              react-hook-form state'ini HİÇ güncellemiyordu; yalnızca formItem'ın
              yan etki callback'i çalışıyordu. Form submit'i checkbox'ın gerçek
              değerini asla görmüyordu. `field.onChange` önce çağrılır.
            */}
            <Checkbox
              inputProps={{ "data-cy": `input-${formItem.name}` } as InputHTMLAttributes<HTMLInputElement>}
              {...field}
              checked={!!field.value}
              onChange={(event, checked) => {
                field.onChange(checked);
                formItem?.onChange?.(apiData, checked);
              }}
            />
            {error && <FormHelperText>{errorMessage}</FormHelperText>}
          </>
        )}
      />
    </FormControl>
  );
}

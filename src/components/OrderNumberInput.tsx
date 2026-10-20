import type { ChangeEvent, Dispatch, KeyboardEvent, SetStateAction } from "react";
import { TextField } from "@mui/material";

interface IOrderNumberInputProps {
  value: string | number;
  setValue: Dispatch<SetStateAction<string | number>>;
  min?: number;
  max?: number;
  label?: string;
  placeholder?: string;
}

/** Yalnızca pozitif tam sayı kabul eden sipariş miktarı input'u. */
export default function OrderNumberInput({ value, setValue, min, max, label, placeholder }: IOrderNumberInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(event.key) && event.key !== "Backspace" && event.key !== "Delete") {
      event.preventDefault();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    if (!/^\d*$/.test(inputValue)) return;

    if (inputValue.length > 1 && inputValue.startsWith("0")) {
      setValue(inputValue.replace(/^0+/, ""));
      return;
    }

    const numeric = parseInt(inputValue, 10);
    if (min !== undefined && numeric < min) setValue(min);
    else if (max !== undefined && numeric > max) setValue(max);
    else setValue(inputValue);
  };

  return (
    <TextField
      variant="outlined"
      fullWidth
      label={label}
      type="number"
      placeholder={placeholder}
      value={value}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      slotProps={{
        htmlInput: { step: 1, inputMode: "numeric" },
        input: { inputProps: { "data-cy": "product-detail-count-input", inputMode: "numeric" } },
      }}
    />
  );
}

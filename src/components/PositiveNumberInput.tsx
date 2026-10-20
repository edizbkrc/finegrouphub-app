import type { ChangeEvent, KeyboardEvent } from "react";
import { TextField } from "@mui/material";

interface IPositiveNumberInputProps {
  label: string;
  placeholder?: string;
  value: string;
  setValue: (value: string) => void;
  size?: "small" | "medium";
  min?: number;
  max?: number;
}

/** `OrderNumberInput`'un aynısı ama `setValue` her zaman string alır. */
export default function PositiveNumberInput({ label, placeholder, value, setValue, size, min = 0, max = Number.MAX_SAFE_INTEGER }: IPositiveNumberInputProps) {
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

    const numeric = Number(inputValue);
    if (numeric < min) setValue(min.toString());
    else if (numeric > max) setValue(max.toString());
    else setValue(inputValue);
  };

  return (
    <TextField
      size={size}
      variant="outlined"
      fullWidth
      label={label}
      type="number"
      placeholder={placeholder}
      value={value}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      slotProps={{ htmlInput: { step: 1 }, input: { inputMode: "numeric" } }}
    />
  );
}

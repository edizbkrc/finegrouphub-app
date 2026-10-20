import { useState } from "react";
import { Controller } from "react-hook-form";
import { Box, Chip, IconButton, InputAdornment, TextField } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import type { ICommonInputProps } from "../types/ICommonInputProps";

export default function MultiArrayTextInput({
  formItem,
  error,
  errorMessage,
  control,
  t,
  apiData,
  isEdit,
  variant,
  defaultValue,
}: ICommonInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const maxLength = (formItem?.registerOptions?.maxLength as { value?: number })?.value;
  const minLength = (formItem?.registerOptions?.minLength as { value?: number })?.value || 0;
  const maxInputLength = 5000;

  const validateInput = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (formItem?.registerOptions?.pattern) {
      const pattern = formItem.registerOptions.pattern;
      const regex = pattern instanceof RegExp ? pattern : new RegExp((pattern as { value: RegExp | string }).value);
      if (!regex.test(trimmed)) {
        return (pattern as { message?: string }).message || t("InvalidFormat");
      }
    }

    if (formItem?.registerOptions?.validate) {
      const validateFn = formItem.registerOptions.validate;
      if (typeof validateFn === "function") {
        const result = validateFn(trimmed, {});
        if (result !== true && typeof result === "string") return result;
      } else if (typeof validateFn === "object") {
        for (const key in validateFn) {
          const result = validateFn[key](trimmed, {});
          if (result !== true && typeof result === "string") return result;
        }
      }
    }

    return null;
  };

  return (
    <Controller
      name={formItem?.name}
      control={control}
      defaultValue={defaultValue}
      rules={formItem?.registerOptions}
      render={({ field }) => {
        const currentLength = (field.value || []).length;
        const isMaxReached = !!maxLength && currentLength >= maxLength;
        const isMinReached = !!minLength && currentLength <= minLength;
        const canAddMore = !isMaxReached && !!inputValue.trim();

        const commitValue = () => {
          if (!canAddMore) return;
          const validationError = validateInput(inputValue);
          if (validationError) {
            setInputError(validationError);
            return;
          }
          const updated = [...(field.value || []), inputValue.trim()];
          field.onChange(updated);
          formItem?.onChange?.(apiData, updated);
          setInputValue("");
          setInputError(null);
        };

        return (
          <Box>
            <TextField
              fullWidth
              variant={variant}
              value={inputValue}
              onChange={(event) => {
                const newValue = event.target.value;
                if (newValue.length <= maxInputLength) {
                  setInputValue(newValue);
                  if (inputError) setInputError(null);
                }
              }}
              placeholder={formItem?.placeholder || t("PlaceHolderValue", { value: t(formItem.label) })}
              label={variant === "outlined" ? t(formItem.label) : undefined}
              disabled={formItem?.handleDisabled?.(isEdit, apiData) ?? false}
              error={!!error || !!inputError}
              helperText={inputError || errorMessage || (maxLength ? `${currentLength}/${maxLength} ${t("items")}` : undefined)}
              onKeyUp={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitValue();
                }
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={commitValue}
                        disabled={!canAddMore}
                        color={canAddMore ? "primary" : "default"}
                        sx={{ transition: "all 0.2s ease", opacity: canAddMore ? 1 : 0.4 }}
                      >
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  inputProps: { "data-cy": `input-${formItem.name}`, maxLength: maxInputLength },
                },
              }}
            />

            <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
              {(field.value || []).map((item: string, index: number) => (
                <Chip
                  key={index}
                  label={item}
                  onDelete={
                    isMinReached
                      ? undefined
                      : () => {
                          const updated = (field.value || []).filter((_: unknown, idx: number) => idx !== index);
                          field.onChange(updated);
                          formItem?.onChange?.(apiData, updated);
                        }
                  }
                  deleteIcon={<DeleteIcon />}
                  sx={{ "& .MuiChip-deleteIcon": { opacity: isMinReached ? 0.4 : 1, cursor: isMinReached ? "not-allowed" : "pointer" } }}
                />
              ))}
            </Box>
          </Box>
        );
      }}
    />
  );
}

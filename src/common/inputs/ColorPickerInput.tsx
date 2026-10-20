import { useState, type MouseEvent } from "react";
import { Controller } from "react-hook-form";
import { Box, IconButton, InputAdornment, Popover, TextField } from "@mui/material";
import { Colorize } from "@mui/icons-material";
import { HexColorPicker } from "react-colorful";
import type { ICommonInputProps } from "../types/ICommonInputProps";

/** Hex renk değeri döndürür (ör. #ff0000). */
export default function ColorPickerInput({
  formItem,
  control,
  error,
  errorMessage,
  defaultValue,
  variant = "standard",
  t,
}: ICommonInputProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const popoverId = open ? `color-picker-popover-${formItem.name}` : undefined;

  const normalizeColor = (color: unknown): string =>
    typeof color === "string" && color.startsWith("#") ? color.toLowerCase() : "#000000";

  const withHashPrefix = (value: string) => (value && !value.startsWith("#") ? `#${value}` : value);

  return (
    <Controller
      name={formItem.name}
      control={control}
      defaultValue={normalizeColor(defaultValue)}
      rules={formItem.registerOptions}
      render={({ field }) => (
        <Box>
          <TextField
            {...field}
            fullWidth
            variant={variant}
            // ⚠️ Referansta `label={formItem.label}` çevrilmemiş ham etiket
            // metniydi — kural #8 ihlali (hardcoded string). `t()` uygulanıyor.
            label={variant === "outlined" ? t(formItem.label) : undefined}
            placeholder={formItem.placeholder || "#000000"}
            error={!!error}
            helperText={errorMessage}
            disabled={formItem?.inputDisabled?.(false) ?? false}
            onChange={(event) => field.onChange(withHashPrefix(event.target.value))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      onClick={(event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget as HTMLButtonElement)}
                      sx={{
                        width: 36,
                        height: 28,
                        borderRadius: "6px",
                        backgroundColor: field.value || "#000000",
                        border: "1px solid",
                        borderColor: "divider",
                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                      title={String(field.value || "#000000")}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={(event) => setAnchorEl(event.currentTarget)}
                      edge="end"
                      size="small"
                      aria-describedby={popoverId}
                    >
                      <Colorize />
                    </IconButton>
                  </InputAdornment>
                ),
                inputProps: { "data-cy": `input-${formItem.name}`, maxLength: 7 },
              },
            }}
          />

          <Popover
            id={popoverId}
            open={open}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <Box sx={{ p: 2 }}>
              <HexColorPicker color={field.value || "#000000"} onChange={(color) => field.onChange(color)} />
              <TextField
                fullWidth
                size="small"
                value={field.value || "#000000"}
                onChange={(event) => field.onChange(withHashPrefix(event.target.value))}
                sx={{ mt: 2 }}
                placeholder="#000000"
                slotProps={{ htmlInput: { maxLength: 7 } }}
              />
            </Box>
          </Popover>
        </Box>
      )}
    />
  );
}

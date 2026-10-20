import { Controller } from "react-hook-form";
import { Box, Button, IconButton, Stack, TextField, Typography } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import type { ICommonInputProps } from "../types/ICommonInputProps";

export interface IPriceRange {
  id?: string;
  minRange: number;
  maxRange: number;
  price: number;
}

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

const toNumber = (value: string) => (value === "" ? 0 : Number(value));

/**
 * Kademeli birim fiyat girişi. Her satır `[minRange, maxRange]` aralığında
 * geçerli KDV'siz birim fiyatı tanımlar. Aralıklar çakışmamalı ve min ≤ max olmalı.
 */
export default function PriceRangesInput({ formItem, control, defaultValue, error, errorMessage, t }: ICommonInputProps) {
  const validate = (rows: IPriceRange[] | undefined) => {
    const list = [...(rows ?? [])].sort((a, b) => a.minRange - b.minRange);
    for (let i = 0; i < list.length; i++) {
      if (list[i].minRange > list[i].maxRange) return t("PriceRangeMinMax");
      if (i > 0 && list[i].minRange <= list[i - 1].maxRange) return t("PriceRangeOverlap");
    }
    return true;
  };

  return (
    <Controller
      name={formItem.name}
      control={control}
      defaultValue={defaultValue ?? []}
      rules={{ ...(formItem.registerOptions ?? {}), validate }}
      render={({ field, fieldState }) => {
        const rows: IPriceRange[] = field.value ?? [];
        const update = (index: number, key: keyof IPriceRange, value: string) => {
          const next = rows.map((row, i) => (i === index ? { ...row, [key]: toNumber(value) } : row));
          field.onChange(next);
        };
        const add = () => {
          const lastMax = rows.length ? rows[rows.length - 1].maxRange : -1;
          field.onChange([...rows, { id: EMPTY_GUID, minRange: lastMax + 1, maxRange: lastMax + 10, price: 0 }]);
        };
        const remove = (index: number) => field.onChange(rows.filter((_, i) => i !== index));

        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t(formItem.label)}
            </Typography>
            <Stack spacing={1}>
              {rows.map((row, index) => (
                <Stack key={index} direction={["column", "row"]} spacing={1} alignItems={["stretch", "center"]}>
                  <TextField size="small" type="number" label={t("MinRange")} value={row.minRange} onChange={(e) => update(index, "minRange", e.target.value)} inputProps={{ min: 0 }} />
                  <TextField size="small" type="number" label={t("MaxRange")} value={row.maxRange} onChange={(e) => update(index, "maxRange", e.target.value)} inputProps={{ min: 0 }} />
                  <TextField size="small" type="number" label={t("UnitPriceWithoutVat")} value={row.price} onChange={(e) => update(index, "price", e.target.value)} inputProps={{ min: 0, step: "0.01" }} />
                  <IconButton onClick={() => remove(index)} aria-label={t("Delete")}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
            <Button startIcon={<AddIcon />} onClick={add} sx={{ mt: 1 }}>
              {t("AddPriceRange")}
            </Button>
            {(error || fieldState.error) && (
              <Typography color="error" variant="caption" component="div">
                {fieldState.error?.message || errorMessage}
              </Typography>
            )}
          </Box>
        );
      }}
    />
  );
}

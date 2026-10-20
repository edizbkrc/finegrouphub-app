"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { Controller } from "react-hook-form";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Box } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";
import { mapIcons, type IMapIcon } from "@common/helpers/mapIcons";
import type { ICommonInputProps } from "../types/ICommonInputProps";

type IconComponent = ComponentType<{ style?: React.CSSProperties }>;

const getMaterialIcon = (iconName: string): IconComponent => {
  const componentName = iconName
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  return (MuiIcons as unknown as Record<string, IconComponent>)[componentName] ?? MuiIcons.Place;
};

export default function MuiIconAutocomplete({
  formItem,
  control,
  error,
  errorMessage,
  apiData,
  variant,
  setValue,
  t,
}: ICommonInputProps) {
  const [value, setValueState] = useState<IMapIcon | null>(null);

  const onChange = useCallback(
    (newValue: IMapIcon | null) => {
      setValueState(newValue);
      setValue(formItem.name, newValue?.id || "", { shouldDirty: true, shouldValidate: true });
      formItem?.onChange?.(apiData, newValue?.id || "");
    },
    [apiData, formItem, setValue]
  );

  useEffect(() => {
    if ((apiData as { emoji?: string })?.emoji) {
      const selectedIcon = mapIcons.find((icon) => icon.id === (apiData as { emoji?: string }).emoji);
      if (selectedIcon) setValueState(selectedIcon);
    }
  }, [apiData]);

  return (
    <Controller
      name={formItem.name}
      control={control}
      rules={formItem?.registerOptions}
      render={() => (
        <Autocomplete
          value={value}
          onChange={(_, newValue) => onChange(newValue)}
          options={mapIcons}
          getOptionLabel={(option) => option.title}
          isOptionEqualToValue={(option, val) => option.id === val.id}
          renderOption={(optionProps, option) => {
            const IconComponent = getMaterialIcon(option.icon);
            return (
              <li {...optionProps} key={option.id}>
                <Box display="flex" alignItems="center">
                  <IconComponent style={{ marginRight: 8, fontSize: 20 }} />
                  {option.title}
                </Box>
              </li>
            );
          }}
          renderInput={(params) => {
            const StartIcon = value ? getMaterialIcon(value.icon) : null;
            return (
              <TextField
                {...params}
                label={variant === "outlined" ? t(formItem.label) : undefined}
                placeholder={formItem?.placeholder || t("PlaceHolderValue", { value: t(formItem.label) })}
                fullWidth
                variant={variant}
                error={!!error}
                helperText={errorMessage}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    startAdornment: StartIcon ? <StartIcon style={{ marginRight: 8, fontSize: 20 }} /> : undefined,
                  },
                }}
              />
            );
          }}
        />
      )}
    />
  );
}

"use client";

import { Fragment, useEffect, useState, type ReactNode, type SyntheticEvent } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import { useMediaQuery } from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { toLookupRequest, toEnumLookupParams } from "@network/adapters";
import type { ILookupRequest } from "@common/types/ILookupRequest";

export interface IAutoSelectItem {
  id: unknown;
  title: string;
}

interface IAsyncAutocompleteProps {
  enumName?: string;
  isMultiple?: boolean;
  lookUpParams?: ILookupRequest;
  requestedPropertyName?: string;
  getFilteredList?: (newOptions: IAutoSelectItem[], baseData: unknown[]) => IAutoSelectItem[] | null;
  getOptions?: (
    setLoading: (loading: boolean) => void,
    setOptions: (values: IAutoSelectItem[]) => void,
    setSelected: (value: IAutoSelectItem | IAutoSelectItem[]) => void
  ) => void;
}

interface IProps {
  autoCompleteProps: IAsyncAutocompleteProps;
  label: string;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  defaultValue?: unknown;
  disablePortal?: boolean;
  fullWidth?: boolean;
  autoFocus?: boolean;
  renderOption?: (props: React.HTMLAttributes<HTMLLIElement>, option: IAutoSelectItem, state: { selected: boolean }) => ReactNode;
  getOptionDisabled?: (option: IAutoSelectItem) => boolean;
  groupBy?: (option: IAutoSelectItem) => string;
  sx?: object;
  defaultValueId?: unknown;
  initialEffect?: boolean;
}

/**
 * `AutoSelect` (common/inputs) ile aynı davranışı taşıyan, react-hook-form
 * dışında (kontrollü değer/onChange ile) kullanılan hafif sürüm.
 */
export default function AsyncAutocomplete({
  autoCompleteProps,
  label,
  onChange,
  disabled,
  defaultValue,
  disablePortal,
  renderOption,
  fullWidth,
  getOptionDisabled,
  autoFocus,
  groupBy,
  sx,
  defaultValueId,
  initialEffect,
}: IProps) {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<IAutoSelectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { enumName, lookUpParams, isMultiple, getOptions, getFilteredList } = autoCompleteProps || ({} as IAsyncAutocompleteProps);
  const [selected, setSelected] = useState<unknown>(defaultValue || null);

  const handleChange = (_: SyntheticEvent, values: unknown) => {
    setSelected(values);
    onChange(values);
  };

  const applyDefaultSelection = (newOptions: IAutoSelectItem[]) => {
    if (!defaultValueId) return;
    const defaultOption = newOptions.find((option) => option.id === defaultValueId);
    if (defaultOption) setSelected(defaultOption);
  };

  const getLookUpData = () => {
    handleChange(null as never, defaultValue);

    if (getOptions) {
      getOptions(setLoading, setOptions, setSelected);
      return;
    }

    setLoading(true);

    if (enumName) {
      axiosInstance
        .get(ApiRoutes.LookupsEnum, { params: toEnumLookupParams(enumName), withoutToast: true })
        .then((response) => {
          if (!response.data?.isSuccess) return;
          const data = response.data.data as { value: unknown; name: string }[];
          let newOptions: IAutoSelectItem[] = data.map((item) => ({ id: item.value, title: item.name }));
          if (getFilteredList) newOptions = getFilteredList(newOptions, data) || newOptions;
          setOptions(newOptions);
          applyDefaultSelection(newOptions);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

    if (!lookUpParams) {
      setLoading(false);
      return;
    }

    axiosInstance
      .patch(ApiRoutes.Lookups, toLookupRequest(lookUpParams), { withoutToast: true })
      .then((response) => {
        if (!response.data?.isSuccess) return;
        const data = response.data.data[0]?.data ?? [];
        const propertyName = lookUpParams.requestedPropertyNames[0] || "Name";
        let newOptions: IAutoSelectItem[] = data.map((item: Record<string, unknown>) => ({ id: item.Id, title: item?.[propertyName] as string }));
        if (getFilteredList) newOptions = getFilteredList(newOptions, data) || newOptions;
        setOptions(newOptions);
        applyDefaultSelection(newOptions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) getLookUpData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (autoFocus) setOpen(true);
  }, [autoFocus]);

  useEffect(() => {
    if (initialEffect) getLookUpData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEffect]);

  return (
    <Autocomplete
      sx={sx}
      fullWidth={fullWidth}
      multiple={isMultiple}
      disabled={disabled}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      disablePortal={disablePortal === undefined ? !isMobile : disablePortal}
      isOptionEqualToValue={(option, value) => option?.id === (value as IAutoSelectItem)?.id}
      getOptionLabel={(option) => (option as IAutoSelectItem)?.title || ""}
      getOptionDisabled={getOptionDisabled as never}
      value={selected as IAutoSelectItem}
      onChange={handleChange}
      renderOption={renderOption as never}
      groupBy={groupBy as never}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          data-cy={`autocomplete-${label}`}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <Fragment>
                  {loading ? <CircularProgress color="primary" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </Fragment>
              ),
            },
          }}
        />
      )}
    />
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import { Checkbox, Chip, useMediaQuery } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { toLookupRequest, toEnumLookupParams } from "@network/adapters";
import type { ICommonInputProps } from "../types/ICommonInputProps";
import type { IAutoCompleteProps } from "../types/IFormItem";

const uncheckedIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

interface IAutoSelectItem {
  id: unknown;
  title: string;
  [key: string]: unknown;
}

export default function AutoSelect({
  formItem,
  control,
  defaultValue: apiDefaultValue,
  error,
  errorMessage,
  apiData,
  isEdit,
  variant,
  setValue,
  t,
}: ICommonInputProps) {
  const translate = useTranslations();
  const {
    enumName,
    lookUpParams,
    isMultiple,
    requestedPropertyName = "id",
    getOptions,
    getFilteredList,
    getOptionDisabled,
    onChangeBase,
  } = formItem?.autoCompleteProps || ({} as IAutoCompleteProps);

  const selectAllOption: IAutoSelectItem = useMemo(
    () => ({ id: "all", title: translate("Form.SelectAll") }),
    [translate]
  );

  const defaultValue = formItem?.autoCompleteProps?.getDefaultValue?.(apiData, isEdit) ?? apiDefaultValue;
  const isMobile = useMediaQuery("(max-width:600px)");

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<IAutoSelectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<IAutoSelectItem[]>(defaultValue || []);
  const [inputValue, setInputValue] = useState("");

  const isSameDefaultValue = useMemo(() => {
    if (defaultValue === null || defaultValue === undefined || !defaultValue || defaultValue.length === 0) {
      return false;
    }
    if (isMultiple) {
      if (defaultValue.length !== selected.length) return false;
      return (defaultValue as IAutoSelectItem[]).every((item) =>
        selected.some((selectedItem) => selectedItem?.id === item?.id)
      );
    }
    return (defaultValue as IAutoSelectItem)?.id === (selected as unknown as IAutoSelectItem)?.id;
  }, [defaultValue, isMultiple, selected]);

  const onChange = useCallback(
    (values: unknown) => {
      setValue(formItem.name, values, { shouldDirty: true, shouldValidate: true });
      formItem?.onChange?.(apiData, values);
    },
    [apiData, formItem, setValue]
  );

  const handleChange = useCallback(
    (_: unknown, values: IAutoSelectItem[]) => {
      setSelected(values);
      onChangeBase?.(apiData, values);

      if (isMultiple) {
        onChange(values.filter((item) => item.id !== selectAllOption.id).map((item) => item[requestedPropertyName]));
      } else {
        onChange((values as unknown as IAutoSelectItem)?.[requestedPropertyName]);
      }
    },
    [apiData, isMultiple, onChange, onChangeBase, requestedPropertyName, selectAllOption.id]
  );

  const getLookUpData = useCallback(() => {
    if (options.length > 0) return;
    handleChange(null, defaultValue || []);

    if (getOptions) {
      const setCustomOptions = (values: unknown[]) => {
        const typedValues = values as IAutoSelectItem[];
        setOptions(isMultiple ? [selectAllOption, ...typedValues] : typedValues);
      };
      getOptions(setLoading, setCustomOptions, apiData);
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

          if (getFilteredList) newOptions = (getFilteredList(newOptions as never, data, isEdit) as IAutoSelectItem[] | null) || newOptions;

          if (isMultiple) {
            newOptions = [selectAllOption, ...newOptions];
            if ((defaultValue as unknown[])?.length === newOptions.length - 1) setSelected(newOptions);
          }

          setOptions(newOptions);
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
        const propertyNames = lookUpParams.requestedPropertyNames;
        const primaryProperty = propertyNames?.[0] || "Name";

        let newOptions: IAutoSelectItem[] = data.map((item: Record<string, unknown>) => {
          const option: IAutoSelectItem = { id: item?.Id, title: item?.[primaryProperty] as string };
          if (propertyNames && propertyNames.length > 1) {
            propertyNames.forEach((propName) => {
              if (propName !== primaryProperty) option[propName] = item?.[propName];
            });
          }
          return option;
        });

        if (getFilteredList) newOptions = (getFilteredList(newOptions as never, data, isEdit) as IAutoSelectItem[] | null) || newOptions;

        if (isMultiple) {
          newOptions = [selectAllOption, ...newOptions];
          if ((defaultValue as unknown[])?.length === newOptions.length - 1) setSelected(newOptions);
        }

        setOptions(newOptions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length, defaultValue, enumName, lookUpParams, isMultiple, getOptions, getFilteredList, isEdit, apiData]);

  useEffect(() => {
    if (open) getLookUpData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleAllSelect = () => {
    if (selected.length !== options.length) {
      setSelected([...options]);
      onChange(options.filter((item) => item.id !== selectAllOption.id).map((item) => item[requestedPropertyName]));
    } else {
      setSelected([]);
      onChange([]);
    }
  };

  const disabled = formItem?.handleDisabled?.(isEdit, apiData) ?? false;

  // MUI, input doluyken kutuya tıklamayla açık listeyi kapatmaz; kutunun tamamı aç/kapa yapsın.
  const handleToggleMouseDown = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (disabled || target.closest(".MuiAutocomplete-endAdornment, .MuiAutocomplete-popper, .MuiChip-root")) return;
    event.stopPropagation();
    if (target.tagName !== "INPUT") event.preventDefault();
    setOpen((prev) => !prev);
  };

  return (
    <Controller
      name={formItem.name}
      control={control}
      rules={isSameDefaultValue ? undefined : formItem?.registerOptions}
      render={() => (
        <Autocomplete
          disabled={disabled}
          onMouseDownCapture={handleToggleMouseDown}
          limitTags={1}
          getOptionDisabled={getOptionDisabled as never}
          disableCloseOnSelect={isMultiple}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          multiple={isMultiple}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          getOptionLabel={(option) => option?.title || ""}
          inputValue={isMultiple ? inputValue : undefined}
          onInputChange={
            isMultiple
              ? (_, newInputValue, reason) => {
                  if (reason !== "selectOption" && reason !== "reset") setInputValue(newInputValue);
                }
              : undefined
          }
          options={options.slice().sort((a, b) => {
            if (a?.id === "all") return -1;
            if (b?.id === "all") return 1;
            return (a?.title ?? "").localeCompare(b?.title ?? "");
          })}
          groupBy={
            options.length < 11
              ? undefined
              : (option) => (option?.id === "all" ? "" : option?.title?.charAt(0).toUpperCase())
          }
          disablePortal={!isMobile}
          loading={loading}
          defaultValue={defaultValue || []}
          value={selected}
          onChange={handleChange}
          renderTags={(value, getTagProps) => {
            const limit = 1;
            return (
              <>
                {value.slice(0, limit).map((option, index) => (
                  <Chip label={option?.title || option} {...getTagProps({ index })} key={option?.id as string} />
                ))}
                {value.length > limit ? <Chip label={`+${value.length - limit}`} /> : null}
              </>
            );
          }}
          renderOption={
            isMultiple
              ? (optionProps, option, { selected: isSelected }) => {
                  const { key, ...rest } = optionProps;
                  if (option.id === selectAllOption.id) {
                    return (
                      <li
                        key={`${option.id}-${option.title}`}
                        {...rest}
                        onClick={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                          handleAllSelect();
                        }}
                      >
                        <Checkbox
                          icon={uncheckedIcon}
                          checkedIcon={checkedIcon}
                          style={{ marginRight: 8 }}
                          checked={selected.length === options.length}
                          onClick={(event) => {
                            event.stopPropagation();
                            event.preventDefault();
                            handleAllSelect();
                          }}
                        />
                        {option.title}
                      </li>
                    );
                  }
                  return (
                    <li key={`${option.id}-${option.title}`} {...rest}>
                      <Checkbox icon={uncheckedIcon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={isSelected} />
                      {option.title}
                    </li>
                  );
                }
              : undefined
          }
          data-cy={`input-${formItem.name}`}
          renderInput={(params) => (
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
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
      )}
    />
  );
}

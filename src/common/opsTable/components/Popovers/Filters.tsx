import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import moment from "moment";
import { DatePicker, DateTimePicker } from "@mui/x-date-pickers";
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  Input,
  InputLabel,
  MenuItem,
  Select,
  Switch,
} from "@mui/material";
import type { Table } from "@tanstack/react-table";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CloseIcon from "@mui/icons-material/Close";
import DateProvider from "@/providers/DateProvider";
import { FilterTypeEnum } from "@common/enums/FilterTypeEnum";
import { TypeGroupEnum } from "@common/enums/TypeGroupEnum";
import { mapTypeGroupToInputType } from "@opsTable/helpers/mapTypeGroupToInputType";
import { supportedFilterTypes } from "@opsTable/helpers/supportedFilterTypes";
import { getFilterValueCount } from "@opsTable/helpers/getFilterValueCount";
import { useTableFilters } from "../../hooks/useTableFilters";
import { FilterDefaultItem } from "../../constants/FilterDefaultItem";
import type { ITableFilters } from "../../types/ITableFilters";
import type { IFiltersPopoverProps } from "../../types/IFiltersPopoverProps";

type FilterChangeHandler = (index: number, field: keyof ITableFilters, value: any) => void;

const disabledUntilOperator = (filter: ITableFilters) =>
  !(filter?.column && filter?.operator !== undefined && filter?.operator !== null);

export default function FiltersPopover({ table, opsService, handlePopoverClose }: IFiltersPopoverProps) {
  const t = useTranslations("Table");
  const { filters: appliedFilters } = useTableFilters();
  const [filters, setFilters] = useState<ITableFilters[]>([]);

  useEffect(() => {
    setFilters(
      appliedFilters.length === 0 ? [{ ...FilterDefaultItem } as unknown as ITableFilters] : appliedFilters
    );
  }, [appliedFilters]);

  const handleAddFilter = () => {
    if (filters.length < table.getAllLeafColumns().length) {
      setFilters((prev) => [...prev, { ...FilterDefaultItem } as unknown as ITableFilters]);
    }
  };

  const handleFilterChange: FilterChangeHandler = (index, field, value) => {
    const next = [...filters];

    if (field === "column") {
      const meta = table.getColumn(value)?.columnDef?.meta as
        | { filterType?: TypeGroupEnum; options?: unknown[] }
        | undefined;
      next[index] = {
        column: value,
        type: meta?.filterType ?? TypeGroupEnum.Default,
        options: (meta?.options as string[]) ?? [],
      } as ITableFilters;
    } else if (field === "operator" && value === FilterTypeEnum.Between) {
      next[index] = { ...next[index], [field]: value, value: undefined };
    } else {
      next[index] = { ...next[index], [field]: value };
    }

    setFilters(next);
  };

  const handleRemoveFilter = (index: number) => setFilters(filters.filter((_, i) => i !== index));

  const handleResetFilters = () => {
    opsService.handleFilter([], () => {
      handlePopoverClose?.();
      setFilters([]);
    });
  };

  const handleSubmitFilters = () => opsService.handleFilter(filters, handlePopoverClose);

  const renderFilterValue = (filter: ITableFilters, index: number) => {
    const valueCount = getFilterValueCount(filter?.operator);
    const inputName = filter?.column
      ? (table.getColumn(filter.column)?.columnDef?.header?.toString() ?? "")
      : "";

    if (valueCount === 0) return null;

    if (valueCount === 2 && filter?.type === TypeGroupEnum.Date) {
      return (
        <DateBetweenValueComponent
          inputName={inputName}
          index={index}
          handleFilterChange={handleFilterChange}
          filter={filter}
        />
      );
    }

    if (valueCount === 2 && filter?.type === TypeGroupEnum.Number) {
      return (
        <BetweenDecimalValueComponent
          inputName={inputName}
          index={index}
          handleFilterChange={handleFilterChange}
          filter={filter}
          placeholder={t("PlaceHolderValue", { value: inputName || "" })}
        />
      );
    }

    if (valueCount === 2) {
      return (
        <BetweenValueComponent
          inputName={inputName}
          index={index}
          handleFilterChange={handleFilterChange}
          filter={filter}
          placeholder={t("PlaceHolderValue", { value: inputName || "" })}
        />
      );
    }

    if (filter?.type === TypeGroupEnum.Date && filter?.operator === FilterTypeEnum.DateEqualTo) {
      return (
        <DateValueComponent index={index} filter={filter} handleFilterChange={handleFilterChange} inputName={inputName} />
      );
    }

    switch (filter?.type) {
      case TypeGroupEnum.Select:
        return (
          <SelectValueComponent
            index={index}
            filter={filter}
            handleFilterChange={handleFilterChange}
            options={
              (table.getColumn(filter.column)?.columnDef?.meta as { options?: { value: unknown; name: string }[] })
                ?.options ?? []
            }
            inputName={inputName}
          />
        );
      case TypeGroupEnum.Boolean:
        return <SwitchValueComponent index={index} filter={filter} handleFilterChange={handleFilterChange} inputName={inputName} />;
      case TypeGroupEnum.Date:
        return <DateTimeValueComponent index={index} filter={filter} handleFilterChange={handleFilterChange} inputName={inputName} />;
      case TypeGroupEnum.Number:
        return (
          <DecimalValueComponent
            index={index}
            filter={filter}
            handleFilterChange={handleFilterChange}
            inputName={inputName}
            placeholder={t("PlaceHolderValue", { value: inputName || t("Filter") })}
          />
        );
      default:
        return (
          <StandartValueComponent
            index={index}
            filter={filter}
            handleFilterChange={handleFilterChange}
            inputName={inputName}
            placeholder={t("PlaceHolderValue", { value: inputName || t("Filter") })}
          />
        );
    }
  };

  const hasSubmit =
    filters.length > 0 &&
    filters.every((f) => {
      const hasBase = f.column && f.operator != null;
      const hasValue =
        f.operator === FilterTypeEnum.Between
          ? f.value !== null && f.value !== undefined && f.value !== ("" as never) &&
            f.otherValue !== null && f.otherValue !== undefined && f.otherValue !== ("" as never)
          : f.value !== undefined && f.value !== null && f.value !== ("" as never);

      return hasBase && hasValue;
    });

  return (
    <DateProvider>
      <Box p={2} sx={{ minWidth: [300, 400, 500, 600] }}>
        {filters.map((filter, index) => (
          <Box key={index}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
              sx={{ flexWrap: ["wrap", "nowrap"] }}
              data-cy={`ops-table-filter-item-${index}`}
            >
              <IconButton
                aria-label="delete"
                size="small"
                onClick={() => handleRemoveFilter(index)}
                sx={{ mt: 2 }}
                data-cy="ops-table-filter-delete"
                disabled={index === 0}
              >
                <CloseIcon />
              </IconButton>

              <ColumnSelect filter={filter} handleFilterChange={handleFilterChange} index={index} table={table} />

              <OperatorSelect
                type={filter?.type}
                value={filter?.operator}
                handleOnChange={(e) => handleFilterChange(index, "operator", e.target.value)}
                index={index}
                filters={filters}
              />

              {renderFilterValue(filter, index)}
            </Box>

            <Divider sx={{ width: "100%", my: 2 }} />
          </Box>
        ))}

        <Box display="flex" justifyContent="space-between" mt={2}>
          <Button
            onClick={handleAddFilter}
            variant="outlined"
            disabled={filters.length >= table.getAllLeafColumns().length}
            startIcon={<AddCircleOutlineRoundedIcon />}
            data-cy="ops-table-filter-add"
            color="tertiary"
          >
            {t("Add")}
          </Button>
          <Box>
            <Button
              onClick={handleResetFilters}
              sx={{ mr: 1 }}
              data-cy="ops-table-filter-reset"
              disabled={filters.length === 0}
              color="tertiary"
            >
              {t("Reset")}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitFilters}
              disableElevation
              data-cy="ops-table-filter-apply"
              disabled={!hasSubmit}
              sx={{ color: "white" }}
            >
              {t("Apply")}
            </Button>
          </Box>
        </Box>

        <FormHelperText sx={{ mt: 2, textAlign: "right" }}>{t("FiltreInfo")}</FormHelperText>
      </Box>
    </DateProvider>
  );
}

function ColumnSelect({
  filter,
  handleFilterChange,
  index,
  table,
}: {
  filter: ITableFilters;
  handleFilterChange: FilterChangeHandler;
  index: number;
  table: Table<any>;
}) {
  const t = useTranslations("Table");
  const [columnOpen, setColumnOpen] = useState(false);

  useEffect(() => {
    if (index === 0 && !filter?.column) {
      const timeout = setTimeout(() => setColumnOpen(true), 300);
      return () => clearTimeout(timeout);
    }
    if (!filter?.column) setColumnOpen(true);
  }, [filter?.column, index]);

  return (
    <FormControl sx={{ mr: 1, ml: 1, minWidth: ["40%", 120] }} variant="standard" size="small">
      <InputLabel shrink>{t("Column")}</InputLabel>
      <Select
        displayEmpty
        value={filter.column}
        open={columnOpen}
        onOpen={() => setColumnOpen(true)}
        onClose={() => setColumnOpen(false)}
        onChange={(e) => handleFilterChange(index, "column", e.target.value)}
        inputProps={{ "data-cy": `ops-table-filter-select-column-${index}` }}
      >
        <MenuItem value="" disabled>
          {t("SelectColumn")}
        </MenuItem>
        {table
          .getAllLeafColumns()
          .filter((column) => column.columnDef?.enableColumnFilter)
          .map((column) => (
            <MenuItem key={column.id} value={column.id} data-cy={`ops-table-filter-select-column-${index}-${column.id}`}>
              {column?.columnDef?.header?.toString() || ""}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}

function OperatorSelect({
  value,
  handleOnChange,
  type,
  filters,
  index,
}: {
  value?: FilterTypeEnum;
  handleOnChange: (e: { target: { value: unknown } }) => void;
  type?: TypeGroupEnum;
  filters: ITableFilters[];
  index: number;
}) {
  const t = useTranslations("Table");
  const [open, setOpen] = useState(false);

  const filterTypes = type !== undefined && type !== null ? supportedFilterTypes[type] : new Set<FilterTypeEnum>();
  const currentColumn = filters[index].column;

  const usedOperatorsInSameColumn = filters
    .filter((f, i) => i !== index && f.column === currentColumn)
    .map((f) => f.operator);

  const filteredTypes = Array.from(filterTypes).filter((ft) => !usedOperatorsInSameColumn.includes(ft));

  useEffect(() => {
    if (currentColumn && (value === undefined || value === null)) setOpen(true);
  }, [currentColumn, value]);

  return (
    <FormControl sx={{ mr: 1, minWidth: ["40%", 120] }} variant="standard" size="small">
      <InputLabel shrink>{t("Operator")}</InputLabel>
      <Select
        displayEmpty
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        value={value === null || value === undefined ? "" : value}
        onChange={handleOnChange}
        inputProps={{ "data-cy": "ops-table-filter-select-operator" }}
        disabled={!currentColumn}
      >
        <MenuItem value="" disabled>
          {t("SelectFilterType")}
        </MenuItem>
        {filteredTypes.map((filterType) => (
          <MenuItem key={filterType} value={filterType} data-cy={`ops-table-filter-select-operator-${filterType}`}>
            {t(FilterTypeEnum[filterType] as never)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

interface IValueComponentProps {
  index: number;
  filter: ITableFilters;
  handleFilterChange: FilterChangeHandler;
  placeholder?: string;
  inputName?: string;
}

function useFocusOnReady(ref: React.RefObject<HTMLElement | null>, filter: ITableFilters) {
  useEffect(() => {
    if (filter?.column && filter?.operator !== undefined && filter?.operator !== null) {
      ref.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter?.column, filter?.operator]);
}

function StandartValueComponent({ index, filter, handleFilterChange, placeholder, inputName }: IValueComponentProps) {
  const t = useTranslations("Table");
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  useFocusOnReady(inputRef, filter);

  const disabled = disabledUntilOperator(filter);

  return (
    <FormControl fullWidth variant="standard" sx={{ minWidth: 150 }} disabled={disabled}>
      <InputLabel shrink htmlFor="filter-value">
        {inputName || t("Value")}
      </InputLabel>
      <Input
        inputRef={inputRef}
        value={filter?.value}
        placeholder={placeholder}
        onChange={(e) => handleFilterChange(index, "value", e.target.value)}
        inputProps={{ id: "filter-value" }}
        sx={{ height: "29px" }}
        type={mapTypeGroupToInputType(filter?.type)}
        lang={locale}
        data-cy={`ops-table-filter-value-${index}`}
        disabled={disabled}
      />
    </FormControl>
  );
}

function BetweenValueComponent({ index, filter, handleFilterChange, placeholder, inputName }: IValueComponentProps) {
  const t = useTranslations("Table");
  const inputRef = useRef<HTMLInputElement>(null);
  useFocusOnReady(inputRef, filter);
  const disabled = disabledUntilOperator(filter);

  return (
    <Box display="flex" gap={1}>
      <FormControl fullWidth variant="standard" disabled={disabled}>
        <InputLabel shrink htmlFor="filter-value">
          {inputName || t("Value")}
        </InputLabel>
        <Input
          inputRef={inputRef}
          value={filter.value}
          placeholder={placeholder}
          onChange={(e) => handleFilterChange(index, "value", e.target.value)}
          sx={{ height: "29px" }}
          type={mapTypeGroupToInputType(filter?.type)}
          data-cy={`ops-table-filter-value-${index}`}
          disabled={disabled}
        />
      </FormControl>
      <FormControl fullWidth variant="standard" disabled={disabled}>
        <InputLabel shrink htmlFor="filter-value">
          {inputName || t("Value")}
        </InputLabel>
        <Input
          value={filter.otherValue}
          placeholder={placeholder}
          onChange={(e) => handleFilterChange(index, "otherValue", e.target.value)}
          sx={{ height: "29px" }}
          type={mapTypeGroupToInputType(filter?.type)}
          data-cy={`ops-table-filter-otherValue-${index}`}
          disabled={disabled}
        />
      </FormControl>
    </Box>
  );
}

function DateValueComponent({ index, filter, handleFilterChange, inputName }: IValueComponentProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Table");

  useEffect(() => {
    if (filter?.column && filter?.operator !== undefined && filter?.operator !== null) setOpen(true);
  }, [filter?.column, filter?.operator]);

  const disabled = disabledUntilOperator(filter);

  return (
    <FormControl fullWidth variant="standard" sx={{ minWidth: 150 }} disabled={disabled}>
      <InputLabel shrink htmlFor="filter-value">
        {inputName || t("Value")}
      </InputLabel>
      <DatePicker
        disabled={disabled}
        sx={{ mt: 2 }}
        closeOnSelect
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        value={filter?.value ? moment(filter?.value) : null}
        onChange={(value) => handleFilterChange(index, "value", value)}
        slotProps={{
          field: { readOnly: true },
          textField: {
            variant: "standard",
            fullWidth: true,
            inputProps: { "data-cy": `ops-table-filter-value-${index}` },
            onClick: () => setOpen(true),
          },
        }}
      />
    </FormControl>
  );
}

function DateTimeValueComponent({ index, filter, handleFilterChange, inputName }: IValueComponentProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Table");

  useEffect(() => {
    if (filter?.column && filter?.operator !== undefined && filter?.operator !== null && !filter.value) {
      setOpen(true);
    }
  }, [filter?.column, filter?.operator, filter?.value]);

  const disabled = disabledUntilOperator(filter);

  return (
    <FormControl fullWidth variant="standard" sx={{ minWidth: 150 }} disabled={disabled}>
      <InputLabel shrink htmlFor="filter-value">
        {inputName || t("Value")}
      </InputLabel>
      <DateTimePicker
        disabled={disabled}
        timeSteps={{ hours: 1, minutes: 1 }}
        sx={{ mt: 2 }}
        closeOnSelect
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        value={filter?.value ? moment(filter?.value) : null}
        onChange={(value) => handleFilterChange(index, "value", value)}
        slotProps={{
          field: { readOnly: true },
          textField: {
            variant: "standard",
            fullWidth: true,
            inputProps: { "data-cy": `ops-table-filter-value-${index}` },
            onClick: () => setOpen(true),
          },
        }}
      />
    </FormControl>
  );
}

function DateBetweenValueComponent({ index, filter, handleFilterChange, inputName }: IValueComponentProps) {
  const t = useTranslations("Table");
  const [valueDateOpen, setValueDateOpen] = useState(false);
  const [otherDateOpen, setOtherDateOpen] = useState(false);

  useEffect(() => {
    if (filter?.column && filter?.operator !== undefined && filter?.operator !== null) setValueDateOpen(true);
  }, [filter?.column, filter?.operator]);

  useEffect(() => {
    if (filter?.value && !filter?.otherValue && !valueDateOpen) setOtherDateOpen(true);
  }, [filter, valueDateOpen]);

  const disabled = disabledUntilOperator(filter);

  return (
    <Box display="flex" gap={1}>
      <FormControl fullWidth variant="standard" disabled={disabled}>
        <InputLabel shrink htmlFor="filter-value">
          {inputName || t("Value")}
        </InputLabel>
        <DateTimePicker
          disabled={disabled}
          timeSteps={{ hours: 1, minutes: 1 }}
          sx={{ mt: 2 }}
          closeOnSelect
          open={valueDateOpen}
          onOpen={() => setValueDateOpen(true)}
          onClose={() => setValueDateOpen(false)}
          value={filter?.value ? moment(filter?.value) : null}
          onChange={(value) => handleFilterChange(index, "value", value)}
          slotProps={{
            field: { readOnly: true },
            textField: {
              variant: "standard",
              fullWidth: true,
              inputProps: { "data-cy": `ops-table-filter-value-${index}` },
              onClick: () => setValueDateOpen(true),
            },
          }}
        />
      </FormControl>
      <FormControl fullWidth variant="standard" disabled={disabled}>
        <InputLabel shrink htmlFor="filter-value">
          {inputName || t("Value")}
        </InputLabel>
        <DateTimePicker
          disabled={disabled}
          timeSteps={{ hours: 1, minutes: 1 }}
          sx={{ mt: 2 }}
          closeOnSelect
          open={otherDateOpen}
          onOpen={() => setOtherDateOpen(true)}
          onClose={() => setOtherDateOpen(false)}
          value={filter?.otherValue ? moment(filter?.otherValue) : null}
          onChange={(value) => handleFilterChange(index, "otherValue", value)}
          slotProps={{
            field: { readOnly: true },
            textField: {
              variant: "standard",
              fullWidth: true,
              inputProps: { "data-cy": `ops-table-filter-otherValue-${index}` },
              onClick: () => setOtherDateOpen(true),
            },
          }}
        />
      </FormControl>
    </Box>
  );
}

function SelectValueComponent({
  index,
  filter,
  handleFilterChange,
  options,
  inputName,
}: IValueComponentProps & { options?: { value: unknown; name: string }[] }) {
  const t = useTranslations("Table");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (filter?.column && filter?.operator !== undefined && filter?.operator !== null && !filter.value) {
      setOpen(true);
    }
  }, [filter?.column, filter?.operator, filter?.value]);

  const disabled = disabledUntilOperator(filter);

  return (
    <FormControl fullWidth variant="standard" disabled={disabled}>
      <InputLabel shrink htmlFor="filter-value">
        {inputName || t("Value")}
      </InputLabel>
      <Select
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        value={filter.value}
        onChange={(e) => handleFilterChange(index, "value", e.target.value)}
        inputProps={{ id: "filter-value" }}
        data-cy={`ops-table-filter-selectvalue-${index}`}
        disabled={disabled}
      >
        {options?.map((item, i) => (
          <MenuItem key={i} value={item.value as string} data-cy={`ops-table-filter-selectvalue-${index}-${item.value}`}>
            {item?.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function SwitchValueComponent({ index, filter, handleFilterChange, inputName }: IValueComponentProps) {
  const t = useTranslations("Table");
  const inputRef = useRef<HTMLInputElement>(null);
  useFocusOnReady(inputRef, filter);

  useEffect(() => {
    if (!filter?.value) handleFilterChange(index, "value", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FormControl fullWidth variant="standard" sx={{ ml: 1 }}>
      <InputLabel shrink htmlFor="filter-value">
        {inputName || t("Value")}
      </InputLabel>
      <FormControlLabel
        sx={{ pt: 1.5 }}
        control={
          <Switch
            inputRef={inputRef}
            disabled={disabledUntilOperator(filter)}
            checked={!!filter?.value}
            onChange={(e) => handleFilterChange(index, "value", !!e.target.checked)}
            inputProps={{ id: "filter-value" }}
            data-cy={`ops-table-filter-value-${index}`}
          />
        }
        label={filter?.value ? t("Yes") : t("No")}
      />
    </FormControl>
  );
}

/** `-?\d*\.?\d{0,2}` biçimine uyan ondalık girişini doğrular. */
function isValidDecimalInput(value: string, allowNegative: boolean): boolean {
  if (value === "" || (allowNegative && value === "-")) return true;
  if (!allowNegative && value.includes("-")) return false;

  const hasNegative = value.startsWith("-");
  const numericPart = hasNegative ? value.slice(1) : value;
  if (allowNegative && (value.indexOf("-") > 0 || (value.match(/-/g) || []).length > 1)) return false;

  const dotCount = (numericPart.match(/\./g) || []).length;
  const dotIndex = numericPart.indexOf(".");

  return /^-?\d*\.?\d{0,2}$/.test(value) && dotCount <= 1 && (dotIndex === -1 || dotIndex > 0);
}

// MUI `Input` bileşeninin `onKeyDown`'ı textarea'yı da kapsayan birleşik
// bir olay tipi veriyor; burada yalnızca <input> kullanıldığı için imza
// geniş tutulur.
function decimalKeyDown(
  event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  hasDot: boolean
) {
  const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "-"];
  if (allowedKeys.includes(event.key)) return;

  const isNumber = /^[0-9]$/.test(event.key);
  const isDecimal = event.key === ".";

  if (!isNumber && !isDecimal) event.preventDefault();
  if (isDecimal && hasDot) event.preventDefault();
}

function DecimalValueComponent({ index, filter, handleFilterChange, placeholder, inputName }: IValueComponentProps) {
  const t = useTranslations("Table");
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  useFocusOnReady(inputRef, filter);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isValidDecimalInput(event.target.value, true)) {
      handleFilterChange(index, "value", event.target.value);
    }
  };

  return (
    <FormControl fullWidth variant="standard" sx={{ minWidth: 150 }}>
      <InputLabel shrink htmlFor="filter-value">
        {inputName || t("Value")}
      </InputLabel>
      <Input
        inputRef={inputRef}
        value={filter?.value}
        placeholder={placeholder}
        onKeyDown={(e) => decimalKeyDown(e, !!filter?.value?.includes("."))}
        onChange={handleChange}
        inputMode="decimal"
        inputProps={{ id: "filter-value" }}
        sx={{ height: "29px" }}
        type="text"
        lang={locale}
        data-cy={`ops-table-filter-value-${index}`}
        disabled={disabledUntilOperator(filter)}
      />
    </FormControl>
  );
}

function BetweenDecimalValueComponent({ index, filter, handleFilterChange, placeholder, inputName }: IValueComponentProps) {
  const t = useTranslations("Table");
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  useFocusOnReady(inputRef, filter);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: "value" | "otherValue") => {
    if (isValidDecimalInput(event.target.value, true)) {
      handleFilterChange(index, field, event.target.value);
    }
  };

  const disabled = disabledUntilOperator(filter);

  return (
    <Box display="flex" gap={1}>
      <FormControl fullWidth variant="standard" disabled={disabled}>
        <InputLabel shrink htmlFor="filter-value">
          {inputName || t("Value")}
        </InputLabel>
        <Input
          inputRef={inputRef}
          value={filter?.value}
          placeholder={placeholder}
          onKeyDown={(e) => decimalKeyDown(e, !!filter?.value?.includes("."))}
          onChange={(e) => handleChange(e, "value")}
          inputMode="decimal"
          inputProps={{ id: "filter-value" }}
          sx={{ height: "29px" }}
          type="text"
          lang={locale}
          data-cy={`ops-table-filter-value-${index}`}
          disabled={disabled}
        />
      </FormControl>
      <FormControl fullWidth variant="standard" disabled={disabled}>
        <InputLabel shrink htmlFor="filter-value">
          {inputName || t("Value")}
        </InputLabel>
        <Input
          value={filter?.otherValue}
          placeholder={placeholder}
          onKeyDown={(e) => decimalKeyDown(e, !!filter?.otherValue?.includes("."))}
          onChange={(e) => handleChange(e, "otherValue")}
          inputMode="decimal"
          inputProps={{ id: "filter-value" }}
          sx={{ height: "29px" }}
          type="text"
          lang={locale}
          // ⚠️ Referansta bu ikinci alan da `ops-table-filter-value-${index}`
          // kullanıyordu — otherValue alanı `value` alanıyla AYNI data-cy'ye
          // sahipti, e2e testleri ikisini ayırt edemiyordu.
          data-cy={`ops-table-filter-otherValue-${index}`}
          disabled={disabled}
        />
      </FormControl>
    </Box>
  );
}

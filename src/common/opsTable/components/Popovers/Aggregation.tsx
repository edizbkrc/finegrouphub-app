import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Box, Button, FormControl, IconButton, InputLabel, MenuItem, Select } from "@mui/material";
import type { Table } from "@tanstack/react-table";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CloseIcon from "@mui/icons-material/Close";
import { useAppSelector } from "@redux/hooks";
import { AggregationTypeEnum } from "@common/enums/AggregationTypeEnum";
import { useTableAggregations } from "../../hooks/useTableAggregations";
import { AggeretionsDefaultItem } from "../../constants/AggeretionsDefaultItem";
import type { IAggregationPopoverProps } from "../../types/IAggregationPopoverProps";
import type { ITableAggregations } from "../../types/ITableAggregations";

type AggregationChangeHandler = (index: number, field: "column" | "type", value: any) => void;

export default function AggregationPopover({ table, opsService, handlePopoverClose }: IAggregationPopoverProps) {
  const t = useTranslations("Table");
  const { aggregations, setAggregations } = useTableAggregations();
  const aggregationResults = useAppSelector((s) => s.TableReducer.tableResponse?.aggregationResults) ?? [];

  const aggregatableColumns = table
    .getAllLeafColumns()
    .filter((column) => (column.columnDef.meta as { aggregatable?: boolean })?.aggregatable);

  const handleAddAggregation = () => {
    if (aggregations.length < table.getAllLeafColumns().length) {
      // AggeretionsDefaultItem "boş" bir satır temsil eder (type: null);
      // ITableAggregations.type nullable değil ama kullanıcı seçim yapana
      // kadar geçici olarak boş kalır.
      setAggregations([...aggregations, { ...AggeretionsDefaultItem } as unknown as ITableAggregations]);
    }
  };

  useEffect(() => {
    if (aggregations.length === 0) handleAddAggregation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAggregationChange: AggregationChangeHandler = (index, field, value) => {
    const next = [...aggregations];
    next[index] = { ...next[index], [field]: value };
    setAggregations(next);
  };

  const handleRemoveAggregation = (index: number) =>
    setAggregations(aggregations.filter((_, i) => i !== index));

  const handleResetAggregations = () => {
    opsService.handleAggregation([], () => {
      handlePopoverClose?.();
      setAggregations([]);
    });
  };

  const handleSubmitAggregations = () => opsService.handleAggregation(aggregations, handlePopoverClose);

  const hasSubmit = aggregations.length > 0 && aggregations.every((agg) => agg.column && agg.type != null);

  // Her sütun her aggregation tipiyle en fazla bir kez eklenebilir
  // (referansta bu sınır sabit "* 5" idi; enum'dan türetildi).
  const aggregationTypeCount = Object.keys(AggregationTypeEnum).filter((k) => isNaN(Number(k))).length;
  const maxAggregations = aggregatableColumns.length * aggregationTypeCount;

  return (
    <Box p={2} sx={{ minWidth: [300, 400] }}>
      {aggregations?.map((aggregation, index) => (
        <Box
          key={index}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
          data-cy={`ops-table-aggregation-item-${index}`}
        >
          <IconButton
            aria-label="delete"
            size="small"
            onClick={() => handleRemoveAggregation(index)}
            sx={{ mt: 2 }}
            data-cy="ops-table-aggregation-close"
            disabled={index === 0}
          >
            <CloseIcon />
          </IconButton>
          <ColumnSelect
            aggregation={aggregation}
            handleAggregationChange={handleAggregationChange}
            index={index}
            table={table}
          />
          <TypeSelect
            aggregation={aggregation}
            handleAggregationChange={handleAggregationChange}
            index={index}
            aggregations={aggregations}
          />
        </Box>
      ))}

      <Box display="flex" justifyContent="space-between" mt={2}>
        <Button
          onClick={handleAddAggregation}
          variant="outlined"
          startIcon={<AddCircleOutlineRoundedIcon />}
          disabled={aggregations.length >= maxAggregations}
          data-cy="ops-table-aggregation-add"
        >
          {t("Add")}
        </Button>
        <Box>
          <Button
            onClick={handleResetAggregations}
            sx={{ mr: 1 }}
            data-cy="ops-table-aggregation-reset"
            disabled={aggregationResults.length <= 0}
          >
            {t("Reset")}
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleSubmitAggregations}
            data-cy="ops-table-aggregation-apply"
            disabled={!hasSubmit}
          >
            {t("Apply")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function ColumnSelect({
  aggregation,
  handleAggregationChange,
  index,
  table,
}: {
  aggregation: ITableAggregations;
  handleAggregationChange: AggregationChangeHandler;
  index: number;
  table: Table<any>;
}) {
  const t = useTranslations("Table");
  const [columnOpen, setColumnOpen] = useState(false);

  useEffect(() => {
    if (index === 0 && !aggregation?.column) {
      const timeout = setTimeout(() => setColumnOpen(true), 300);
      return () => clearTimeout(timeout);
    }
    if (!aggregation?.column) setColumnOpen(true);
  }, [aggregation?.column, index]);

  return (
    <FormControl sx={{ mr: 1, ml: 1, minWidth: 120 }} variant="standard" size="small" fullWidth>
      <InputLabel shrink>{t("Column")}</InputLabel>
      <Select
        displayEmpty
        open={columnOpen}
        onClose={() => setColumnOpen(false)}
        onOpen={() => setColumnOpen(true)}
        value={aggregation.column}
        onChange={(e) => handleAggregationChange(index, "column", e.target.value)}
        inputProps={{ "data-cy": `ops-table-aggregation-select-aggregation-${index}` }}
      >
        <MenuItem value="" disabled>
          {t("SelectColumn")}
        </MenuItem>
        {table
          .getAllLeafColumns()
          .filter((column) => (column.columnDef.meta as { aggregatable?: boolean })?.aggregatable)
          .map((column) => (
            <MenuItem key={column.id} value={column.id} data-cy={`ops-table-aggregation-select-type-${index}-${column.id}`}>
              {column?.columnDef?.header?.toString() || ""}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}

function TypeSelect({
  aggregation,
  handleAggregationChange,
  index,
  aggregations,
}: {
  aggregation: ITableAggregations;
  handleAggregationChange: AggregationChangeHandler;
  index: number;
  aggregations: ITableAggregations[];
}) {
  const t = useTranslations("Table");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (aggregation?.column && (aggregation?.type === undefined || aggregation?.type === null)) setOpen(true);
  }, [aggregation]);

  return (
    <FormControl sx={{ mr: 1, minWidth: 120 }} variant="standard" size="small" fullWidth>
      <InputLabel shrink>{t("Type")}</InputLabel>
      <Select
        displayEmpty
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        value={aggregation.type}
        onChange={(e) => handleAggregationChange(index, "type", e.target.value)}
        inputProps={{ "data-cy": `ops-table-aggregation-select-type-${index}` }}
        disabled={!aggregation?.column}
      >
        <MenuItem value="" disabled>
          {t("SelectFilterType")}
        </MenuItem>
        {Object.keys(AggregationTypeEnum)
          .filter((key) => isNaN(Number(key)))
          .map((key) => {
            const value = AggregationTypeEnum[key as keyof typeof AggregationTypeEnum];
            // ⚠️ Referansta kontrol yalnızca `agg.type === value` idi — bir
            // tip HERHANGİ bir sütunda kullanılınca tüm sütunlarda devre dışı
            // kalıyordu (ör. bir sütuna Sum eklenince başka sütuna Sum
            // eklenemiyordu). Aynı sütun + aynı tip tekrarı engellenmeli.
            const usedOnSameColumn = aggregations.some(
              (agg, i) => i !== index && agg.column === aggregation.column && agg.type === value
            );

            return (
              <MenuItem
                key={key}
                value={value}
                disabled={usedOnSameColumn}
                data-cy={`ops-table-aggregation-select-type-${index}-${key}`}
              >
                {t(key as never)}
              </MenuItem>
            );
          })}
      </Select>
    </FormControl>
  );
}

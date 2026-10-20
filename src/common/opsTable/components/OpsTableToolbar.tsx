import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import moment from "moment";
import { Box, Button, Chip } from "@mui/material";
import type { Row } from "@tanstack/react-table";
import { useAppSelector } from "@redux/hooks";
import { FilterTypeEnum } from "@common/enums/FilterTypeEnum";
import { AggregationTypeEnum } from "@common/enums/AggregationTypeEnum";
import { TypeGroupEnum } from "@common/enums/TypeGroupEnum";
import { useTableFilters } from "../hooks/useTableFilters";
import { useTableAggregations } from "../hooks/useTableAggregations";
import type { ITableFilters } from "../types/ITableFilters";
import type { ITableToolbarProps } from "../types/ITableToolbarProps";
import OpsTablePopovers from "./OpsTablePopovers";

export default function OpsTableToolbar({
  table,
  toolBarButtons,
  tableVisibility,
  opsService,
  exportType,
  title,
}: ITableToolbarProps) {
  const t = useTranslations("Table");
  const { filtersVisibility = true, aggregationVisibility = true } = tableVisibility || {};

  const { filters, setFilters } = useTableFilters();
  const { aggregations, setAggregations } = useTableAggregations();

  const filtering = useAppSelector((state) => state.TableReducer.tableRequest?.filtering);
  const aggregation = useAppSelector(
    (state) => state.TableReducer.tableRequest?.aggregation?.criterias
  );

  const showFilters = filtersVisibility ? opsService.generateFilters(filtering?.criterias) : null;
  const showAggregations = aggregationVisibility ? aggregation : null;
  const selectedRows = useMemo(() => table.getSelectedRowModel().rows, [table]);

  const handleFilterDelete = useCallback(
    (index: number) => {
      const next = filters.filter((_, i) => i !== index);
      setFilters(next);
      opsService.handleFilter(next);
    },
    [filters, opsService, setFilters]
  );

  const handleAggregationDelete = useCallback(
    (index: number) => {
      const next = aggregations.filter((_, i) => i !== index);
      setAggregations(next);
      opsService.handleAggregation(next);
    },
    [aggregations, opsService, setAggregations]
  );

  const handleButtonClick = useCallback(
    (action: (rows: Row<unknown>[]) => void) => {
      if (selectedRows.length > 0) action(selectedRows);
    },
    [selectedRows]
  );

  const getFilterLabel = (filter: ITableFilters): string => {
    const columnLabel = table.getColumn(filter.column)?.columnDef.header as string;
    const operatorLabel = t(FilterTypeEnum[filter.operator as FilterTypeEnum] as never);

    const valueLabel = (() => {
      if (filter.operator === FilterTypeEnum.Between) {
        return filter.type === TypeGroupEnum.Date
          ? `${moment(filter.value).format("LLL")} - ${moment(filter.otherValue).format("LLL")}`
          : `${filter.value} - ${filter.otherValue}`;
      }

      if (filter.type === TypeGroupEnum.Boolean) {
        // `ITableFilters.value` tipi `string`, ama Boolean filtrelerde
        // SwitchValueComponent gerçek bir `boolean` yazar — tip ile çalışma
        // zamanı değeri kasıtlı olarak farklı.
        return (filter.value as unknown) === true ? t("Yes") : t("No");
      }

      if (filter.type === TypeGroupEnum.Date) {
        return moment(filter.value).format("LLL");
      }

      if (filter.type === TypeGroupEnum.Select) {
        const options =
          (table.getColumn(filter.column)?.columnDef?.meta as { options?: { value: unknown; name: string }[] })
            ?.options ?? [];
        return options.find((option) => option.value === filter.value)?.name ?? "";
      }

      return filter.value;
    })();

    return `${columnLabel} (${operatorLabel}): ${valueLabel}`;
  };

  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} mx={2} py={1} pt={3}>
      <Box display="flex" alignItems="center">
        <Box display="flex" ml={2}>
          {showFilters
            ?.filter((f) => f.column && f.value !== null && f.value !== undefined)
            .map((filter, index) => (
              <Chip
                key={index}
                label={getFilterLabel(filter)}
                onDelete={() => handleFilterDelete(index)}
                sx={{ mr: 1 }}
                color="primary"
                variant="outlined"
                data-cy={`ops-table-filter-chip-${index}`}
              />
            ))}

          {showAggregations?.map((agg, index) => (
            <Chip
              key={agg?.aggregateBy}
              label={`${table.getColumn(agg.aggregateBy)?.columnDef.header}: ${t(
                AggregationTypeEnum[agg.type] as never
              )}`}
              onDelete={() => handleAggregationDelete(index)}
              sx={{ mr: 1 }}
              variant="outlined"
              data-cy={`ops-table-aggregation-chip-${index}`}
            />
          ))}
        </Box>
      </Box>

      <Box display="flex" alignItems="center">
        {toolBarButtons && toolBarButtons.length > 0 && (
          <Box mr={2}>
            {toolBarButtons.map((button, index) => (
              <Button
                key={index}
                startIcon={button.startIcon}
                color={button.color}
                endIcon={button.endIcon}
                variant="outlined"
                onClick={() => handleButtonClick(button.onClick)}
                disabled={selectedRows.length === 0}
                data-cy={`ops-table-toolbar-button-${index}`}
              >
                {button.label}
              </Button>
            ))}
          </Box>
        )}

        <OpsTablePopovers
          table={table}
          tableVisibility={tableVisibility}
          opsService={opsService}
          exportType={exportType}
          title={title}
        />
      </Box>
    </Box>
  );
}

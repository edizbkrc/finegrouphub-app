import { useTranslations } from "next-intl";
import { TableCell, TableRow, Typography } from "@mui/material";
import { useAppSelector } from "@redux/hooks";
import { getAggregationTypeString } from "@opsTable/helpers/getAggregationTypeString";
import { useShowSelectionColumn } from "../../hooks/useShowSelectionColumn";
import type { IBaseTableProps } from "../../types/IBaseTableProps";

export default function AggregationsRow({ table }: IBaseTableProps) {
  const t = useTranslations("Table");
  const { showSelectionColumn } = useShowSelectionColumn();
  const aggregationResults =
    useAppSelector((s) => s.TableReducer.tableResponse?.aggregationResults) ?? [];

  if (aggregationResults.length === 0) return null;

  const renderAggregationCells = () =>
    table.getHeaderGroups()[0].headers.map((header) => {
      const columnMeta = header?.column?.columnDef?.meta as
        | { decimalPrecision?: { scale?: number } }
        | undefined;
      const scale = columnMeta?.decimalPrecision?.scale;

      const columnAggregations = aggregationResults.filter(
        (agg) => agg.aggregatedBy.toLowerCase() === header.id.toLowerCase()
      );

      // ⚠️ Referansta `columnVisibility[header.id.toLowerCase()]` kontrol
      // ediliyordu — ama kolon id'leri metadata `name` alanından geliyor ve
      // genelde camelCase/PascalCase'dir, lowercase anahtar hep `undefined`
      // dönüyor ve kontrol etkisizdi (sütun gizlense bile aggregation hücresi
      // görünmeye devam ediyordu). `header.column.getIsVisible()` doğru API.
      if (header.column.getIsVisible() && columnAggregations.length > 0) {
        return (
          <TableCell
            key={header.id}
            sx={{ borderWidth: 0 }}
            style={{
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              filter: "blur(1)",
              paddingLeft: "4px",
            }}
          >
            {columnAggregations
              .filter((agg) => agg.aggregatedBy && agg.result)
              .map((agg) => (
                <Typography
                  key={agg.type}
                  color="primary"
                  variant="body2"
                  sx={{ fontWeight: "bold" }}
                >
                  {`${t(getAggregationTypeString(agg.type))} (${
                    table.getColumn(agg.aggregatedBy.toLowerCase())?.columnDef.header
                  }) : ${Number(agg.result).toFixed(scale ?? 2)}`}
                </Typography>
              ))}
          </TableCell>
        );
      }

      return <TableCell key={header.id} sx={{ borderWidth: 0 }} />;
    });

  return (
    <TableRow data-cy="ops-table-aggregation-row">
      {showSelectionColumn && <TableCell sx={{ borderWidth: 0 }} />}
      {renderAggregationCells()}
    </TableRow>
  );
}

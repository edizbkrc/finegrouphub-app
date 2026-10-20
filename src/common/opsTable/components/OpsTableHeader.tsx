import { memo } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Checkbox,
  IconButton,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { flexRender } from "@tanstack/react-table";
import { useAppSelector } from "@redux/hooks";
import { SortTypeEnum } from "@common/enums/SortTypeEnum";
import { useShowSelectionColumn } from "../hooks/useShowSelectionColumn";
import type { ITableHeaderProps } from "../types/ITableHeaderProps";

function OpsTableHeader({
  table,
  opsService,
  tableProps: tableDefaultProps,
  actionIcons,
}: ITableHeaderProps) {
  const t = useTranslations("Table");
  const { showSelectionColumn } = useShowSelectionColumn();
  const { showEditIcon, showDeleteIcon, headerBackgroundColor } = tableDefaultProps;

  const sortingValue = useAppSelector((s) => s.TableReducer.tableRequest?.sorting);

  const handleSort = (columnId: string) => {
    const nextType =
      sortingValue?.sortBy === columnId && sortingValue.type === SortTypeEnum.Asc
        ? SortTypeEnum.Des
        : SortTypeEnum.Asc;

    opsService.handleSort(columnId, nextType);
  };

  const hasActionsColumn =
    showEditIcon || showDeleteIcon || (actionIcons && actionIcons.length > 0);

  return (
    <TableHead
      sx={{
        backgroundColor: headerBackgroundColor || "tableHeaderBg.main",
        "& .MuiTableCell-root": {
          borderBottom: "1px solid",
          borderBottomColor: "borderdashed.main",
        },
      }}
    >
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {showSelectionColumn && (
            <TableCell padding="checkbox" data-cy={`ops-table-header-${headerGroup.id}`}>
              <Checkbox
                indeterminate={table.getIsSomeRowsSelected()}
                checked={table.getIsAllRowsSelected()}
                onChange={table.getToggleAllRowsSelectedHandler()}
              />
            </TableCell>
          )}

          {headerGroup.headers.map((header, index) => {
            const meta = header?.column?.columnDef?.meta as
              | { filterable?: boolean; tooltipFormat?: string }
              | undefined;
            const isFilterable = meta?.filterable;
            const isSorted = sortingValue?.sortBy === header.id;

            return (
              <TableCell
                key={header.id}
                data-cy={`ops-table-header-${header.id}`}
                onClick={isFilterable ? () => handleSort(header.id) : undefined}
                sx={{
                  cursor: isFilterable ? "pointer" : "default",
                  position: "relative",
                  textAlign: "center",
                  paddingLeft: index === 0 ? "16px" : "4px",
                  paddingRight: "0px",
                }}
              >
                <Box display="flex" alignItems="center" sx={{ width: "100%" }}>
                  <Tooltip sx={{ flexGrow: 1 }} title={meta?.tooltipFormat || ""}>
                    <Typography
                      variant="body2"
                      sx={{
                        mr: "4px",
                        fontWeight: 700,
                        overflow: "hidden",
                        whiteSpace: "normal",
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </Typography>
                  </Tooltip>

                  {isFilterable && (
                    <IconButton
                      size="small"
                      sx={{
                        visibility: isSorted ? "visible" : "hidden",
                        opacity: isSorted ? 1 : 0.5,
                      }}
                    >
                      {sortingValue?.type === SortTypeEnum.Des ? (
                        <ArrowDownward fontSize="small" />
                      ) : (
                        <ArrowUpward fontSize="small" />
                      )}
                    </IconButton>
                  )}
                </Box>
              </TableCell>
            );
          })}

          {hasActionsColumn && (
            <TableCell sx={{ textAlign: "end" }}>
              <Typography sx={{ pr: 3, fontWeight: 700 }}>{t("Actions")}</Typography>
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableHead>
  );
}

export default memo(OpsTableHeader);

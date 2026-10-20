import { memo } from "react";
import { Box, Table, TableContainer, styled } from "@mui/material";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useAppSelector } from "@redux/hooks";
import { useShowSelectionColumn } from "../hooks/useShowSelectionColumn";
import type { IOpsTableProps } from "../types/IOpsTableProps";
import OpsTableToolbar from "./OpsTableToolbar";
import OpsTableHeader from "./OpsTableHeader";
import OpsTableBody from "./OpsTableBody";
import OpsTableFooter from "./OpsTableFooter";
import TableLoading from "./Loading/OpsTableLoading";

const CustomTableContainer = styled(TableContainer)(({ theme }) => ({
  overflowX: "auto",
  "&::-webkit-scrollbar": { height: "8px" },
  "&::-webkit-scrollbar-track": { background: theme.palette.background.default },
  "&::-webkit-scrollbar-thumb": { background: theme.palette.primary.main, borderRadius: "10px" },
  "&::-webkit-scrollbar-thumb:hover": { background: theme.palette.primary.dark },
}));

function OpsTable({
  columns,
  data,
  actionIcons = [],
  toolBarButtons,
  tableVisibility,
  opsService,
  tableProps: tableDefaultProps,
  customAppBar,
  onRowClick,
  title,
}: IOpsTableProps) {
  const { showSelectionColumn } = useShowSelectionColumn();
  const initialTableState = useAppSelector((state) => state.TableReducer?.initialTableState);
  const tableLoading = useAppSelector((state) => state.TableReducer?.tableLoading);

  const table = useReactTable({
    // `columns` referansın iki farklı üretici tipini (TableService.generateColumns
    // vs. elle yazılmış ColumnDef[]) kabul ediyor; react-table tek bir somut
    // tipe ihtiyaç duyuyor.
    columns: columns as ColumnDef<unknown, unknown>[],
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: showSelectionColumn,
    initialState: {
      ...initialTableState,
      pagination: {
        pageSize: initialTableState?.pagination?.pageSize || 10,
        // Sayfalama sunucu tarafında yönetiliyor (bkz. TableService.onChangePage);
        // react-table'ın kendi pageIndex'i render'da kullanılmıyor, yalnızca
        // `getPaginationRowModel` bir sayfa boyutuna ihtiyaç duyduğu için var.
        // Görünen sayfa numarası her zaman Redux'taki `currentPageNumber`'dan
        // okunur (bkz. OpsTableFooter).
        pageIndex: 0,
      },
    },
  });

  return (
    <CustomTableContainer sx={{ overflowX: "auto" }}>
      <Box
        sx={{
          minWidth: "1000px",
          position: "relative",
          borderRadius: "10px",
          backgroundColor: "background.paper",
        }}
      >
        {tableLoading && <TableLoading />}

        {customAppBar ?? (
          <OpsTableToolbar
            table={table}
            toolBarButtons={toolBarButtons}
            tableVisibility={tableVisibility}
            opsService={opsService}
            exportType={tableDefaultProps?.exportType}
            title={title}
          />
        )}

        <Table
          data-cy="ops-table"
          sx={{
            tableLayout: "fixed",
            borderRadius: "10px",
            "& .MuiTableCell-root": {
              borderBottom: "1px dashed",
              borderBottomColor: "borderdashed.main",
            },
          }}
        >
          <OpsTableHeader
            table={table}
            opsService={opsService}
            tableProps={tableDefaultProps}
            actionIcons={actionIcons}
          />
          <OpsTableBody
            opsService={opsService}
            table={table}
            actionIcons={actionIcons}
            tableProps={tableDefaultProps}
            onRowClick={onRowClick}
          />
        </Table>

        <OpsTableFooter table={table} opsService={opsService} />
      </Box>
    </CustomTableContainer>
  );
}

export default memo(OpsTable);

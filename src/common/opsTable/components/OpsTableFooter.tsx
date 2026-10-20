import { memo, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  PaginationItem,
  Select,
  type SelectChangeEvent,
  Typography,
} from "@mui/material";
import { useAppSelector } from "@redux/hooks";
import { useShowSelectionColumn } from "../hooks/useShowSelectionColumn";
import type { ITableFooterProps } from "../types/ITableFooterProps";

const PAGINATION_DATA_CY: Record<string, string> = {
  previous: "ops-table-pagination-prev",
  next: "ops-table-pagination-next",
  first: "ops-table-pagination-first",
  last: "ops-table-pagination-last",
};

function OpsTableFooter({ table, opsService }: ITableFooterProps) {
  const t = useTranslations("Table");
  const { currentPageNumber = 0, totalPageCount = 1 } =
    useAppSelector((state) => state.TableReducer?.tableResponse) || {};

  const { showSelectionColumn } = useShowSelectionColumn();
  const selectedRowCount = showSelectionColumn ? table.getSelectedRowModel().rows.length : 0;

  const onRowsPerPageChange = (event: SelectChangeEvent) => {
    const pageSize = Number(event.target.value);
    opsService.onChangePage(1, pageSize, () => table.setPageSize(pageSize));
  };

  const handlePageChange = (_event: ChangeEvent<unknown>, newPage: number) => {
    opsService.onChangePage(newPage, table.getState().pagination.pageSize);
  };

  return (
    <Box sx={{ width: "100%", p: 2, pt: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1 }}>
        <Box sx={{ flex: 2 }}>
          <Typography variant="body2">
            {showSelectionColumn && selectedRowCount > 0
              ? `${t("SelectedRows")}: ${selectedRowCount}`
              : null}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 11, display: "flex", justifyContent: "center" }}>
          <Pagination
            data-cy="ops-table-pagination"
            page={currentPageNumber}
            count={totalPageCount}
            showFirstButton
            showLastButton
            onChange={handlePageChange}
            renderItem={(item) => (
              <PaginationItem
                {...item}
                data-cy={PAGINATION_DATA_CY[item.type] ?? `ops-table-pagination-page-${item.page}`}
              />
            )}
          />
        </Box>

        <Box sx={{ flex: 2, display: "flex", justifyContent: "flex-end" }}>
          <FormControl>
            <InputLabel id="ops-table-page-size-label">{t("Size")}</InputLabel>
            <Select
              labelId="ops-table-page-size-label"
              data-cy="ops-table-page-size-select"
              size="small"
              value={table.getState().pagination.pageSize.toString()}
              label={t("Size")}
              onChange={onRowsPerPageChange}
            >
              {[10, 25, 50, 100].map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
}

export default memo(OpsTableFooter);

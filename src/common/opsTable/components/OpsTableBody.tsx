import { memo, useCallback, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Box, Checkbox, TableBody, TableCell, TableRow } from "@mui/material";
import type { Row } from "@tanstack/react-table";
import { useDensity } from "../hooks/useDensity";
import { useShowSelectionColumn } from "../hooks/useShowSelectionColumn";
import { DensityEnums } from "../constants/DensityEnums";
import { DenstityConstants } from "../constants/DenstityConstants";
import AggregationsRow from "./Body/AggregationsRow";
import CustomTableCells from "./Body/CustomTableCells";
import ActionsCell from "./Body/ActionsCell";
import type { ITableBodyProps } from "../types/ITableBodyProps";

const NotFoundComponent = dynamic(() => import("@components/NotFoundComponent"));
const BodyDeleteElemet = dynamic(() => import("./Body/BodyDeleteElemet"));

const ROW_HEIGHTS: Record<DensityEnums, string> = {
  [DensityEnums.Compact]: DenstityConstants.Compact,
  [DensityEnums.Standard]: DenstityConstants.Standard,
  [DensityEnums.Comfortable]: DenstityConstants.Comfortable,
};

function OpsTableBody({ table, actionIcons, tableProps, opsService, onRowClick }: ITableBodyProps) {
  const { showSelectionColumn } = useShowSelectionColumn();
  const { density } = useDensity();
  const [confirmDeleteRowId, setConfirmDeleteRowId] = useState<string>("");
  const router = useRouter();

  /**
   * `getEditUrl` verildiğinde satır bir bağlantı gibi davranır. Önceden satır
   * `<Link>` (yani `<a>`) ile sarılıyordu; `<tbody>` içinde `<a>` geçersiz HTML
   * olduğu için hydration hatası veriyordu. Artık yönlendirme satırın kendisinde:
   * Ctrl/Cmd/orta tık yeni sekmede açar, fare üstüne gelince sayfa ön-yüklenir.
   */
  const navigateToRow = (row: Row<unknown>, event: MouseEvent) => {
    if (!getEditUrl) return;
    const url = getEditUrl(row);
    if (event.ctrlKey || event.metaKey || event.button === 1) {
      window.open(url, "_blank", "noopener");
      return;
    }
    router.push(url);
  };

  const {
    showEditIcon,
    showDeleteIcon,
    handleDeleteSuccessCallBack,
    useTableData,
    getEditUrl,
    // Seed kayıt koruması: bu id ve altındaki kayıtlar düzenlenemez/silinemez.
    // ⚠️ Backend tarafında policy ile de doğrulanmalı — bu yalnızca UI kontrolü.
    lastDisabledRowId = 20,
  } = tableProps;

  const rowHeight = ROW_HEIGHTS[density ?? DensityEnums.Standard];
  const tableCellSize = density === DensityEnums.Compact ? "small" : "medium";

  const rowFilter = (rowId: string) =>
    confirmDeleteRowId && confirmDeleteRowId !== rowId ? "blur(4px)" : "none";

  const handleDeleteIconClick = useCallback((row: Row<unknown>) => {
    setConfirmDeleteRowId(row.id);
  }, []);

  const handleCancel = useCallback(() => setConfirmDeleteRowId(""), []);

  const handleCancelDelete = useCallback(
    (row: Row<unknown>) => {
      opsService.handleDelete(row, () => {
        setConfirmDeleteRowId("");
        handleDeleteSuccessCallBack?.();
      });
    },
    [handleDeleteSuccessCallBack, opsService]
  );

  const handleEditIconClick = useCallback(
    (row: Row<unknown>) => opsService.handleEdit(row, useTableData),
    [opsService, useTableData]
  );

  const handleRowClick = useCallback(
    (row: Row<unknown>) => {
      onRowClick?.(row);
      if (tableProps?.handleEditIconClick) tableProps.handleEditIconClick(row);
      else handleEditIconClick(row);
    },
    [handleEditIconClick, onRowClick, tableProps]
  );

  const rows = table.getRowModel().rows;
  const hasActionsColumn =
    showEditIcon || showDeleteIcon || (actionIcons && actionIcons.length > 0);

  if (rows.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell
            sx={{ borderBottom: "none !important" }}
            colSpan={table.getAllColumns().length + (hasActionsColumn ? 1 : 0)}
          >
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
              width="100%"
              sx={{ minHeight: "200px" }}
            >
              <NotFoundComponent />
            </Box>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {rows.map((row) => {
        if (confirmDeleteRowId === row.id) {
          return (
            <BodyDeleteElemet
              key={row.id}
              row={row}
              handleCancel={handleCancel}
              handleCancelDelete={() => handleCancelDelete(row)}
              rowHeigh={rowHeight}
              showSelectionColumn={showSelectionColumn}
              tableCellSize={tableCellSize}
            />
          );
        }

        // D1 sayesinde her satırda `id` güvenilir biçimde bulunur.
        const rowId = Number((row.original as { id?: number })?.id ?? lastDisabledRowId + 1);
        const isProtected = rowId <= lastDisabledRowId;

        return (
            <TableRow
              key={row.id}
              sx={{
                height: rowHeight,
                filter: rowFilter(row.id),
                cursor: showEditIcon || getEditUrl ? "pointer" : "default",
              }}
              hover={showEditIcon}
              onClick={
                getEditUrl
                  ? (event: MouseEvent) => navigateToRow(row, event)
                  : showEditIcon
                    ? () => handleRowClick(row)
                    : undefined
              }
              onAuxClick={getEditUrl ? (event: MouseEvent) => navigateToRow(row, event) : undefined}
              onMouseEnter={getEditUrl ? () => router.prefetch(getEditUrl(row)) : undefined}
              data-cy={`ops-table-row-${row.id}`}
            >
              {showSelectionColumn && (
                <TableCell padding="checkbox" size={tableCellSize}>
                  <Checkbox
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                  />
                </TableCell>
              )}

              {row.getVisibleCells().map((cell, index) => (
                <CustomTableCells index={index} cell={cell} tableCellSize={tableCellSize} key={cell.id} />
              ))}

              {hasActionsColumn && (
                <TableCell size={tableCellSize}>
                  {!isProtected && (
                    <ActionsCell
                      row={row}
                      actionIcons={actionIcons}
                      handleDeleteIconClick={() => handleDeleteIconClick(row)}
                      handleEditIconClick={() => handleEditIconClick(row)}
                      tableProps={tableProps}
                    />
                  )}
                </TableCell>
              )}
            </TableRow>
        );
      })}

      <AggregationsRow table={table} />
    </TableBody>
  );
}

export default memo(OpsTableBody);

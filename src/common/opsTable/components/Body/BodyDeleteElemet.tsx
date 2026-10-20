import { useTranslations } from "next-intl";
import { Box, IconButton, TableCell, TableRow, Typography } from "@mui/material";
import { Check, Close, Info } from "@mui/icons-material";
import type { IBodyDeleteElemetProps } from "../../types/IBodyDeleteElemetProps";
import CustomTableCells from "./CustomTableCells";

export default function BodyDeleteElemet({
  row,
  handleCancelDelete,
  handleCancel,
  rowHeigh,
  showSelectionColumn,
  tableCellSize,
}: IBodyDeleteElemetProps) {
  const t = useTranslations("Table");
  const visibleCells = row.getVisibleCells();

  return (
    <TableRow sx={{ height: rowHeigh }}>
      {showSelectionColumn && (
        <TableCell padding="checkbox" size={tableCellSize}>
          <IconButton>
            <Info color="warning" />
          </IconButton>
        </TableCell>
      )}

      {/* Son sütun (aksiyonlar) yerine silme onayı gösterilir. */}
      {visibleCells.slice(0, -1).map((cell, index) => (
        <CustomTableCells cell={cell} tableCellSize={tableCellSize} key={cell.id} index={index} />
      ))}

      <TableCell size={tableCellSize}>
        <Typography variant="body2">{t("DeleteInfo")}</Typography>
      </TableCell>

      <TableCell padding="checkbox">
        <Box display="flex" justifyContent="flex-end" alignItems="center" pr={3}>
          <IconButton
            onClick={handleCancelDelete}
            data-cy={`ops-table-row-delete-confirm-${row.id}`}
          >
            <Check color="primary" />
          </IconButton>
          <IconButton
            onClick={handleCancel}
            data-cy={`ops-table-row-delete-cancel-${row.id}`}
          >
            <Close color="action" />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
}

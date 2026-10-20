import { memo, type MouseEvent } from "react";
import Link from "next/link";
import { Box, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { IActionsCellProps } from "../../types/IActionsCellProps";

function ActionsCell({
  row,
  actionIcons = [],
  handleDeleteIconClick,
  handleEditIconClick,
  tableProps,
}: IActionsCellProps) {
  const { showEditIcon, showDeleteIcon, getEditUrl } = tableProps;

  const stopAnd = (fn: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    fn();
  };

  const onEditIcon = stopAnd(() =>
    tableProps?.handleEditIconClick
      ? tableProps.handleEditIconClick(row)
      : handleEditIconClick(row)
  );

  const onDeleteIcon = stopAnd(() =>
    tableProps?.handleDeleteIconClick
      ? tableProps.handleDeleteIconClick(row)
      : handleDeleteIconClick()
  );

  return (
    <Box display="flex" justifyContent="flex-end" alignItems="center" sx={{ pr: 1 }}>
      {actionIcons.map((IconComponent, index) => (
        <Box key={index}>{IconComponent(row)}</Box>
      ))}

      {showEditIcon &&
        (getEditUrl ? (
          <Link href={getEditUrl(row)} prefetch data-cy={`ops-table-row-link-${row.id}`}>
            <IconButton>
              <VisibilityIcon color="primary" />
            </IconButton>
          </Link>
        ) : (
          <IconButton onClick={onEditIcon} data-cy={`ops-table-row-detail-${row.id}`}>
            <VisibilityIcon color="primary" />
          </IconButton>
        ))}

      {showDeleteIcon && (
        <IconButton onClick={onDeleteIcon} data-cy={`ops-table-row-delete-${row.id}`}>
          <DeleteIcon />
        </IconButton>
      )}
    </Box>
  );
}

export default memo(ActionsCell);

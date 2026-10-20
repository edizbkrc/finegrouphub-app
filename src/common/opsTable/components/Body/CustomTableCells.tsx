import { memo, useEffect, useRef, useState } from "react";
import { TableCell, Tooltip } from "@mui/material";
import { flexRender, type Cell } from "@tanstack/react-table";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import { genericFormatString } from "@opsTable/helpers/genericFormatString";
import { mapTypeToEnum } from "@opsTable/helpers/mapTypeToEnum";
import { TypeGroupEnum } from "@common/enums/TypeGroupEnum";
import type { IMetadata } from "@common/types/IMetadata";

function CustomTableCells({
  cell,
  tableCellSize,
  index,
}: {
  cell: Cell<unknown, unknown>;
  tableCellSize: "small" | "medium";
  index: number;
}) {
  const cellRef = useRef<HTMLTableCellElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (cellRef.current) {
        setShowTooltip(cellRef.current.scrollWidth > cellRef.current.clientWidth);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getTooltipText = (): string | number => {
    const meta = (cell?.column?.columnDef?.meta as IMetadata) || ({} as IMetadata);
    const cellValue = cell.getValue();

    if (meta?.tooltipFormat) {
      return cellValue
        ? genericFormatString(cell.row.original, meta.tooltipFormat)
        : meta?.defaultValue;
    }

    if (mapTypeToEnum(meta.type) === TypeGroupEnum.Date) {
      return cellValue
        ? getLocalizedMoment(cellValue as string).format("LLL")
        : meta?.defaultValue;
    }

    if (typeof cellValue === "object") {
      return meta?.defaultValue || "-";
    }

    return (cellValue as string | number) || meta?.defaultValue;
  };

  const rendered = flexRender(cell.column.columnDef.cell, cell.getContext());

  const cellStyle = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    paddingLeft: index === 0 ? "16px" : "4px",
    ...(showTooltip ? {} : { filter: "blur(1)" }),
  };

  // ⚠️ Referansta `data-cy` değeri `flexRender(...)`'in kendisiydi — bu bir
  // React elemanı, string'e döküldüğünde "[object Object]" üretiyordu. Tüm
  // hücrelerin data-cy'si aynı ve e2e testlerinde kullanılamaz hâldeydi.
  // Kolon id'si kullanılıyor.
  const dataCy = `ops-table-cell-${cell.column.id}`;

  const cellNode = (
    <TableCell
      ref={cellRef}
      size={tableCellSize}
      style={cellStyle}
      padding="none"
      data-cy={dataCy}
    >
      {rendered}
    </TableCell>
  );

  if (!showTooltip) return cellNode;

  return (
    <Tooltip title={getTooltipText() || ""} arrow>
      {cellNode}
    </Tooltip>
  );
}

export default memo(CustomTableCells);

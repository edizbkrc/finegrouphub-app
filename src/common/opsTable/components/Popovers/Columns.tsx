import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { Box, Button, Checkbox, InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useShowSelectionColumn } from "../../hooks/useShowSelectionColumn";
import type { IColumnsPopoverProps } from "../../types/IColumnsPopoverProps";

export default function ColumnsPopover({ table, selectionColumnVisibility }: IColumnsPopoverProps) {
  const t = useTranslations("Table");
  const { showSelectionColumn, setShowSelectionColumn } = useShowSelectionColumn();
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredColumns = table
    .getAllLeafColumns()
    .filter((column) => column.columnDef.header?.toString().toLowerCase().includes(searchTerm));

  return (
    <Box p={2}>
      <TextField
        placeholder={t("SearchColumns")}
        fullWidth
        value={searchTerm}
        onChange={handleSearchChange}
        inputRef={searchInputRef}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      {selectionColumnVisibility && (
        <Box key="selection">
          <Checkbox
            checked={showSelectionColumn}
            onChange={(event) => setShowSelectionColumn(event.target.checked)}
          />
          {t("SelectionColumns")}
        </Box>
      )}

      {filteredColumns.map((column) => (
        <Box key={column.id}>
          <Checkbox checked={column.getIsVisible()} onChange={() => column.toggleVisibility()} />
          {column.columnDef.header?.toString() || ""}
        </Box>
      ))}

      <Button fullWidth onClick={() => table.resetColumnVisibility()} data-cy="ops-table-columns-reset">
        {t("Reset")}
      </Button>
    </Box>
  );
}

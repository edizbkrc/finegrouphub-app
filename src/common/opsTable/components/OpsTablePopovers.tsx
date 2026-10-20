import { useState, type MouseEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  Badge,
  Button,
  Drawer,
  IconButton,
  Popover,
  Stack,
  useMediaQuery,
  useTheme,
  type SxProps,
} from "@mui/material";
import Close from "@mui/icons-material/Close";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FunctionsIcon from "@mui/icons-material/Functions";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Refresh, ViewHeadline } from "@mui/icons-material";
import { useAppSelector } from "@redux/hooks";
import { ToolBarEnums } from "../constants/ToolBarEnums";
import { useTableExcelActions } from "../hooks/useTableExcelActions";
import type { ITablePopoversProps } from "../types/ITablePopoversProps";
import type { ITableExcelColumn } from "../helpers/tableExcelColumns";

const ColumnsPopover = dynamic(() => import("./Popovers/Columns"));
const FiltersPopover = dynamic(() => import("./Popovers/Filters"));
const DensityPopover = dynamic(() => import("./Popovers/Density"));
const AggregationPopover = dynamic(() => import("./Popovers/Aggregation"));
const ExportImportDialog = dynamic(() => import("./Popovers/ExportImportDialog"));

const POPOVER_ID: Record<ToolBarEnums, string> = {
  [ToolBarEnums.Aggregation]: "aggregation-popover",
  [ToolBarEnums.Filters]: "filter-popover",
  [ToolBarEnums.Columns]: "columns-popover",
  [ToolBarEnums.Density]: "density-popover",
  [ToolBarEnums.Export]: "export-popover",
  [ToolBarEnums.None]: "",
};

export default function OpsTablePopovers({
  table,
  tableVisibility,
  opsService,
  exportType,
  title,
}: ITablePopoversProps) {
  const t = useTranslations("Table");
  const {
    columnsVisibility = true,
    filtersVisibility = true,
    aggregationVisibility = true,
    densityVisibility = true,
    exportVisibility = true,
    refreshVisibility = true,
    selectionColumnVisibility = false,
  } = tableVisibility || {};

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { tableRequest } = useAppSelector((state) => state.TableReducer);
  const filterLength = tableRequest?.filtering?.criterias?.length ?? 0;
  const aggregationLength = tableRequest?.aggregation?.criterias?.length ?? 0;

  const hasAggregable = table
    .getAllLeafColumns()
    .some((column) => (column.columnDef.meta as { aggregatable?: boolean })?.aggregatable);
  const hasFilterable = table
    .getAllLeafColumns()
    .some((column) => (column.columnDef.meta as { filterable?: boolean })?.filterable);

  const { columns, canImport, exportCsv, exportTemplate } = useTableExcelActions({
    table,
    exportType,
    title,
    opsService,
  });

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [popoverType, setPopoverType] = useState<ToolBarEnums>(ToolBarEnums.None);
  const [importOpen, setImportOpen] = useState(false);
  const [importColumns, setImportColumns] = useState<ITableExcelColumn[]>([]);
  const open = Boolean(anchorEl);

  const handlePopoverOpen = (event: MouseEvent<HTMLElement>, type: ToolBarEnums) => {
    setAnchorEl(event.currentTarget);
    setPopoverType(type);
  };

  const handlePopoverClose = () => setAnchorEl(null);

  const handleOpenImport = () => {
    setImportColumns(columns);
    setImportOpen(true);
  };

  const renderPopoverContent = (): ReactNode => {
    switch (popoverType) {
      case ToolBarEnums.Columns:
        return <ColumnsPopover table={table} selectionColumnVisibility={selectionColumnVisibility} />;
      case ToolBarEnums.Filters:
        return <FiltersPopover table={table} opsService={opsService} handlePopoverClose={handlePopoverClose} />;
      case ToolBarEnums.Density:
        return <DensityPopover />;
      case ToolBarEnums.Aggregation:
        return (
          <AggregationPopover table={table} opsService={opsService} handlePopoverClose={handlePopoverClose} />
        );
      default:
        return null;
    }
  };

  const buttonSxProps: SxProps = { color: "tableHeaderButton.main", fontWeight: 700 };

  return (
    <>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {refreshVisibility && (
          <Button
            variant="text"
            color="inherit"
            sx={buttonSxProps}
            startIcon={<Refresh fontSize="large" />}
            onClick={() => opsService.refresh()}
            data-cy="ops-table-refresh"
          >
            {t("Refresh")}
          </Button>
        )}

        {filtersVisibility && hasFilterable && (
          <Badge badgeContent={filterLength} color="primary">
            <Button
              aria-describedby="filter-popover"
              variant="text"
              color="inherit"
              sx={buttonSxProps}
              startIcon={<FilterAltIcon fontSize="large" />}
              onClick={(event) => handlePopoverOpen(event, ToolBarEnums.Filters)}
              data-cy="ops-table-filter"
            >
              {t("Filter")}
            </Button>
          </Badge>
        )}

        {aggregationVisibility && hasAggregable && (
          <Badge badgeContent={aggregationLength} color="primary">
            <Button
              aria-describedby="aggregation-popover"
              variant="text"
              color="inherit"
              sx={buttonSxProps}
              startIcon={<FunctionsIcon fontSize="large" />}
              onClick={(event) => handlePopoverOpen(event, ToolBarEnums.Aggregation)}
              data-cy="ops-table-aggregation"
            >
              {t("Aggregation")}
            </Button>
          </Badge>
        )}

        {columnsVisibility && (
          <Button
            aria-describedby="columns-popover"
            variant="text"
            color="inherit"
            sx={buttonSxProps}
            startIcon={<VisibilityIcon fontSize="large" />}
            onClick={(event) => handlePopoverOpen(event, ToolBarEnums.Columns)}
            data-cy="ops-table-columns"
          >
            {t("Columns")}
          </Button>
        )}

        {densityVisibility && (
          <Button
            aria-describedby="density-popover"
            variant="text"
            color="inherit"
            sx={buttonSxProps}
            startIcon={<ViewHeadline fontSize="large" />}
            onClick={(event) => handlePopoverOpen(event, ToolBarEnums.Density)}
            data-cy="ops-table-density"
          >
            {t("Density")}
          </Button>
        )}

        {exportVisibility && (
          <>
            <Button
              variant="text"
              color="inherit"
              sx={buttonSxProps}
              startIcon={<SaveAltIcon fontSize="large" />}
              onClick={exportCsv}
              data-cy="ops-table-export"
            >
              {t("ExportAsCsv")}
            </Button>
            <Button
              variant="text"
              color="inherit"
              sx={buttonSxProps}
              startIcon={<FileDownloadOutlined fontSize="large" />}
              onClick={() => void exportTemplate()}
              data-cy="ops-table-export-template"
            >
              {t("ExportTemplate")}
            </Button>
            <Button
              variant="text"
              color="inherit"
              sx={buttonSxProps}
              startIcon={<UploadFileOutlined fontSize="large" />}
              onClick={handleOpenImport}
              disabled={!canImport}
              data-cy="ops-table-import-excel"
            >
              {t("ImportFromExcel")}
            </Button>
          </>
        )}
      </Stack>

      {isSmallScreen ? (
        <Drawer
          anchor="right"
          open={open}
          onClose={handlePopoverClose}
          data-cy={`ops-table-${popoverType}-popover`}
          sx={{
            width: "100%",
            flexShrink: 0,
            overflow: "hidden",
            transition: "width 0.3s ease",
            "& .MuiDrawer-paper": {
              width: "100%",
              boxSizing: "border-box",
              overflowX: "hidden",
              transition: "width 0.3s ease",
              paddingTop: "40px",
            },
          }}
        >
          <IconButton
            sx={{ position: "absolute", top: 1, right: 5, zIndex: 1 }}
            onClick={handlePopoverClose}
            data-cy="ops-table-close-popover"
          >
            <Close color="error" />
          </IconButton>
          {renderPopoverContent()}
        </Drawer>
      ) : (
        <Popover
          data-cy={`ops-table-${popoverType}-drawer`}
          id={POPOVER_ID[popoverType]}
          open={open}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{
            vertical: "top",
            horizontal: popoverType === ToolBarEnums.Filters ? "right" : "center",
          }}
        >
          {renderPopoverContent()}
        </Popover>
      )}

      <ExportImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        columns={importColumns}
        opsService={opsService}
        title={title}
      />
    </>
  );
}

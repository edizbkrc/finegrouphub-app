"use client";

import { useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Box, Chip, Divider, List, ListItemButton, ListItemIcon, ListItemText, Paper, Popover, Stack, Typography } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpsIconButton from "@components/OpsIconButton";
import { isProtectedUnitStateKind } from "./unitStateKind";

export interface IUnitStateCardData {
  id: number;
  name?: string;
  color?: string | null;
  filterable?: boolean;
  isDefault?: boolean;
  kind?: number;
}

/**
 * Durum tanımı kartı — renk şeridi ve örnek kutu ile seçilen renk net görünür.
 */
export default function UnitStateCard({
  data,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: {
  data: IUnitStateCardData;
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const t = useTranslations();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const color = typeof data.color === "string" && data.color.startsWith("#") ? data.color : "#9e9e9e";
  const protectedState = isProtectedUnitStateKind(data.kind);
  const allowDelete = canDelete && !protectedState;
  const showMenu = canEdit || allowDelete;

  const openMenu = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => setAnchorEl(null);

  return (
    <Paper
      variant="outlined"
      data-cy={`unit-state-card-${data.id}`}
      sx={{
        height: "100%",
        borderRadius: "12px",
        overflow: "hidden",
        transition: "border-color .2s ease, box-shadow .2s ease",
        "&:hover": { borderColor: "primary.main", boxShadow: 2 },
      }}
    >
      {/* Renk şeridi — kartın kimliği */}
      <Box sx={{ height: 10, bgcolor: color }} />

      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ px: 2, pt: 1.75, pb: 1 }}>
        <Box sx={{ minWidth: 0, pr: 1 }}>
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            {data.name || `#${data.id}`}
          </Typography>
          {data.kind != null && (
            <Typography variant="caption" color="text.secondary">
              {t(`UnitStateKind.${data.kind}`)}
            </Typography>
          )}
        </Box>
        {showMenu && (
          <OpsIconButton size="small" onClick={openMenu} data-cy={`unit-state-menu-${data.id}`}>
            <MoreVertIcon fontSize="small" />
          </OpsIconButton>
        )}
      </Stack>

      <Stack spacing={1.25} sx={{ px: 2, pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {t("Form.Color")}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
              {color.toUpperCase()}
            </Typography>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                bgcolor: color,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                flexShrink: 0,
              }}
            />
          </Stack>
        </Stack>

        <Divider />

        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center">
          {protectedState ? <Chip size="small" variant="outlined" label={t("Form.FixedState")} /> : null}
          {data.isDefault ? <Chip size="small" color="primary" label={t("Form.IsDefault")} /> : null}
          <Typography variant="body2" color="text.secondary">
            {t("Form.Filterable")}:{" "}
            <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
              {data.filterable ? t("Form.Yes") : t("Form.No")}
            </Box>
          </Typography>
        </Stack>
      </Stack>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <List dense sx={{ minWidth: 160 }}>
          {canEdit && (
            <ListItemButton
              onClick={() => {
                closeMenu();
                onEdit();
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t("Form.Edit")} />
            </ListItemButton>
          )}
          {allowDelete && (
            <ListItemButton
              onClick={() => {
                closeMenu();
                onDelete();
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <DeleteOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t("Form.Delete")} />
            </ListItemButton>
          )}
        </List>
      </Popover>
    </Paper>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import OpsIconButton from "@components/OpsIconButton";
import { ProjectEndpoint } from "@/features/project/helpers/ProjectEndpoint";

export interface IInfoCardPreviewItem {
  id?: number | string;
  name?: string | null;
  description?: string | null;
  displayOrder?: number;
  image?: { url?: string | null } | null;
}

export interface IInfoCardPreviewData {
  id: number;
  name?: string | null;
  displayOrder?: number;
  items?: IInfoCardPreviewItem[];
}

/** Prod hub bilgi kartı önizlemesi: başlık, sekmeler, görsel + açıklama. */
export default function InfoCardPreview({
  data,
  projectId,
  onDelete,
}: {
  data: IInfoCardPreviewData;
  projectId: number;
  onDelete?: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [tabIndex, setTabIndex] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [hasError, setHasError] = useState(false);

  const editHref = `/${locale}${ProjectEndpoint.InfoCard(projectId, data.id)}`;
  const tabs = [...(data.items ?? [])].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const active = tabs[Math.min(tabIndex, Math.max(tabs.length - 1, 0))];
  const mediaUrl = !hasError && active?.image?.url ? active.image.url : "/placeholder.png";
  const isVideo = /\.(mp4|webm|mov|avi|mkv|mpeg|m4v)(\?|$)/i.test(mediaUrl) || /\/videos\//i.test(mediaUrl);

  return (
    <Grid size={{ xs: 12, lg: 6 }}>
      <Card elevation={3} data-cy={`info-card-${data.id}`}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Link href={editHref} prefetch style={{ display: "contents", cursor: "pointer" }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
                {data.name || `#${data.id}`}
              </Typography>
            </Link>

            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: "top", horizontal: "center" }}
              transformOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
              <List dense>
                <ListItemButton component={Link} href={editHref} data-cy={`info-card-edit-${data.id}`}>
                  <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
                    <EditIcon />
                  </ListItemIcon>
                  <ListItemText primary={t("Modal.EditInfoCard")} />
                </ListItemButton>
                <ListItemButton
                  data-cy={`info-card-delete-${data.id}`}
                  onClick={() => {
                    onDelete?.();
                    setAnchorEl(null);
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
                    <DeleteOutlineIcon />
                  </ListItemIcon>
                  <ListItemText primary={t("Form.Delete")} />
                </ListItemButton>
              </List>
            </Popover>

            <OpsIconButton onClick={(event) => setAnchorEl(event.currentTarget)} data-cy={`info-card-menu-${data.id}`}>
              <MoreVertIcon />
            </OpsIconButton>
          </Stack>

          {tabs.length > 0 && (
            <Tabs value={Math.min(tabIndex, tabs.length - 1)} onChange={(_, value) => setTabIndex(value)} sx={{ mb: 3 }} variant="fullWidth">
              {tabs.map((tab, idx) => (
                <Tab key={String(tab.id ?? idx)} label={tab.name || `${idx + 1}`} />
              ))}
            </Tabs>
          )}

          <Grid container spacing={2} alignItems="flex-start">
            <Grid size={{ xs: 12, lg: 6 }}>
              <Box sx={{ position: "relative", width: "100%", height: 240, borderRadius: 2, overflow: "hidden", bgcolor: "action.hover" }}>
                {isVideo && !hasError && active?.image?.url ? (
                  <Box
                    component="video"
                    src={mediaUrl}
                    controls
                    muted
                    playsInline
                    sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                    onError={() => setHasError(true)}
                  />
                ) : (
                  <Image
                    src={mediaUrl}
                    alt={active?.name || data.name || ""}
                    fill
                    style={{ objectFit: "cover", borderRadius: "8px" }}
                    unoptimized
                    onError={() => setHasError(true)}
                  />
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Typography>{active?.description || ""}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
}

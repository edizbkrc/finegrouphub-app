"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import { OpsPageNames } from "@enums/OpsPageNames";
import { useOpsModal } from "@hooks/useOpsModal";
import { useAppDispatch } from "@redux/hooks";
import { setOpsModalData, setOpsModalVisible } from "@redux/appSlice";
import { usePageInformation } from "@hooks/usePageInformation";
import OpsTableProvider from "@opsTable/components/OpsTableProvider";
import InfoRow from "@components/InfoRow";
import { useProject } from "@/features/project/ProjectContext";
import { useProjectTable } from "@/features/project/useProjectTable";
import { useUnitAreaMetadataTransform } from "@/features/project/useUnitAreaFields";
import ProjectSection from "@/features/project/ProjectSection";
import AddFloorsDialog from "@/features/project/AddFloorsDialog";
import type { IFloorOption } from "@forms/project/UnitForm";

const UnitForm = dynamic(() => import("@forms/project/UnitForm"));
const BlockForm = dynamic(() => import("@forms/project/BlockForm"));

interface IBlockDetail {
  id: number;
  name?: string;
  unitCount: number;
  apartmentCount: number;
  floorCount: number;
  floors: IFloorOption[];
}

/** Blok detayı: katlar (ekle/sil) ve bu bloktaki daireler (ekle/düzenle/sil). */
export default function BlockDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams<{ blockId: string }>();
  const searchParams = useSearchParams();
  const blockId = Number(params.blockId);
  const queryStageId = Number(searchParams.get("stageId")) || undefined;
  const { projectId } = useProject();
  const dispatch = useAppDispatch();
  const { opsModalVisible, openOpsModal } = useOpsModal();
  const pageInfo = usePageInformation(OpsPageNames.ProjectOperationManagement);
  const canEdit = !!(pageInfo?.hasCreate && pageInfo?.userCanCreate);
  const canDelete = !!(pageInfo?.hasDelete && pageInfo?.userCanDelete);
  const canEditBlock = !!(pageInfo?.hasEdit && pageInfo?.userCanEdit);

  const [block, setBlock] = useState<IBlockDetail | null>(null);
  const [floorsOpen, setFloorsOpen] = useState(false);
  // Blok ve daire formları aynı redux modalını paylaşır; hangisinin açık olduğunu burada ayırt ederiz.
  const [editingBlock, setEditingBlock] = useState(false);
  const [fallbackStageId, setFallbackStageId] = useState<number | undefined>();
  const stageId = queryStageId ?? fallbackStageId;

  const hasFloors = (block?.floors?.length ?? 0) > 0;
  const metadataTransform = useUnitAreaMetadataTransform();
  // Katı olmayan blokta daire olamaz; blok yüklenip kat görülene kadar daire listesi istenmez.
  const service = useProjectTable(ApiRoutes.Units, ApiRoutes.UnitDetail, "unitId", projectId, {
    extraParams: { blockId },
    deleteKey: "id",
    enabled: hasFloors,
    metadataTransform,
  });

  const load = useCallback(() => {
    axiosInstance
      .get(ApiRoutes.BlockDetail, { params: { blockId }, withoutToast: true })
      .then((res) => setBlock(res?.data?.isSuccess ? (res.data.data as IBlockDetail) : null))
      .catch(() => setBlock(null));
  }, [blockId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!opsModalVisible) setEditingBlock(false);
  }, [opsModalVisible]);

  // Blok DTO'su etap döndürmüyor; URL'de stageId yoksa (doğrudan bağlantı) daire eklemek için
  // yalnızca projede tek etap varsa onu varsayarız, belirsizse ekleme kapalı kalır.
  useEffect(() => {
    if (queryStageId) return;
    axiosInstance
      .patch(ApiRoutes.Stages, { pageNumber: 1, rowCount: 2, projectId }, { withoutToast: true })
      .then((res) => {
        const rows = (res?.data?.data as { id: number }[] | undefined) ?? [];
        if (rows.length === 1) setFallbackStageId(rows[0].id);
      })
      .catch(() => {});
  }, [queryStageId, projectId]);

  const editBlock = () => {
    if (!block) return;
    setEditingBlock(true);
    dispatch(setOpsModalData(block));
    dispatch(setOpsModalVisible(true));
  };

  const deleteFloor = (floorId: number) => {
    axiosInstance
      .delete(ApiRoutes.BlockFloors, { data: { floorIdList: [floorId] } })
      .then((res) => {
        if (res?.data?.isSuccess) load();
      })
      .catch(() => {});
  };

  const floors = [...(block?.floors ?? [])].sort((a, b) => a.number - b.number);
  const nextNumber = floors.length ? floors[floors.length - 1].number + 1 : 0;

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        {/* Etap sekmesi korunsun diye stageId geri bağlantıya da taşınır. */}
        <Link href={`/${locale}${Routes.Project}/${projectId}/blocks${stageId ? `?stageId=${stageId}` : ""}`}>
          <Button startIcon={<ArrowBack />} color="inherit">
            {t("Form.Blocks")}
          </Button>
        </Link>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {block?.name}
        </Typography>
        {canEditBlock && (
          <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon />} onClick={editBlock} disabled={!block} data-cy="block-edit">
            {t("Project.EditBlock")}
          </Button>
        )}
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <InfoRow label={t("Form.BlockName")} value={block?.name} />
              <InfoRow label={t("Project.FloorTotal")} value={block?.floorCount} />
              <InfoRow label={t("Form.ApartmentCount")} value={block?.apartmentCount} />
              <InfoRow label={t("Project.UnitTotal")} value={block?.unitCount} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">{t("Project.Floors")}</Typography>
                {canEdit && (
                  <Button size="small" startIcon={<AddIcon />} onClick={() => setFloorsOpen(true)} data-cy="block-add-floors">
                    {t("Project.AddFloors")}
                  </Button>
                )}
              </Stack>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("Form.FloorCount")}</TableCell>
                    <TableCell>{t("Form.FloorPlanDefinition")}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {floors.map((floor) => (
                    <TableRow key={floor.id}>
                      <TableCell>{floor.number}</TableCell>
                      <TableCell>{floor.templateName}</TableCell>
                      <TableCell align="right">
                        {canDelete && (
                          <Tooltip title={t("Form.Delete")}>
                            <IconButton size="small" onClick={() => deleteFloor(floor.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {!stageId && floors.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("Project.AddUnitNeedsStage")}
        </Alert>
      )}

      <ProjectSection title={t("Project.Units")} onAdd={floors.length && stageId ? openOpsModal : undefined} addLabel={t("Modal.AddUnit")}>
        {block && !hasFloors ? (
          <Alert severity="info">{t("Project.AddFloorsFirst")}</Alert>
        ) : (
          <OpsTableProvider
            opsService={service}
            pageName={OpsPageNames.ProjectOperationManagement}
            tableProps={{ showEditIcon: true, showDeleteIcon: true, lastDisabledRowId: 0, handleDeleteSuccessCallBack: load }}
          />
        )}
      </ProjectSection>

      {opsModalVisible && !editingBlock && <UnitForm opsService={service} projectId={projectId} stageId={stageId} floors={floors} />}
      {opsModalVisible && editingBlock && <BlockForm opsService={service} succesCallback={load} />}
      {block && (
        <AddFloorsDialog open={floorsOpen} projectId={projectId} blockId={block.id} nextNumber={nextNumber} onClose={() => setFloorsOpen(false)} onAdded={load} />
      )}
    </>
  );
}

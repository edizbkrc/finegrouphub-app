"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { Box, Button, Card, CardContent, Chip, Divider, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { OpsPageNames } from "@enums/OpsPageNames";
import { Routes } from "@enums/Routes";
import { usePageInformation } from "@hooks/usePageInformation";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import InfoRow from "@components/InfoRow";
import OpsPageFormDeleteDialog from "@common/page/OpsPageFormDeleteDialog";
import TicketMessages from "@/features/ticket/TicketMessages";
import { TicketStateEnum, TicketTypeEnum, type ITicketDetail } from "@/features/ticket/types";

const STATE_COLOR: Record<number, "warning" | "success"> = {
  [TicketStateEnum.Open]: "warning",
  [TicketStateEnum.Solved]: "success",
};

// Enum değerleri API'de sabit (1..4 / 1..2) ve çeviri anahtarları da bu değerlerle tanımlı; ek bir lookup isteği gerekmez.
const STATE_OPTIONS = [TicketStateEnum.Open, TicketStateEnum.Solved];
const TYPE_OPTIONS = [TicketTypeEnum.Technical, TicketTypeEnum.Billing, TicketTypeEnum.Account, TicketTypeEnum.Other];

/** Talep detayı: solda yazışma, sağda talep bilgileri + durum/tip yönetimi (finehub TicketDetail düzeni). */
export default function TicketDetailForm({ data, reFetch }: { data?: ITicketDetail; reFetch?: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const pageInfo = usePageInformation(OpsPageNames.TicketManagement);
  const canEdit = !!(pageInfo?.hasEdit && pageInfo?.userCanEdit);
  const canDelete = !!(pageInfo?.hasDelete && pageInfo?.userCanDelete);

  const [title, setTitle] = useState(data?.title ?? "");
  const [type, setType] = useState<number | "">(data?.type ?? "");
  const [state, setState] = useState<number | "">(data?.state ?? "");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tenantName, setTenantName] = useState<string | null>(null);

  // Detay yeniden yüklenince (mesaj gönderimi, kayıt) form alanları sunucudaki değere çekilir.
  useEffect(() => {
    setTitle(data?.title ?? "");
    setType(data?.type ?? "");
    setState(data?.state ?? "");
  }, [data?.title, data?.type, data?.state]);

  // Talep DTO'su yalnızca tenant kimliğini ("acme_1") taşır; kullanıcıya kimlik değil firma adı gösterilir.
  useEffect(() => {
    if (!data?.tenantId) return;
    axiosInstance
      .get(ApiRoutes.CompanyDetail, { params: { tenantId: data.tenantId }, withoutToast: true })
      .then((res) => setTenantName(res?.data?.isSuccess ? ((res.data.data?.name as string | undefined) ?? null) : null))
      .catch(() => setTenantName(null));
  }, [data?.tenantId]);

  if (!data) return null;

  const companyHref = data.tenantId ? `/${locale}${Routes.Company}/${encodeURIComponent(data.tenantId)}` : undefined;
  const tenantLabel = tenantName ?? data.tenantId ?? "-";

  const save = () => {
    // PUT gövdesi yalnızca değişen alanları { value, isUpdated } zarfıyla taşır; değişmeyen alan eski değeri ezmesin.
    const changes: Record<string, { value: unknown; isUpdated: boolean }> = {};
    if (title.trim() !== (data.title ?? "")) changes.title = { value: title.trim(), isUpdated: true };
    if (type !== "" && type !== data.type) changes.type = { value: type, isUpdated: true };
    if (state !== "" && state !== data.state) changes.state = { value: state, isUpdated: true };

    if (Object.keys(changes).length === 0) {
      enqueueSnackbar(t("Toast.NotChangedData"), { variant: "warning", autoHideDuration: 3000 });
      return;
    }
    if (changes.title && !title.trim()) {
      enqueueSnackbar(t("Form.Required"), { variant: "warning", autoHideDuration: 3000 });
      return;
    }

    setSaving(true);
    axiosInstance
      .put(ApiRoutes.TicketDetail, { id: data.id, ...changes })
      .then((res) => {
        if (res?.data?.isSuccess) reFetch?.();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const remove = () => {
    setDeleteOpen(false);
    axiosInstance
      .delete(ApiRoutes.TicketDetail, { params: { ticketId: data.id } })
      .then((res) => {
        if (res?.data?.isSuccess) router.push(`/${locale}${Routes.Tickets}`);
      })
      .catch(() => {});
  };

  return (
    <Box>
      <Stack direction={["column", "row"]} justifyContent="space-between" alignItems={["stretch", "center"]} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Link href={`/${locale}${Routes.Tickets}`}>
            <Button startIcon={<ArrowBack />} color="inherit">
              {t("Form.Back")}
            </Button>
          </Link>
          <Box>
            <Typography variant="h5" data-cy="page-title">
              {data.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              #{data.id}
            </Typography>
          </Box>
        </Stack>
        {canDelete && (
          <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)} data-cy="ticket-delete">
            {t("DeleteModal.Delete")}
          </Button>
        )}
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <TicketMessages
            ticketId={data.id}
            messages={data.messages ?? []}
            solved={data.state === TicketStateEnum.Solved}
            canReply={canEdit}
            onSent={() => reFetch?.()}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {t("Ticket.TicketInfo")}
                </Typography>
                <InfoRow label={t("Form.TicketId")} value={`#${data.id}`} />
                <InfoRow
                  label={t("Form.Tenant")}
                  value={
                    companyHref ? (
                      <Link href={companyHref} style={{ color: "inherit", textDecoration: "underline" }} title={t("Ticket.GoToCompany")} data-cy="ticket-tenant">
                        {tenantLabel}
                      </Link>
                    ) : (
                      tenantLabel
                    )
                  }
                />
                <InfoRow
                  label={t("Form.State")}
                  value={data.state ? <Chip size="small" color={STATE_COLOR[data.state] ?? "default"} label={t(`TicketState.${data.state}`)} data-cy="ticket-state" /> : "-"}
                />
                <InfoRow label={t("Form.Type")} value={data.type ? <Chip size="small" variant="outlined" label={t(`TicketType.${data.type}`)} /> : "-"} />
                <InfoRow label={t("Form.Language")} value={data.languageName} />
                <InfoRow label={t("Ticket.Created")} value={data.auditInfo?.creationDate ? getLocalizedMoment(data.auditInfo.creationDate).format("LLL") : "-"} />
              </CardContent>
            </Card>

            {canEdit && (
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {t("Ticket.Manage")}
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t("Form.Title")}
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      inputProps={{ maxLength: 250 }}
                    />
                    <TextField select fullWidth size="small" label={t("Form.State")} value={state} onChange={(event) => setState(Number(event.target.value))}>
                      {STATE_OPTIONS.map((value) => (
                        <MenuItem key={value} value={value}>
                          {t(`TicketState.${value}`)}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField select fullWidth size="small" label={t("Form.Type")} value={type} onChange={(event) => setType(Number(event.target.value))}>
                      {TYPE_OPTIONS.map((value) => (
                        <MenuItem key={value} value={value}>
                          {t(`TicketType.${value}`)}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Divider />
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={saving} data-cy="ticket-save">
                      {t("Form.Save")}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>

      <OpsPageFormDeleteDialog deleteModalVisible={deleteOpen} handleDeleteModalClose={() => setDeleteOpen(false)} handleDelete={remove} />
    </Box>
  );
}

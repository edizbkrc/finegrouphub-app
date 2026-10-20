"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormGroup,
  FormHelperText,
  Grid,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import SaveIcon from "@mui/icons-material/Save";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { usePageInformation } from "@hooks/usePageInformation";
import LoadingComponent from "@components/LoadingComponent";
import OpsLayoutContent from "@layout/OpsLayoutContent";
import OpsPageHeader from "@layout/OpsPageHeader";
import { OpsPageNames } from "@enums/OpsPageNames";
import { Routes } from "@enums/Routes";

interface IPermission {
  id: number;
  name: string;
  description: string;
  permissionGroup: string;
  permissionGroupDescription: string;
}

interface IRoleDetail {
  name: string;
  permissions: { id: number }[];
}

/** Seçili izin id'lerini grup adına göre kümeler. */
type SelectionState = Record<number, boolean>;

/**
 * `roles/add` ve `roles/edit/[id]` ortak gövdesi.
 *
 * Referansta bu ~200 satırlık gövde iki dosyada aynen tekrarlanıyordu; tek
 * bileşende toplandı, `roleId` prop'unun varlığı add/edit ayrımını yapar.
 */
export default function RolePermissionMatrix({ roleId }: { roleId?: number }) {
  const isEdit = roleId !== undefined;
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pageInfo = usePageInformation(OpsPageNames.RoleManagement);
  const canSubmit = isEdit ? !!(pageInfo?.hasEdit && pageInfo?.userCanEdit) : !!(pageInfo?.hasCreate && pageInfo?.userCanCreate);

  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [selection, setSelection] = useState<SelectionState>({});
  const [roleName, setRoleName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    axiosInstance
      .patch(ApiRoutes.Permissions, { pageNumber: 1, rowCount: 1000 }, { withoutToast: true })
      .then(async (permissionsResponse) => {
        if (!permissionsResponse.data?.isSuccess) return;
        setPermissions(permissionsResponse.data.data as IPermission[]);

        if (!isEdit) return;

        const detailResponse = await axiosInstance.get(ApiRoutes.RoleDetail, {
          params: { RoleId: roleId },
          withoutToast: true,
        });

        if (!detailResponse.data?.isSuccess) return;

        const role = detailResponse.data.data as IRoleDetail;
        setRoleName(role.name ?? "");
        setSelection(
          role.permissions.reduce<SelectionState>((acc, permission) => {
            acc[permission.id] = true;
            return acc;
          }, {})
        );
      })
      .finally(() => setLoading(false));
  }, [isEdit, roleId]);

  const groupedPermissions = useMemo(
    () =>
      permissions.reduce<Record<string, IPermission[]>>((acc, permission) => {
        (acc[permission.permissionGroup] ??= []).push(permission);
        return acc;
      }, {}),
    [permissions]
  );

  const togglePermission = (id: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelection((prev) => ({ ...prev, [id]: event.target.checked }));
  };

  const handleSubmit = () => {
    if (!roleName.trim()) {
      setNameError(true);
      return;
    }

    const permissionIdList = Object.entries(selection)
      .filter(([, checked]) => checked)
      .map(([id]) => Number(id));

    setSubmitLoading(true);

    const request = isEdit
      ? axiosInstance.put(ApiRoutes.RoleDetail, {
          id: roleId,
          name: { value: roleName, isUpdated: true },
          permissionIdList: { value: permissionIdList, isUpdated: true },
        })
      : axiosInstance.post(ApiRoutes.RoleDetail, { name: roleName, permissionIdList });

    request
      .then((response) => {
        if (!response.data?.isSuccess) return;
        const target = isEdit ? Routes.Roles : `${Routes.EditRole}/${response.data.data}`;
        router.push(`/${locale}${target}`);
      })
      .finally(() => setSubmitLoading(false));
  };

  const groupEntries = Object.entries(groupedPermissions);

  return (
    <OpsLayoutContent>
      <LoadingComponent open={submitLoading} />

      <OpsPageHeader
        title={t(isEdit ? "RoleManagement.Detail" : "RoleManagement.Create")}
        backRoute={`/${locale}${Routes.Roles}`}
        renderRightHeader={
          canSubmit
            ? () => (
                <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", height: "100%" }}>
                  <Button
                    loading={submitLoading}
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disableElevation
                    startIcon={isEdit ? <SaveIcon /> : <ControlPointIcon />}
                    sx={{ width: ["100%", "auto"] }}
                    size="large"
                    data-cy="role-submit"
                  >
                    {t("Button.Save")}
                  </Button>
                </Box>
              )
            : undefined
        }
      />

      <Box sx={{ width: "100%", pt: 5, pb: 1 }}>
        <Box sx={{ mb: 4, p: 1 }}>
          {loading ? (
            <Skeleton variant="rectangular" width="100%" height={56} />
          ) : (
            <Grid container>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography sx={{ fontWeight: 600, pr: 4 }} variant="h6" textAlign={{ xs: "center", sm: "right" }}>
                  {t("Form.RoleName")}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 9 }} mt={{ xs: 2, sm: 0 }}>
                <TextField
                  placeholder={t("Form.EnterRoleName")}
                  variant="standard"
                  value={roleName}
                  onChange={(event) => {
                    setRoleName(event.target.value);
                    setNameError(false);
                  }}
                  error={nameError}
                  helperText={nameError ? t("Form.Required") : ""}
                  data-cy="role-name"
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
                <Divider sx={{ mt: 2 }} />
              </Grid>
            </Grid>
          )}
        </Box>

        {loading
          ? Array.from({ length: 3 }).map((_, groupIndex) => (
              <Box key={groupIndex} sx={{ mb: 4, p: 1 }}>
                <Grid container>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Skeleton variant="text" width="70%" height={32} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 9 }} mt={{ xs: 2, sm: 0 }}>
                    {Array.from({ length: 5 }).map((_, rowIndex) => (
                      <Skeleton key={rowIndex} variant="rectangular" height={32} sx={{ mb: 2 }} width="50%" />
                    ))}
                  </Grid>
                </Grid>
              </Box>
            ))
          : groupEntries.map(([group, groupPermissions], index) => (
              <Box key={group} sx={{ mb: 4, p: 1 }}>
                <Grid container>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Typography sx={{ fontWeight: 600, pr: 4 }} variant="h6" textAlign={{ xs: "center", sm: "right" }}>
                      {groupPermissions[0].permissionGroupDescription}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 9 }} mt={{ xs: 2, sm: 0 }}>
                    <FormGroup>
                      {groupPermissions.map((permission) => (
                        <Box key={permission.id} sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                          <Checkbox
                            checked={selection[permission.id] || false}
                            onChange={togglePermission(permission.id)}
                            data-cy={`role-permission-${permission.id}`}
                          />
                          <Box sx={{ pt: 1 }}>
                            <Typography>{permission.name}</Typography>
                            <FormHelperText sx={{ margin: 0 }}>{permission.description}</FormHelperText>
                          </Box>
                        </Box>
                      ))}
                    </FormGroup>
                    {index !== groupEntries.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Grid>
                </Grid>
              </Box>
            ))}
      </Box>
    </OpsLayoutContent>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { Avatar, Box, Button, Card, CardContent, Chip, Grid, Skeleton, Stack, TextField, Typography } from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import InfoRow from "@components/InfoRow";
import logout from "@helpers/Auth/logout";
import useProfileInfo from "@hooks/useProfileInfo";

interface IAccount {
  userName?: string;
  email?: string | null;
  name?: string | null;
  surname?: string | null;
  roles?: { id: number; name: string }[];
}

const PASSWORD_RULES = [/.{6,}/, /[A-Z]/, /[a-z]/, /\d/, /[!@#$%^&*(),.?":{}|<>]/];

/** Oturumdaki kullanıcının bilgileri + parola değişikliği (başarılıysa yeniden giriş istenir). */
export default function Profile() {
  const t = useTranslations();
  const { enqueueSnackbar } = useSnackbar();
  // Kullanıcı kimliği oturumdan (localStorage) okunur; uç `userId` ister.
  const { profileInfo, loading } = useProfileInfo();
  const account = (profileInfo as IAccount | undefined) ?? null;
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", repeat: "" });
  const [saving, setSaving] = useState(false);

  const strong = PASSWORD_RULES.every((rule) => rule.test(form.newPassword));
  const matches = form.newPassword === form.repeat;
  const valid = !!form.oldPassword && strong && matches;

  const submit = () => {
    setSaving(true);
    axiosInstance
      .put(ApiRoutes.PasswordChange, { userName: account?.userName, oldPassword: form.oldPassword, newPassword: form.newPassword })
      .then((res) => {
        if (!res?.data?.isSuccess) return;
        enqueueSnackbar(t("Profile.PasswordChanged"), { variant: "success", autoHideDuration: 4000 });
        setTimeout(() => logout(false), 1500);
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  if (loading || !account) return <Skeleton variant="rounded" height={260} />;

  const fullName = [account.name, account.surname].filter(Boolean).join(" ");

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main" }}>
                {(account.name?.[0] ?? account.userName?.[0] ?? "?").toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">{fullName || account.userName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  @{account.userName}
                </Typography>
              </Box>
            </Stack>
            <InfoRow label={t("Form.Email")} value={account.email || "-"} />
            <InfoRow label={t("Form.Roles")} value={<Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap">{(account.roles ?? []).map((role) => <Chip key={role.id} size="small" label={role.name} />)}</Stack>} />
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 7 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t("Profile.ChangePassword")}
            </Typography>
            <Stack spacing={2}>
              <TextField type="password" label={t("Form.OldPassword")} value={form.oldPassword} onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} autoComplete="current-password" />
              <TextField
                type="password"
                label={t("Form.NewPassword")}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                autoComplete="new-password"
                error={!!form.newPassword && !strong}
                helperText={t("Profile.PasswordRules")}
              />
              <TextField
                type="password"
                label={t("Profile.RepeatPassword")}
                value={form.repeat}
                onChange={(e) => setForm({ ...form, repeat: e.target.value })}
                autoComplete="new-password"
                error={!!form.repeat && !matches}
                helperText={form.repeat && !matches ? t("Profile.PasswordMismatch") : " "}
              />
              <Box>
                <Button variant="contained" startIcon={<LockResetIcon />} disabled={!valid || saving} onClick={submit} data-cy="profile-change-password">
                  {t("Profile.ChangePassword")}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

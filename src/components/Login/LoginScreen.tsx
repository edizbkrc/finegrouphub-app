"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useSnackbar } from "notistack";
import { alpha, keyframes, useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import login from "@helpers/Auth/login";
import logout from "@helpers/Auth/logout";
import { localStorageService } from "@helpers/Common/localStorageService";
import { LocalStorageKeysEnum } from "@enums/LocalStorageKeysEnum";
import { Routes } from "@enums/Routes";
import { useAppDispatch, useAppSelector } from "@redux/hooks";
import { setTheme } from "@redux/appSlice";
import { ThemeOptionsEnum } from "@common/enums/ThemeOptionsEnum";

interface ILoginForm {
  userName: string;
  password: string;
}

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const FEATURES = ["FeatureManage", "FeatureSecure", "FeatureRealtime"] as const;

export default function LoginScreen() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();
  const themeOption = useAppSelector((state) => state.AppReducer.theme);

  const isDark = theme.palette.mode === "dark";
  const primary = theme.palette.primary.main;

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ILoginForm>();

  useEffect(() => {
    localStorageService.setItem(LocalStorageKeysEnum.Language, locale);

    const hasToken = localStorageService.getItem(
      LocalStorageKeysEnum.RefreshToken
    );

    if (hasToken) {
      router.push(`/${locale}${Routes.Default}`);
      return;
    }

    // Yarım kalmış oturum kalıntılarını temizle (API'ye logout gönderme).
    logout(false);
  }, [locale, router]);

  // Oturum zaman aşımıyla buraya düşüldüyse bilgilendir.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("redirectSnackbar") === "true") {
        enqueueSnackbar(t("Toast.LogoutInfo"), {
          variant: "warning",
          autoHideDuration: 5000,
        });
        sessionStorage.removeItem("redirectSnackbar");
      }
    } catch {
      /* yoksay */
    }
  }, [enqueueSnackbar, t]);

  const onSubmit = async (data: ILoginForm) => {
    await logout(false);
    await login({ setLoading, data, enqueueSnackbar, locale, router });
  };

  const onThemeToggle = () =>
    dispatch(
      setTheme(
        themeOption === ThemeOptionsEnum.DARK
          ? ThemeOptionsEnum.LIGHT
          : ThemeOptionsEnum.DARK
      )
    );

  // register()'ın ref'i TextField'ın kök div'ine değil doğrudan <input>'a bağlansın.
  const userNameField = register("userName", { required: t("Form.Required") });
  const passwordField = register("password", { required: t("Form.Required") });

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.1fr) minmax(0, 1fr)" },
        bgcolor: "background.default",
      }}
    >
      {/* ── Marka paneli (yalnızca geniş ekran) ─────────────────────────── */}
      <Box
        aria-hidden
        sx={{
          display: { xs: "none", lg: "flex" },
          position: "relative",
          overflow: "hidden",
          flexDirection: "column",
          justifyContent: "space-between",
          p: 8,
          color: "text.primary",
          bgcolor: "background.default",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: primary,
          }}
        />

        <Box sx={{ position: "relative" }}>
          <Box
            component="img"
            src="/logo-big.svg"
            alt=""
            sx={{ width: 170, height: "auto" }}
          />
        </Box>

        <Box sx={{ position: "relative", maxWidth: 520 }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" }}
          >
            {t("Login.BrandTitle")}
          </Typography>
          <Typography sx={{ mt: 2, fontSize: 18, color: "text.secondary" }}>
            {t("Login.BrandDescription")}
          </Typography>

          <Box
            component="ul"
            sx={{ listStyle: "none", p: 0, m: 0, mt: 5, display: "grid", gap: 2 }}
          >
            {FEATURES.map((feature) => (
              <Box
                key={feature}
                component="li"
                sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
              >
                <CheckCircleOutlineIcon sx={{ color: primary }} />
                <Typography>
                  {t(`Login.${feature}`)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography
          variant="caption"
          sx={{ position: "relative", color: "text.secondary" }}
        >
          © {new Date().getFullYear()} {t("Meta.Title")}
        </Typography>
      </Box>

      {/* ── Form alanı ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 6,
          // Dar ekranda marka paneli olmadığı için hafif bir vurgu zemini.
          background: {
            xs: `linear-gradient(180deg, ${alpha(primary, isDark ? 0.16 : 0.08)}, transparent 28%)`,
            lg: "background.paper",
          },
        }}
      >
        <IconButton
          onClick={onThemeToggle}
          color="inherit"
          aria-label={t("Toast.ChangedTheme", {
            theme: isDark ? ThemeOptionsEnum.LIGHT : ThemeOptionsEnum.DARK,
          })}
          sx={{ position: "absolute", top: 16, right: 16 }}
        >
          {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>

        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          data-cy="login-form"
          sx={{
            width: "100%",
            maxWidth: 420,
            p: { xs: 3, sm: 5 },
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: isDark
              ? "0 24px 60px rgba(0,0,0,0.45)"
              : "0 26px 60px -32px rgba(15, 23, 42, 0.18)",
            animation: `${riseIn} 0.5s ease-out both`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          {/* Geniş ekranda logo marka panelinde; dar ekranda kartın üstünde. */}
          <Box
            component="img"
            src={isDark ? "/logo-big-white.svg" : "/logo-big.svg"}
            alt=""
            sx={{
              display: { xs: "block", lg: "none" },
              width: 130,
              height: "auto",
              mx: "auto",
              mb: 3,
            }}
          />

          <Typography variant="h4" sx={{ fontWeight: 700, textAlign: { xs: "center", lg: "left" } }}>
            {t("Login.Welcome")}
          </Typography>
          <Typography
            sx={{
              mt: 1,
              mb: 4,
              color: "text.secondary",
              textAlign: { xs: "center", lg: "left" },
            }}
          >
            {t("Login.Subtitle")}
          </Typography>

          <TextField
            variant="outlined"
            fullWidth
            label={t("Form.Username")}
            placeholder={t("Form.Username")}
            error={!!errors.userName}
            helperText={errors.userName?.message}
            data-cy="login-username"
            name={userNameField.name}
            onChange={userNameField.onChange}
            onBlur={userNameField.onBlur}
            inputRef={userNameField.ref}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { autoComplete: "username" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
            sx={fieldSx}
          />

          <TextField
            variant="outlined"
            fullWidth
            type={showPassword ? "text" : "password"}
            label={t("Form.Password")}
            placeholder={t("Form.Password")}
            error={!!errors.password}
            helperText={errors.password?.message}
            data-cy="login-password"
            name={passwordField.name}
            onChange={passwordField.onChange}
            onBlur={passwordField.onBlur}
            inputRef={passwordField.ref}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { autoComplete: "current-password" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t("Form.Password")}
                      onClick={() => setShowPassword((show) => !show)}
                      onMouseDown={(event) => event.preventDefault()}
                      edge="end"
                    >
                      {showPassword ? (
                        <VisibilityOff color="primary" />
                      ) : (
                        <Visibility color="primary" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ ...fieldSx, mt: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disableElevation
            loading={loading}
            loadingIndicator={<CircularProgress color="inherit" size={24} />}
            endIcon={<LoginIcon />}
            data-cy="login-submit"
            sx={{
              mt: 4,
              py: 1.5,
              borderRadius: 3,
              color: "white",
              fontWeight: 700,
              background: primary,
              boxShadow: "none",
              "&:hover": {
                background: "primary.dark",
              },
              "&:active": { transform: "translateY(0)" },
            }}
          >
            {t("Button.Login")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

const fieldSx = {
  "& .MuiOutlinedInput-root": { borderRadius: 3 },
} as const;

import { createTheme, alpha, type PaletteColorOptions } from "@mui/material/styles";

/* ------------------------------------------------------------------ *
 * FineGroupHub — sade açık panel
 *
 * Zemin nötr gri, metin slate. Turuncu (#F26522) yalnız vurgu:
 * primary buton, aktif menü/kart, odak halkası. Her yere yayılmaz.
 * Özel palette slot adları korunur.
 * ------------------------------------------------------------------ */

const stone = {
  25: "#FAFBFC",
  50: "#F7F8FA",
  100: "#EEF0F3",
  200: "#E4E7EC",
  300: "#D0D5DD",
  400: "#98A2B3",
  500: "#667085",
  600: "#475467",
  700: "#344054",
  800: "#1D2939",
  900: "#101828",
  950: "#0C111D",
} as const;

/** Turuncu — yalnızca detay vurgusu. */
const brand = {
  50: "#FFF6F1",
  100: "#FFE8DC",
  200: "#FFCDB3",
  300: "#FFA87A",
  400: "#FF8547",
  500: "#F26522",
  600: "#D9551A",
  700: "#B84312",
  800: "#8C3310",
  900: "#6A270E",
} as const;

const ink = {
  300: "#98A2B3",
  400: "#667085",
  500: "#344054",
  600: "#1D2939",
  700: "#101828",
  800: "#0C111D",
} as const;

const RADIUS = 10;
const SHADOW = "16, 24, 40";

const flat = (color: string, contrastText = "#2C2C2C"): PaletteColorOptions => ({
  main: color,
  light: color,
  dark: color,
  contrastText,
});

const sharedPalette = {
  primary: {
    main: brand[500],
    light: brand[400],
    dark: brand[700],
    contrastText: "#fff",
  },
  success: { main: "#12B76A", light: "#32D583", dark: "#027A48", contrastText: "#fff" },
  warning: { main: "#F79009", light: "#FDB022", dark: "#B54708", contrastText: "#fff" },
  error: { main: "#F04438", light: "#F97066", dark: "#B42318", contrastText: "#fff" },
  info: { main: ink[400], light: ink[300], dark: ink[600], contrastText: "#fff" },
  tertiary: {
    main: stone[500],
    light: stone[400],
    dark: stone[600],
    contrastText: "#fff",
  },
} as const;

const lightPalette = {
  mode: "light" as const,
  ...sharedPalette,
  secondary: { main: ink[600], light: ink[500], dark: ink[800], contrastText: "#fff" },
  divider: stone[200],
  text: {
    primary: stone[800],
    secondary: stone[500],
    disabled: stone[400],
  },
  background: {
    default: stone[50],
    paper: "#FFFFFF",
  },
  action: {
    hover: alpha(stone[800], 0.04),
    selected: alpha(brand[500], 0.08),
    disabledBackground: stone[100],
  },
  borderDefault: flat(stone[300], stone[300]),
  borderFocused: flat(brand[500], brand[500]),
  borderHoverd: flat(stone[400], stone[400]),
  label: { main: stone[25], light: "#fff", dark: stone[100], contrastText: stone[900] },
  contentBackground: flat(stone[50], stone[50]),
  tableHeaderButton: flat(stone[600]),
  tableHeaderBg: flat(stone[100], stone[100]),
  borderdashed: flat(stone[200], stone[200]),
  card: flat("#FFFFFF", "#FFFFFF"),
  card2: flat(stone[50], stone[50]),
  itemBackground: flat(stone[100], stone[700]),
  itemBackgroundHover: flat(stone[200], stone[800]),
  navIcon: flat(stone[500], stone[500]),
};

const darkPalette = {
  mode: "dark" as const,
  ...sharedPalette,
  secondary: { main: stone[300], light: stone[200], dark: stone[400], contrastText: stone[900] },
  divider: "#2A3341",
  text: {
    primary: "#F5F6F8",
    secondary: "#98A2B3",
    disabled: "#667085",
  },
  background: {
    default: "#12151A",
    paper: "#1A1F27",
  },
  action: {
    hover: alpha("#FFFFFF", 0.06),
    selected: alpha(brand[500], 0.16),
    disabledBackground: "#2A3341",
  },
  borderDefault: flat("#2A3341", "#2A3341"),
  borderFocused: flat(brand[400], brand[400]),
  borderHoverd: flat("#3A4454", "#3A4454"),
  label: { main: "#F5F6F8", light: "#fff", dark: stone[300], contrastText: stone[900] },
  contentBackground: flat("#12151A", "#12151A"),
  tableHeaderButton: flat("#98A2B3", "#98A2B3"),
  tableHeaderBg: flat("#1A1F27", "#1A1F27"),
  borderdashed: flat("#2A3341", "#2A3341"),
  card: flat("#1A1F27", "#1A1F27"),
  card2: flat("#2A3341", "#2A3341"),
  itemBackground: flat("#2A3341", stone[200]),
  itemBackgroundHover: flat("#3A4454", stone[100]),
  navIcon: flat("#98A2B3", "#98A2B3"),
};

export const getDefaultTheme = (mode: "dark" | "light") => {
  const isLight = mode === "light";
  const p = isLight ? lightPalette : darkPalette;
  const line = isLight ? stone[200] : "#2A3341";
  const surface = isLight ? "#FFFFFF" : "#1A1F27";
  const canvas = isLight ? stone[50] : "#12151A";

  return createTheme({
    palette: isLight ? lightPalette : darkPalette,
    shape: { borderRadius: RADIUS },
    typography: {
      fontFamily: "var(--font-app), system-ui, -apple-system, Segoe UI, sans-serif",
      h1: { fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, color: isLight ? stone[800] : "#F5F6F8" },
      h2: { fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 },
      h3: { fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.3 },
      h4: { fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.01em" },
      h5: { fontSize: "1rem", fontWeight: 600 },
      h6: { fontSize: "0.9375rem", fontWeight: 600 },
      subtitle1: { fontSize: "0.9375rem", fontWeight: 600 },
      subtitle2: { fontSize: "0.8125rem", fontWeight: 600, color: p.text.secondary },
      body1: { fontSize: "0.9375rem", lineHeight: 1.55 },
      body2: { fontSize: "0.875rem", lineHeight: 1.5 },
      caption: { fontSize: "0.75rem", lineHeight: 1.45 },
      button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "*::-webkit-scrollbar": { width: 8, height: 8 },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: isLight ? stone[300] : "#3A4454",
            borderRadius: 8,
            border: `2px solid ${canvas}`,
          },
          "*::-webkit-scrollbar-thumb:hover": { backgroundColor: isLight ? stone[400] : brand[400] },
          "*::-webkit-scrollbar-track": { backgroundColor: "transparent" },
          body: { backgroundColor: p.background.default },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            borderRadius: `${RADIUS}px !important`,
            backgroundColor: surface,
            fontSize: "0.9375rem",
          },
          input: { "&::placeholder": { color: p.text.disabled, opacity: 1 } },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-notchedOutline": { borderColor: line },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: isLight ? stone[400] : "#3A4454" },
            "&.Mui-focused": { boxShadow: `0 0 0 3px ${alpha(brand[500], isLight ? 0.14 : 0.22)}` },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: brand[500], borderWidth: 1 },
          },
        },
      },
      MuiInputLabel: { styleOverrides: { root: { fontSize: "0.9375rem" } } },
      MuiDrawer: {
        styleOverrides: {
          root: { zIndex: 1300 },
          paper: { backgroundColor: surface, borderRight: `1px solid ${line}`, backgroundImage: "none" },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            zIndex: 1000,
            borderRadius: 0,
            border: "none !important",
            borderBottom: `1px solid ${line} !important`,
            backgroundColor: surface,
            backgroundImage: "none",
            boxShadow: "none",
            color: p.text.primary,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: RADIUS, backgroundImage: "none", "--Paper-overlay": "none !important" },
          outlined: { borderColor: line },
          elevation1: {
            boxShadow: isLight ? `0 1px 2px rgba(${SHADOW},.06)` : "0 1px 2px rgba(0,0,0,.4)",
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: `1px solid ${line}`,
            backgroundColor: surface,
            boxShadow: "none",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: RADIUS,
            paddingInline: 16,
            minHeight: 40,
          },
          sizeSmall: { minHeight: 32, paddingInline: 12, fontSize: "0.8125rem" },
          sizeLarge: { minHeight: 46, paddingInline: 22 },
          containedPrimary: {
            "&:hover": { backgroundColor: brand[600] },
          },
          outlined: {
            borderColor: line,
            "&:hover": { borderColor: isLight ? stone[400] : "#3A4454", backgroundColor: p.action.hover },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 600, fontSize: "0.75rem", height: 26 },
          outlined: { borderColor: line },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderStyle: "solid", borderColor: line, borderImage: "none" } },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            backgroundColor: surface,
            border: `1px solid ${line}`,
            boxShadow: isLight ? `0 12px 24px rgba(${SHADOW},.1)` : "0 8px 24px rgba(0,0,0,.5)",
          },
          option: {
            borderRadius: 6,
            margin: "2px 6px",
            '&[aria-selected="true"]': { backgroundColor: p.action.selected },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `1px solid ${line}`,
            boxShadow: isLight ? `0 12px 24px rgba(${SHADOW},.1)` : "0 8px 24px rgba(0,0,0,.5)",
          },
          list: { padding: 6 },
        },
      },
      MuiMenuItem: {
        styleOverrides: { root: { borderRadius: 6, minHeight: 36, fontSize: "0.875rem" } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: line, fontSize: "0.875rem" },
          head: {
            fontWeight: 600,
            fontSize: "0.75rem",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            color: p.text.secondary,
            whiteSpace: "nowrap",
            backgroundColor: isLight ? stone[25] : "#1A1F27",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: { root: { "&:hover": { backgroundColor: p.action.hover } } },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isLight ? stone[800] : stone[100],
            color: isLight ? stone[25] : stone[900],
            fontSize: "0.75rem",
            borderRadius: 6,
            padding: "6px 10px",
          },
          arrow: { color: isLight ? stone[800] : stone[100] },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${line}`,
            boxShadow: isLight ? `0 20px 40px rgba(${SHADOW},.16)` : "none",
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 600, minHeight: 44, fontSize: "0.875rem" },
        },
      },
      MuiTabs: {
        styleOverrides: { indicator: { height: 2, borderRadius: 2 } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: RADIUS, border: `1px solid ${line}` } },
      },
      MuiLinearProgress: { styleOverrides: { root: { borderRadius: 999, height: 4 } } },
    },
  });
};

declare module "@mui/material/styles" {
  interface Palette {
    tertiary: Palette["primary"];
    tableHeaderButton: Palette["primary"];
    tableHeaderBg: Palette["primary"];
    borderdashed: Palette["primary"];
    card: Palette["primary"];
    card2: Palette["primary"];
    itemBackground: Palette["primary"];
    itemBackgroundHover: Palette["primary"];
    borderDefault: Palette["primary"];
    borderFocused: Palette["primary"];
    borderHoverd: Palette["primary"];
    contentBackground: Palette["primary"];
    label: Palette["primary"];
    navIcon: Palette["primary"];
  }

  interface PaletteOptions {
    tertiary?: PaletteOptions["primary"];
    tableHeaderButton?: PaletteOptions["primary"];
    tableHeaderBg?: PaletteOptions["primary"];
    borderdashed?: PaletteOptions["primary"];
    card?: PaletteOptions["primary"];
    card2?: PaletteOptions["primary"];
    itemBackground?: PaletteOptions["primary"];
    itemBackgroundHover?: PaletteOptions["primary"];
    borderDefault?: PaletteOptions["primary"];
    borderFocused?: PaletteOptions["primary"];
    borderHoverd?: PaletteOptions["primary"];
    contentBackground?: PaletteOptions["primary"];
    label?: PaletteOptions["primary"];
    navIcon?: PaletteOptions["primary"];
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    tertiary: true;
  }
}
declare module "@mui/material/IconButton" {
  interface IconButtonPropsColorOverrides {
    tertiary: true;
  }
}
declare module "@mui/material/Chip" {
  interface ChipPropsColorOverrides {
    tertiary: true;
  }
}

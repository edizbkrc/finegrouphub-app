"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Box, Breadcrumbs, Link, Typography } from "@mui/material";
import { Apartment, NavigateNext } from "@mui/icons-material";

export interface IBreadcrumbItem {
  label: string;
  href?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export default function OpsBreadcrumb({
  customBreadcrumbs,
}: {
  customBreadcrumbs?: IBreadcrumbItem[];
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();

  /**
   * URL segmentini okunabilir etikete çevirir.
   *
   * ⚠️ Referansta `t(key, { defaultValue })` kullanılıyordu — bu i18next API'si.
   * next-intl'de `defaultValue` diye bir seçenek YOK ve eksik anahtarda `t`
   * hata fırlatır, yani çevirisi olmayan her segment breadcrumb'ı patlatırdı.
   * Doğrusu `t.has()` ile önce varlığını kontrol etmek.
   */
  const formatSegment = (segment: string): string => {
    if (UUID_PATTERN.test(segment) || /^\d+$/.test(segment)) {
      return `#${segment.slice(0, 8)}`;
    }

    const key = `Breadcrumb.${capitalize(segment)}`;
    return t.has(key as never) ? t(key as never) : capitalize(segment.replace(/-/g, " "));
  };

  const items: IBreadcrumbItem[] =
    customBreadcrumbs && customBreadcrumbs.length > 0
      ? customBreadcrumbs
      : pathname
          .split("/")
          .filter((segment) => segment && segment !== locale)
          .map((segment, index, segments) => ({
            label: formatSegment(segment),
            href:
              index === segments.length - 1
                ? undefined
                : `/${locale}/${segments.slice(0, index + 1).join("/")}`,
          }));

  if (items.length === 0) return null;

  const isCustom = !!customBreadcrumbs?.length;

  return (
    <Box sx={isCustom ? { mt: 2 } : { mb: 2, mt: 1 }}>
      <Breadcrumbs
        separator={<NavigateNext fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ "& .MuiBreadcrumbs-separator": { mx: 0.5 } }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          if (isLast || !item.href) {
            return (
              <Typography
                key={`${item.label}-${index}`}
                sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
              >
                {item.label}
              </Typography>
            );
          }

          return (
            <Link
              key={`${item.label}-${index}`}
              component={NextLink}
              href={item.href}
              underline="hover"
              sx={{
                display: "flex",
                alignItems: "center",
                color: "text.secondary",
                fontSize: "0.875rem",
                "&:hover": { color: "primary.main" },
              }}
            >
              {isCustom && index === 0 && (
                <Apartment sx={{ mr: 0.5, fontSize: "1.1rem" }} />
              )}
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}

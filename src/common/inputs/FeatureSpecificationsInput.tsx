import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { Box, Checkbox, FormControlLabel, Skeleton, Stack, Switch, TextField, Typography } from "@mui/material";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import type { ICommonInputProps } from "../types/ICommonInputProps";

/** FeatureType: Count = 1 (adet), Existence = 2 (var/yok). */
const FEATURE_COUNT = 1;

interface IFeature {
  id: number;
  programmaticAlias: string;
  name: string;
  type: number;
  minCountLimit?: number | null;
  maxCountLimit?: number | null;
  displayOrder?: number;
}

export interface IFeatureSelection {
  featureAlias: string;
  value: number | boolean;
}

export interface IGroupSpecification {
  mandatory: boolean;
  displayOrder: number;
  featureSpecification: IFeatureSelection;
}

type Mode = "selection" | "group";

const defaultValueFor = (feature: IFeature) => (feature.type === FEATURE_COUNT ? Math.max(feature.minCountLimit ?? 0, 0) : false);

/**
 * Fine özelliklerinin tamamı için değer girişi.
 *  - `selection` (teklif): `{ featureAlias, value }[]` — API tüm özelliklerin gönderilmesini şart koşar.
 *  - `group` (özellik grubu): `{ mandatory, displayOrder, featureSpecification }[]`.
 * Hangi modun kullanılacağı `formItem.triggerValue === "group"` ile seçilir.
 */
export default function FeatureSpecificationsInput({ formItem, control, defaultValue, t }: ICommonInputProps) {
  const mode: Mode = formItem.triggerValue === "group" ? "group" : "selection";
  const [features, setFeatures] = useState<IFeature[] | null>(null);

  useEffect(() => {
    axiosInstance
      .patch(ApiRoutes.Features, { pageNumber: 1, rowCount: 500 }, { withoutToast: true })
      .then((res) => {
        const list = (res?.data?.data as IFeature[] | undefined) ?? [];
        setFeatures([...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
      })
      .catch(() => setFeatures([]));
  }, []);

  if (!features) return <Skeleton variant="rounded" height={160} />;

  // Gelen varsayılanı alias → değer sözlüğüne çevir (iki şekli de kabul eder).
  const initial = new Map<string, { value: number | boolean; mandatory: boolean; displayOrder: number }>();
  ((defaultValue as Array<IFeatureSelection | IGroupSpecification> | undefined) ?? []).forEach((item) => {
    const spec = "featureSpecification" in item ? item.featureSpecification : item;
    if (!spec?.featureAlias) return;
    initial.set(spec.featureAlias, {
      value: spec.value,
      mandatory: "mandatory" in item ? !!item.mandatory : false,
      displayOrder: "displayOrder" in item ? Number(item.displayOrder) : 0,
    });
  });

  const build = (values: Map<string, { value: number | boolean; mandatory: boolean; displayOrder: number }>) =>
    features.map((feature) => {
      const current = values.get(feature.programmaticAlias) ?? {
        value: defaultValueFor(feature),
        mandatory: false,
        displayOrder: feature.displayOrder ?? 0,
      };
      const selection: IFeatureSelection = { featureAlias: feature.programmaticAlias, value: current.value };
      return mode === "group"
        ? { mandatory: current.mandatory, displayOrder: current.displayOrder, featureSpecification: selection }
        : selection;
    });

  return (
    <Controller
      name={formItem.name}
      control={control}
      defaultValue={build(initial)}
      rules={formItem.registerOptions}
      render={({ field }) => {
        const current = new Map<string, { value: number | boolean; mandatory: boolean; displayOrder: number }>();
        ((field.value as Array<IFeatureSelection | IGroupSpecification>) ?? []).forEach((item) => {
          const spec = "featureSpecification" in item ? item.featureSpecification : item;
          current.set(spec.featureAlias, {
            value: spec.value,
            mandatory: "mandatory" in item ? item.mandatory : false,
            displayOrder: "displayOrder" in item ? item.displayOrder : 0,
          });
        });

        const change = (alias: string, patch: Partial<{ value: number | boolean; mandatory: boolean }>) => {
          const prev = current.get(alias);
          if (!prev) return;
          current.set(alias, { ...prev, ...patch });
          field.onChange(build(current));
        };

        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t(formItem.label)}
            </Typography>
            <Stack spacing={1} data-cy="feature-specifications">
              {features.map((feature) => {
                const item = current.get(feature.programmaticAlias);
                const isCount = feature.type === FEATURE_COUNT;
                return (
                  <Stack
                    key={feature.programmaticAlias}
                    direction={["column", "row"]}
                    spacing={1}
                    alignItems={["stretch", "center"]}
                    justifyContent="space-between"
                    sx={{ py: 0.5, borderBottom: 1, borderColor: "divider" }}
                  >
                    <Typography sx={{ flex: 1 }}>{feature.name}</Typography>
                    {isCount ? (
                      <TextField
                        size="small"
                        type="number"
                        sx={{ width: 140 }}
                        value={Number(item?.value ?? 0)}
                        inputProps={{ min: feature.minCountLimit ?? 0, max: feature.maxCountLimit ?? undefined }}
                        onChange={(event) => change(feature.programmaticAlias, { value: event.target.value === "" ? 0 : Number(event.target.value) })}
                      />
                    ) : (
                      <Switch checked={!!item?.value} onChange={(event) => change(feature.programmaticAlias, { value: event.target.checked })} />
                    )}
                    {mode === "group" && (
                      <FormControlLabel
                        control={<Checkbox checked={!!item?.mandatory} onChange={(event) => change(feature.programmaticAlias, { mandatory: event.target.checked })} />}
                        label={t("Mandatory")}
                      />
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        );
      }}
    />
  );
}

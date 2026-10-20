"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Box, Slider, Stack, TextField, Typography } from "@mui/material";
import {
  parseBound,
  rangeFromSlider,
  sliderValue,
  type RangeBounds,
  type RangeValue,
} from "./unitSearchFilters";

interface BoundInputProps {
  label: string;
  value: number | null;
  placeholder: string;
  onCommit: (value: number | null) => void;
  dataCy: string;
  locale: string;
}

/**
 * Sayı alanı kendi metnini tutar: "1," ya da "-" gibi yarım girdiler sayıya çevrilemez ve
 * doğrudan filtreye bağlansa kullanıcının yazdığı silinirdi. Metin yalnız dışarıdan (slider,
 * "Filtreleri temizle") gelen değişimde, yani metnin karşılığı değerden farklıysa yenilenir.
 */
function BoundInput({ label, value, placeholder, onCommit, dataCy, locale }: BoundInputProps) {
  const [draft, setDraft] = useState(value == null ? "" : String(value));

  useEffect(() => {
    setDraft((previous) => (parseBound(previous, locale) === value ? previous : value == null ? "" : String(value)));
  }, [value, locale]);

  return (
    <TextField
      size="small"
      label={label}
      value={draft}
      placeholder={placeholder}
      onChange={(event) => {
        setDraft(event.target.value);
        const parsed = parseBound(event.target.value, locale);
        if (parsed !== undefined) onCommit(parsed);
      }}
      slotProps={{ htmlInput: { inputMode: "decimal", "data-cy": dataCy } }}
      sx={{ flex: 1, minWidth: 0 }}
    />
  );
}

interface UnitSearchRangeFilterProps {
  label: string;
  bounds: RangeBounds;
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  /** Filtre açıkken değeri olmadığı için elenen daire sayısı; 0 ise not gösterilmez. */
  missingCount: number;
  dataCy: string;
}

/**
 * Fine3D'nin filtre çekmecesindeki aralık slider'ının panel karşılığı. Slider'ın yanına iki sayı
 * alanı eklendi: fiyat gibi geniş aralıklarda slider'la tam değere inmek zor.
 */
export default function UnitSearchRangeFilter({ label, bounds, value, onChange, missingCount, dataCy }: UnitSearchRangeFilterProps) {
  const t = useTranslations();
  const locale = useLocale();
  const format = (number: number) => number.toLocaleString(locale, { maximumFractionDigits: 2 });
  // Tek bir değer varsa (ör. yalnız bir dairenin fiyatı girili) slider anlamsız; sayı alanları kalır.
  const hasSpan = bounds.max > bounds.min;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
        {label}
      </Typography>
      {hasSpan && (
        <Box sx={{ px: 1.25 }}>
          <Slider
            size="small"
            value={sliderValue(value, bounds)}
            min={bounds.min}
            max={bounds.max}
            step={bounds.step}
            disableSwap
            valueLabelDisplay="auto"
            valueLabelFormat={format}
            onChange={(_, next) => onChange(rangeFromSlider(next as [number, number], bounds))}
            marks={[
              { value: bounds.min, label: format(bounds.min) },
              { value: bounds.max, label: format(bounds.max) },
            ]}
            getAriaLabel={(index) => `${label} ${index === 0 ? t("Form.MinRange") : t("Form.MaxRange")}`}
            data-cy={`${dataCy}-slider`}
          />
        </Box>
      )}
      <Stack direction="row" spacing={1} sx={{ mt: hasSpan ? 0.5 : 0 }}>
        <BoundInput
          label={t("Form.MinRange")}
          value={value.min}
          placeholder={format(bounds.min)}
          onCommit={(min) => onChange({ ...value, min })}
          dataCy={`${dataCy}-min`}
          locale={locale}
        />
        <BoundInput
          label={t("Form.MaxRange")}
          value={value.max}
          placeholder={format(bounds.max)}
          onCommit={(max) => onChange({ ...value, max })}
          dataCy={`${dataCy}-max`}
          locale={locale}
        />
      </Stack>
      {missingCount > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {t("UnitSearch.MissingValueHint", { count: missingCount })}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Gün sayısını "2 yıl 3 ay 5 gün" biçiminde okunabilir metne çevirir.
 *
 * ⚠️ Referansta birimler sabit Türkçe metindi ("yıl", "ay", "gün") — İngilizce
 * arayüzde de Türkçe görünüyordu ve kodlama kuralı #8'i (hardcoded string yasak)
 * ihlal ediyordu. Artık `Intl.NumberFormat` ile locale'e göre biçimlenir;
 * çeviri dosyasına anahtar eklemeye gerek kalmaz.
 */
export const humanizeDays = (days: number, locale = "tr"): string => {
  const format = (value: number, unit: "year" | "month" | "day") =>
    new Intl.NumberFormat(locale, {
      style: "unit",
      unit,
      unitDisplay: "long",
    }).format(value);

  if (!days || days <= 0) return format(0, "day");

  const years = Math.floor(days / 365);
  const afterYears = days % 365;
  const months = Math.floor(afterYears / 30);
  const remainingDays = afterYears % 30;

  const parts: string[] = [];

  if (years > 0) parts.push(format(years, "year"));
  if (months > 0) parts.push(format(months, "month"));
  if (remainingDays > 0) parts.push(format(remainingDays, "day"));

  return parts.join(" ");
};

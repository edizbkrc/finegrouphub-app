import { getCurrencyFormat } from "@helpers/Common/getCurrencyFormat";
import { humanizeDays } from "./humanizeDays";

const formatFunctions: Record<string, (val: any) => string> = {
  humanizeDays: (val: number) => humanizeDays(Number(val)),
};

export const genericFormatString = (data: any, format: string) => {
  if (!format) return "";

  const hasCurrency = format.includes("{~currencySymbol}");
  let cleanedFormat = format.replace(/\{~currencySymbol\}/g, "");

  const functionRegex = /\{(\w+)\}\((\w+)\)/g;
  cleanedFormat = cleanedFormat.replace(functionRegex, (_, field, fnName) => {
    const value = data[field];
    const formatter = formatFunctions[fnName];
    return formatter ? formatter(value) : value;
  });

  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    cleanedFormat = cleanedFormat.replace(regex, data[key]);
  });

  return hasCurrency ? getCurrencyFormat(Number(cleanedFormat)) : cleanedFormat;
};

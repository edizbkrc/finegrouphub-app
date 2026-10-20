import type { UseFormRegister, UseFormSetValue } from "react-hook-form";
import type { IFormItem } from "./IFormItem";

/**
 * 22 input componentinin ortağı sözleşme. Hepsi bu props şeklini alır,
 * `Controller`/`register` ile react-hook-form'a bağlanır.
 */
export interface ICommonInputProps {
  formItem: IFormItem;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  control?: any;
  apiData?: any;
  t: (key: string, value?: any) => string;
  error?: boolean;
  errorMessage?: string;
  defaultValue?: any;
  isEdit?: boolean;
  variant?: "standard" | "outlined" | "filled";
}

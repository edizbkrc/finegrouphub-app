import type { Breakpoint, GridSize } from "@mui/material";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "./IFormItem";
import type { IReactHookFormProps } from "./IReactHookFormProps";

type ResponsiveStyleValue<T> = T | Array<T | null> | { [key in Breakpoint]?: T | null };

/** Tam sayfa formun bir "kart"ı — grup başlığı + IFormItem[] veya iç içe multiSchema. */
export interface IOpsPageFormItem {
  name?: string;
  icon?: React.ReactNode;
  gridSize?: ResponsiveStyleValue<GridSize>;
  schema?: IFormItem[];
  multiSchema?: IOpsPageFormItem[];
  renderComponent?: (apiData?: any, formState?: IReactHookFormProps) => React.JSX.Element;
  renderComponentVisiblitity?: FormItemVisibilityEnum;
  /** "flat": gölgesiz, çerçeveli kart. Proje sayfası gibi özel düzenler için. */
  surface?: "flat";
}

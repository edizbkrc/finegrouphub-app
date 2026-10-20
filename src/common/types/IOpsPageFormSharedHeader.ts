import type { Routes } from "@enums/Routes";
import type { IBreadcrumbItem } from "@components/OpsBreadcrumb";

export interface IOpsPageFormSharedHeader {
  goBackRouteName?: Routes | string;
  title?: string;
  editTitle?: string;
  handleDelete?: () => void;
  submitButtonVisible?: boolean;
  deleteButtonVisible?: boolean;
  renderAdditionalHeader?: () => React.ReactNode;
  renderRightComponent?: () => React.ReactNode;
  showInfoButton?: boolean;
  addButonHref?: string;
  renderLeftSide?: () => React.ReactNode;
  breadcrumbs?: IBreadcrumbItem[];
  showBreadcrumb?: boolean;
}

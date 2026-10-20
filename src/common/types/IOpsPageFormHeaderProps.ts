import type { Routes } from "@enums/Routes";
import type { IBreadcrumbItem } from "@components/OpsBreadcrumb";

export interface IOpsPageFormHeaderProps {
  handleDelete?: () => void;
  isEdit?: boolean;
  title?: string;
  editTitle?: string;
  submitButtonVisible?: boolean;
  deleteButtonVisible?: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  auditInfo: any;
  renderAdditionalHeader?: () => React.ReactNode;
  renderRightComponent?: () => React.ReactNode;
  goBackRouteName?: Routes | string;
  showInfoButton?: boolean;
  addButonHref?: string;
  renderLeftSide?: () => React.ReactNode;
  breadcrumbs?: IBreadcrumbItem[];
  showBreadcrumb?: boolean;
}

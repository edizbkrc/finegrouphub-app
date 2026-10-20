import type { ReactNode } from "react";
import DashboardIcon from "@mui/icons-material/Apps";
import { Routes } from "@enums/Routes";
import RolesIcon from "@/assets/svgs/RolesIcon";
import ActivityLogIcon from "@/assets/svgs/ActivityLogIcon";
import PersonelIcon from "@/assets/svgs/PersonelIcon";
import ProjectIcon from "@/assets/svgs/ProjectIcon";
import CompaniesIcon from "@/assets/svgs/CompaniesIcon";
import TicketIcon from "@/assets/svgs/TicketIcon";
import FeatureIcon from "@/assets/svgs/FeatureIcon";
import OrderIcon from "@/assets/svgs/OrderIcon";
import OfferIcon from "@/assets/svgs/OfferIcon";
import PreAccountingCategoriesIcon from "@/assets/svgs/PreAccountingCategoriesIcon";
import PreAccounting from "@/assets/svgs/PreAccounting";
import NamespaceIcon from "@/assets/svgs/NamespaceIcon";
import ResourceGroupIcon from "@/assets/svgs/ResourceGroupIcon";
import ContentIcon from "@/assets/svgs/ContentIcon";
import ContactFormIcon from "@/assets/svgs/ContactFormIcon";
import BankAccountIcon from "@/assets/svgs/BankAccountIcon";
import LanguageIcon from "@/assets/svgs/LanguageIcon";
import UnitTypeIcon from "@/assets/svgs/UnitTypeIcon";
import SettingsIcon from "@/assets/svgs/SettingsIcon";
import ProjectBriefIcon from "@/assets/svgs/ProjectBriefIcon";

/**
 * Menü ikonları route'a göre eşlenir. Menünün KENDİSİ API'den gelir; burası
 * yalnızca görsel eşleme tablosudur.
 */
export const ICON_LOOKUP: Record<string, ReactNode> = {
  [Routes.Dashboard]: <DashboardIcon />,
  [Routes.Projects]: <ProjectIcon />,
  [Routes.ProjectBriefs]: <ProjectBriefIcon />,
  [Routes.Companies]: <CompaniesIcon />,
  [Routes.Orders]: <OrderIcon />,
  [Routes.Offers]: <OfferIcon />,
  [Routes.Features]: <FeatureIcon />,
  [Routes.FeatureGroups]: <FeatureIcon />,
  [Routes.ExpenseRevenues]: <PreAccounting />,
  [Routes.ExpenseRevenueCategories]: <PreAccountingCategoriesIcon />,
  [Routes.ActivityLogs]: <ActivityLogIcon />,
  [Routes.Roles]: <RolesIcon />,
  [Routes.Users]: <PersonelIcon />,
  [Routes.Tickets]: <TicketIcon />,
  [Routes.Namespaces]: <NamespaceIcon />,
  [Routes.ResourceGroups]: <ResourceGroupIcon />,
  [Routes.Contents]: <ContentIcon />,
  [Routes.ContactForms]: <ContactFormIcon />,
  [Routes.BankAccounts]: <BankAccountIcon />,
  [Routes.Languages]: <LanguageIcon />,
  [Routes.UnitTypes]: <UnitTypeIcon />,
  [Routes.AppSettings]: <SettingsIcon />,
};

const DEFAULT_ICON = <DashboardIcon />;

/**
 * Route için ikon döndürür.
 *
 * ⚠️ Referansta `item.url ? ICON_LOOKUP[item.url] : ICON_LOOKUP.default`
 * yazılıyordu: url DOLU ama tabloda karşılığı yoksa `undefined` dönüyor ve
 * menüde ikonsuz boşluk oluşuyordu. Fallback artık her iki durumda da çalışır.
 */
export const getMenuIcon = (url?: string | null): ReactNode =>
  (url ? ICON_LOOKUP[url] : undefined) ?? DEFAULT_ICON;

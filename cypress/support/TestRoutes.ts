/**
 * `@enums/Routes` ile birebir aynı yollar, `/tr` locale prefix'i ile.
 *
 * ⚠️ Referans projenin cypress testleri eski bir ürünün (restoran/POS) rota
 * isimlerini içeriyordu (Kitchens, Menus, DeskSettings…) — FineGroupHub ile
 * hiçbir ilgisi yoktu (REBUILD_PROMPT §7'nin kendi tespiti). Bu dosya
 * `src/enums/Routes.ts`'ten türetilmiştir.
 */
export enum TestRoutes {
  Login = "/",
  Default = "/tr/dashboard",
  Dashboard = "/tr/dashboard",
  Profile = "/tr/profile",
  Users = "/tr/users",
  User = "/tr/users/user",
  ActivityLogs = "/tr/activity-logs",
  Roles = "/tr/roles",
  AddRole = "/tr/roles/add",
  EditRole = "/tr/roles/edit",
  Projects = "/tr/projects",
  Project = "/tr/projects/project",
  Companies = "/tr/companies",
  Company = "/tr/companies/company",
  Features = "/tr/fine-features",
  FeatureGroups = "/tr/fine-featuregroups",
  FeatureGroup = "/tr/fine-featuregroups/fine-featuregroup",
  Feature = "/tr/features/feature",
  ExpenseRevenues = "/tr/expense-revenues",
  ExpenseRevenueCategories = "/tr/expense-revenue-categories",
  Tickets = "/tr/tickets",
  Ticket = "/tr/tickets/ticket",
  Orders = "/tr/orders",
  Order = "/tr/orders/order",
  Offers = "/tr/offers",
  Offer = "/tr/offers/offer",
  Contents = "/tr/contents",
  Namespaces = "/tr/namespaces",
  ResourceGroups = "/tr/resourcegroups",
  ContactForms = "/tr/contact-forms",
  BankAccounts = "/tr/bank-accounts",
  Languages = "/tr/languages",
  Workspace = "/tr/workspace",
  UnitTypes = "/tr/unit-types",
  SubOrder = "/tr/sub-order",
  AppSettings = "/tr/app-settings",
  VirtualTours = "/tr/virtual-tours",
}

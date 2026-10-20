/**
 * Tüm API uçlarının tek kaynağı.
 *
 * Yollar `docs/API_ADAPTER.md` §5'teki hedef spesifikasyondan gelir (K2 = seçenek (a):
 * Laravel bu sözleşmeye uyar). Kalıp §5.1'de:
 *
 *   PATCH  /v1/{resource}              → liste
 *   GET    /v1/{resource}/{singular}   → detay      (?id=)
 *   POST   /v1/{resource}/{singular}   → oluştur
 *   PUT    /v1/{resource}/{singular}   → güncelle   ({value,isUpdated} zarflı)
 *   DELETE /v1/{resource}/{singular}   → sil        (?id=)
 *
 * Kodlama kuralı: burada tanımlı olmayan hiçbir URL string'i başka bir dosyada
 * yazılmaz.
 */
export enum ApiRoutes {
  // ── Kimlik ve oturum ────────────────────────────────────────────────
  Login = "/v1/Account/login",
  RefreshToken = "/v1/Account/login/refresh",
  Logout = "/v1/Account/logout",
  PasswordChange = "/v1/Account/password/change",
  AccountDetail = "/v1/Account/detail",

  // ── Yetkilendirme / UI ──────────────────────────────────────────────
  MenuItems = "/v1/UI/menuItems",
  UIPages = "/v1/UI/pages",
  UIPage = "/v1/UI/pages/page",
  Permissions = "/v1/permissions",
  Roles = "/v1/Roles",
  RoleDetail = "/v1/Roles/role",

  // ── Ortak altyapı ───────────────────────────────────────────────────
  /** PATCH — gövde: `{ parameters: [{ entityName, requestedPropertyNames, ... }] }` */
  Lookups = "/v1/Lookups",
  /** GET — `?enumName=` */
  LookupsEnum = "/v1/Lookups/enum",
  Export = "/v1/exports/export",
  Languages = "/v1/languages",
  LanguageDetail = "/v1/languages/language",

  // ── Kullanıcılar ────────────────────────────────────────────────────
  Users = "/v1/Users",
  UserDetail = "/v1/Users/user",

  // ── Şirketler (Tenants) ─────────────────────────────────────────────
  Companies = "/v1/tenants",
  CompanyDetail = "/v1/tenants/tenant",
  TenantStatus = "/v1/tenants/tenant/status",

  // ── Projeler ────────────────────────────────────────────────────────
  Projects = "/v1/projects",
  ProjectDetail = "/v1/projects/project",
  ProjectState = "/v1/projects/project/state",

  // ── Etaplar / Bloklar / Katlar ──────────────────────────────────────
  Stages = "/v1/projectstages",
  StageDetail = "/v1/projectstages/projectstage",
  Blocks = "/v1/blocks",
  BlockDetail = "/v1/blocks/block",
  BlockFloors = "/v1/blocks/block/floors/floor",
  FloorTemplates = "/v1/floortemplates",
  FloorTemplateDetail = "/v1/floortemplates/floortemplate",

  // ── Daireler ────────────────────────────────────────────────────────
  Units = "/v1/units",
  UnitDetail = "/v1/units/unit",
  UnitSearch = "/v1/units/search",
  UnitTemplates = "/v1/unittemplates",
  UnitTemplateDetail = "/v1/unittemplates/unittemplate",
  UnitStates = "/v1/unitstates",
  UnitStateDetail = "/v1/unitstates/unitstate",
  UnitTypes = "/v1/unittypes",
  UnitTypeDetail = "/v1/unittypes/unittype",

  // ── Galeri ──────────────────────────────────────────────────────────
  GalleryItems = "/v1/gallery/items",
  GalleryItemDetail = "/v1/gallery/item",
  GalleryGroups = "/v1/gallery/groups",
  GalleryGroupDetail = "/v1/gallery/group",

  // ── Bilgi kartları ──────────────────────────────────────────────────
  InfoCards = "/v1/infocards",
  InfoCardDetail = "/v1/infocards/infocard",

  // ── Teklifler ───────────────────────────────────────────────────────
  Offers = "/v1/offers",
  OfferDetail = "/v1/offers/offer",
  OfferState = "/v1/offers/offer/state",
  OfferComplete = "/v1/offers/offer/complete",
  OfferMail = "/v1/offers/offer/mail",
  OfferHistory = "/v1/offers/offer/history",
  OfferDetailPreview = "/v1/offers/offer/preview",
  /** Public — oturum gerektirmez (middleware bypass) */
  PreviewOffer = "/v1/preview/offer",

  // ── Siparişler ──────────────────────────────────────────────────────
  Orders = "/v1/orders",
  OrderDetail = "/v1/orders/order",
  OrderState = "/v1/orders/order/state",
  OrderPayment = "/v1/orders/order/payment",

  // ── Destek talepleri ────────────────────────────────────────────────
  Tickets = "/v1/tickets",
  TicketDetail = "/v1/tickets/ticket",
  TicketMessage = "/v1/tickets/ticketmessage",

  // ── Özellikler ──────────────────────────────────────────────────────
  Features = "/v1/features",
  FeatureDetail = "/v1/features/feature",
  FeatureGroups = "/v1/featuregroups",
  FeatureGroupDetail = "/v1/featuregroups/finefeaturegroup",

  // ── Gelir / Gider ───────────────────────────────────────────────────
  ExpenseRevenues = "/v1/expenserevenues",
  ExpenseRevenueDetail = "/v1/expenserevenues/expenserevenue",
  ExpenseRevenueCategories = "/v1/expenserevenuecategories",
  ExpenseRevenueCategoryDetail = "/v1/expenserevenuecategories/expenserevenuecategory",

  // ── CMS ─────────────────────────────────────────────────────────────
  Namespaces = "/v1/cms/namespaces",
  NamespaceDetail = "/v1/cms/namespaces/namespace",
  ResourceGroups = "/v1/cms/resourcegroups",
  ResourceGroupDetail = "/v1/cms/resourcegroups/resourcegroup",
  Contents = "/v1/cms/contents",
  ContentDetail = "/v1/cms/contents/content",

  // ── Diğer CRUD modülleri ────────────────────────────────────────────
  ContactForms = "/v1/contactforms",
  ContactFormDetail = "/v1/contactforms/contactform",
  BankAccounts = "/v1/bankaccounts",
  BankAccountDetail = "/v1/bankaccounts/bankaccount",

  // ── Sözleşme şablonlama ─────────────────────────────────────────────
  ContractTemplates = "/v1/templating/contracttemplates",
  ContractTemplateDetail = "/v1/templating/contracttemplates/contracttemplate",
  ContractTemplatePlaceholders = "/v1/templating/placeholders",
  ContractTemplatePlaceholderDetail = "/v1/templating/placeholders/placeholder",
  ActivityLogs = "/v1/ActivityLogs",

  // ── Bildirimler (yönetici tarafından oluşturulan) ────────────────────
  Notifications = "/v1/notifications",
  NotificationDetail = "/v1/notifications/notification",

  // ── Proje süreçleri (brief) ──────────────────────────────────────────
  ProjectBriefs = "/v1/projectbriefs",
  ProjectBriefDetail = "/v1/projectbriefs/projectbrief",
  ProjectBriefState = "/v1/projectbriefs/projectbrief/state",

  // ── Ayarlar ─────────────────────────────────────────────────────────
  AppSettings = "/v1/appsettings",

  // ── Workspace (çizim editörü) ───────────────────────────────────────
  Workspace = "/v1/workspaces/workspace",
  WorkspaceItems = "/v1/workspaces/workspace/items",
  WorkspaceItemImage = "/v1/workspaces/workspace/items/item/image",
  WorkspaceLock = "/v1/workspaces/workspace/lock",
  WorkspaceLockRenew = "/v1/workspaces/workspace/lock/renew",
  WorkspaceUnlock = "/v1/workspaces/workspace/unlock",
  WorkspaceUnlockAll = "/v1/workspaces/workspace/unlock/all",

  // ── Sanal turlar ────────────────────────────────────────────────────
  VirtualTours = "/v1/virtualtours",
  VirtualTourDetail = "/v1/virtualtours/virtualtour",
  VirtualTourScenes = "/v1/virtualtours/virtualtour/scenes",

  // ── Dashboard ───────────────────────────────────────────────────────
  DashboardGeneral = "/v1/dashboard/general",
  DashboardOrders = "/v1/dashboard/orders",
  DashboardExpenseRevenues = "/v1/dashboard/expenserevenues",
}

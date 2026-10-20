export interface ApiResponse<T = any> {
  isSuccess: boolean;
  statusCode: number;
  messages: Array<{
    key: string | null;
    message: string | null;
    type: string;
  }>;
  data: T;
  metadatas?: any[];
}

export interface DashboardGeneralData {
  activeProjectCount: number;
  totalProjectCount: number;
  activeCompanyCount: number;
  totalCompanyCount: number;
  positiveOfferCount: number;
  totalOfferCount: number;
  unresolvedTicketCount: number;
  totalTicketCount: number;
}

export interface MonthlyData {
  month: number;
  totalAmount: number;
}

export interface MonthlyOrderData {
  month: number;
  count: number;
}

export interface ExpenseRevenueData {
  monthlyExpenses: MonthlyData[];
  monthlyIncomes: MonthlyData[];
}

export interface OrdersData {
  totalOrderPrice: number;
  monthlyOrders: MonthlyOrderData[];
}

export type DashboardGeneralResponse = ApiResponse<DashboardGeneralData>;
export type ExpenseRevenueResponse = ApiResponse<ExpenseRevenueData>;
export type OrdersResponse = ApiResponse<OrdersData>;

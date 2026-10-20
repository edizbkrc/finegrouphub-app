import type { IFeatureSpecification, INavigation, IPriceSpecs } from "@/features/offer/types";

/** OrderState: WaitingApproval 0, Rejected 1, Approved 2, Planning 3, Completed 4 */
export enum OrderStateEnum {
  WaitingApproval = 0,
  Rejected = 1,
  Approved = 2,
  Planning = 3,
  Completed = 4,
}

/** OrderPaymentState: NotPaid 0, PrePaymentCompleted 1, PaymentCompleted 2 */
export enum OrderPaymentStateEnum {
  NotPaid = 0,
  PrePaymentCompleted = 1,
  PaymentCompleted = 2,
}

export interface IOrderUpdate {
  stateFrom: number;
  stateTo: number;
  description?: string | null;
  updaterUserName?: string | null;
  updateTime?: string;
}

export interface IAddress {
  id?: string;
  contactNameSurname?: string | null;
  contactPhone?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  fullAddress?: string | null;
  zipCode?: string | null;
}

export interface IOrderDetail {
  id: number;
  isMainOrder: boolean;
  serviceEndDate?: string;
  state: OrderStateEnum;
  paymentState: OrderPaymentStateEnum;
  projectName?: string;
  featureSpecifications?: IFeatureSpecification[];
  updates?: IOrderUpdate[];
  projectAddresses?: IAddress[];
  priceSpecs?: IPriceSpecs;
  tenant?: INavigation<string> | null;
  featureGroup?: INavigation | null;
  projectId?: number | null;
}

/** Ödemeye eklenen belge; `url` API tarafından kısa ömürlü imzalı adres olarak tazelenir. */
export interface IOrderPaymentDocument {
  id?: string | null;
  fileName?: string | null;
  url?: string | null;
}

/** ExpenseRevenue kategori kimlikleri: 1 = sipariş ödemesi, 2 = bakım ödemesi. */
export const ORDER_PAYMENT_CATEGORY = 1;
export const MAINTENANCE_PAYMENT_CATEGORY = 2;

export interface IOrderPayment {
  id: number;
  amount: number;
  description?: string | null;
  date?: string;
  bankAccount?: INavigation | null;
  documents?: IOrderPaymentDocument[];
  categoryId?: number;
}

export interface IOrderPayments {
  totalPaymentAmountWithVat?: number;
  remainingPaymentAmountWithVat?: number;
  totalMaintenancePaymentAmountWithVat?: number;
  remainingMaintenancePaymentAmountWithVat?: number;
  discountAmount?: number;
  payments?: IOrderPayment[];
}

export interface INavigation<TId = number> {
  id: TId;
  name?: string | null;
}

export interface ICurrencySnap {
  currency: number;
  value?: number | null;
}

export interface IFeatureSpecification {
  featureAlias: string;
  featureName?: string | null;
  type?: number | null;
  value: number | boolean;
}

export interface IPriceSpecs {
  extraPriceWithVat?: number;
  dailyMaintenancePriceWithVat?: number;
  totalMaintanencePriceWithVat?: number;
  servicePriceWithoutVat?: number;
  servicePriceWithVat?: number;
  totalPriceWithoutVat?: number;
  totalPriceWithVat?: number;
  currencySnap?: ICurrencySnap;
  currencyDescription?: string;
  featureUnitPriceFactor?: number;
  extraPriceWithoutVat?: number;
  extraPriceVatPercentage?: number;
  extraPriceDescription?: string | null;
  dailyMaintenancePriceWithoutVat?: number;
  maintenanceDurationInDays?: number;
  vatPercentage?: number;
  discountAmount?: number;
  prePaymentAmountWithVat?: number;
}

/** OfferState: Draft 0, SentToCustomer 1, Completed 2, RejectedByCustomer 3, RejectedByFineHub 4, Versioned 5 */
export enum OfferStateEnum {
  Draft = 0,
  SentToCustomer = 1,
  Completed = 2,
  RejectedByCustomer = 3,
  RejectedByFineHub = 4,
  Versioned = 5,
}

export interface IOfferDetail {
  id: number;
  state: OfferStateEnum;
  projectName?: string;
  text?: string | null;
  date?: string;
  expirationDate?: string;
  featureSpecifications?: IFeatureSpecification[];
  minDeliveryDurationInDays?: number;
  maxDeliveryDurationInDays?: number;
  priceSpecs?: IPriceSpecs;
  correlationId?: string;
  featureGroup?: INavigation | null;
  tenant?: INavigation<string> | null;
}

export interface IOfferHistoryItem {
  id: number;
  state: OfferStateEnum;
  stateDescription?: string;
  totalPriceWithVat?: number;
  prePaymentAmount?: number;
  maintenanceDurationInDays?: number;
  date?: string;
  previousOfferId?: number | null;
  previousOfferTotalPriceWithVat?: number | null;
  currencySnap?: ICurrencySnap | null;
}

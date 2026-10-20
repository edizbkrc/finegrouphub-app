/** TicketState (API): Open 1, Solved 2. Başka değer yok; 0 "tanımsız" kabul edilir. */
export enum TicketStateEnum {
  Open = 1,
  Solved = 2,
}

/** TicketType (API): Technical 1, Billing 2, Account 3, Other 4. */
export enum TicketTypeEnum {
  Technical = 1,
  Billing = 2,
  Account = 3,
  Other = 4,
}

/** Mesaja eklenen dosya; `url` API tarafından kısa ömürlü imzalı adres olarak tazelenir. */
export interface ITicketDocument {
  id?: string | null;
  fileName?: string | null;
  url?: string | null;
}

export interface ITicketMessage {
  id: string;
  sendBySupporter: boolean;
  writer?: string | null;
  message?: string | null;
  creationDate?: string | null;
  documents?: ITicketDocument[];
}

export interface ITicketDetail {
  id: number;
  title?: string;
  type?: TicketTypeEnum;
  state?: TicketStateEnum;
  languageId?: number;
  languageName?: string;
  /** API tenant kimliğini bileşik dize olarak döner ("acme_1"); adı ayrıca çözülür. */
  tenantId?: string;
  messages?: ITicketMessage[];
  auditInfo?: { creationDate?: string | null; creatorUserName?: string | null } | null;
}

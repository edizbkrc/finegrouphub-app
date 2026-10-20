import { IMessage } from "./IMessage";
import { IMetadata } from "./IMetadata";

export interface IBaseResponse<TData> {
  messages: IMessage[];
  statusCode: number;
  isSuccess: boolean;
  data: TData;
  metadatas: IMetadata[];
}

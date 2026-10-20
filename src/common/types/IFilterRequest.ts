import { ConnectorTypeEnum } from "@common/enums/ConnectorTypeEnum";
import { IFilterCriteria } from "./IFilterCriteria";

export interface IFilterRequest {
  mergeType?: ConnectorTypeEnum;
  criterias: IFilterCriteria[];
}

import { TypeGroupEnum } from "@common/enums/TypeGroupEnum";

export function mapTypeGroupToInputType(typeGroup: TypeGroupEnum): string {
  switch (typeGroup) {
    case TypeGroupEnum.Text:
      return "text";
    case TypeGroupEnum.Number:
      return "number";
    case TypeGroupEnum.Boolean:
      return "checkbox";
    case TypeGroupEnum.Date:
      return "datetime-local";
    case TypeGroupEnum.Select:
      return "select";
    case TypeGroupEnum.Default:
    default:
      return "text";
  }
}

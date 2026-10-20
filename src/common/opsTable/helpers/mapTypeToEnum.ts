import { TypeGroupEnum } from "@common/enums/TypeGroupEnum";

export function mapTypeToEnum(
  type: string,
  filterComponentType?: string | null
): TypeGroupEnum {
  const typeParts = type.split(".");
  const firstPart = typeParts?.[0];
  const lastPart = typeParts?.[typeParts.length - 1];

  if (filterComponentType === "select") {
    return TypeGroupEnum.Select;
  }

  if (firstPart === "Enum") {
    return TypeGroupEnum.Select;
  }

  switch (lastPart) {
    case "String":
    case "Char":
      return TypeGroupEnum.Text;
    case "Int32":
    case "UInt32":
    case "Byte":
    case "SByte":
    case "Int16":
    case "UInt16":
    case "Int64":
    case "UInt64":
    case "Single":
    case "Double":
    case "Decimal":
      return TypeGroupEnum.Number;
    case "Boolean":
      return TypeGroupEnum.Boolean;
    case "DateTime":
    case "DateTimeOffset":
      return TypeGroupEnum.Date;
    default:
      return TypeGroupEnum.Default;
  }
}

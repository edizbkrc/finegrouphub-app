import {
  CRUD_KEY,
  buildDetailParams,
  toListRequest,
  fromListResponse,
  toLookupRequest,
  toEnumLookupParams,
  normalizeEnvelope,
  buildMetadata,
} from "@network/adapters";
import { SortTypeEnum } from "@common/enums/SortTypeEnum";
import { FilterTypeEnum } from "@common/enums/FilterTypeEnum";
import type { ITableResponse } from "@opsTable/types/ITableResponse";

describe("adapters — D1: CRUD anahtarı", () => {
  it("her modülde 'id' kullanır", () => {
    expect(CRUD_KEY).toBe("id");
    expect(buildDetailParams(42)).toEqual({ id: 42 });
  });

  it("istisna gerekirse anahtar geçersiz kılınabilir", () => {
    expect(buildDetailParams(7, "TenantId")).toEqual({ TenantId: 7 });
  });
});

describe("adapters — liste isteği", () => {
  it("sayfalama, filtre ve sıralamayı olduğu gibi taşır", () => {
    const request = {
      pageNumber: 2,
      rowCount: 25,
      sorting: { sortBy: "name", type: SortTypeEnum.Des },
      filtering: {
        criterias: [
          { filterBy: "name", value: "ali", type: FilterTypeEnum.Contains },
        ],
      },
    };

    expect(toListRequest(request)).toEqual(request);
  });

  it("extraParams'ı gövdeye ekler", () => {
    const result = toListRequest(
      { pageNumber: 1, rowCount: 10 },
      { projectId: 5 }
    );

    expect(result).toEqual({ pageNumber: 1, rowCount: 10, projectId: 5 });
  });
});

describe("adapters — liste yanıtı", () => {
  it("eksik sayfalama alanlarında tabloyu NaN'a düşürmez", () => {
    const result = fromListResponse({} as ITableResponse<unknown>);

    expect(result.currentPageNumber).toBe(1);
    expect(result.totalPageCount).toBe(0);
    expect(result.totalDataCount).toBe(0);
    expect(result.data).toEqual([]);
    expect(result.metadatas).toEqual([]);
    expect(result.aggregationResults).toEqual([]);
  });

  it("gelen değerleri ezmez", () => {
    const response = {
      data: [{ id: 1 }],
      metadatas: [],
      messages: [],
      statusCode: 200,
      isSuccess: true,
      currentPageNumber: 3,
      totalPageCount: 9,
      totalDataCount: 84,
      aggregationResults: [],
    } as ITableResponse<{ id: number }>;

    expect(fromListResponse(response)).toEqual(response);
  });
});

describe("adapters — lookup", () => {
  it("entity lookup gövdesini 'parameters' dizisiyle sarar", () => {
    const body = toLookupRequest({
      entityName: "Role",
      requestedPropertyNames: ["Name"],
    });

    // REBUILD_PROMPT §3.6 bu sarmalayıcıyı atlıyordu — regresyon koruması.
    expect(body).toEqual({
      parameters: [{ entityName: "Role", requestedPropertyNames: ["Name"] }],
    });
  });

  it("birden fazla parametre alabilir", () => {
    const body = toLookupRequest(
      { entityName: "Role", requestedPropertyNames: ["Name"] },
      { entityName: "Language", requestedPropertyNames: ["Name", "Supported"] }
    );

    expect(body.parameters).toHaveLength(2);
  });

  it("enum lookup sorgu parametresi üretir", () => {
    expect(toEnumLookupParams("UserType")).toEqual({ enumName: "UserType" });
  });
});

describe("adapters — zarf", () => {
  it("camelCase zarfı okur", () => {
    const result = normalizeEnvelope({
      messages: [{ key: null, message: "ok", type: 1 }],
      statusCode: 200,
      isSuccess: true,
      data: { id: 1 },
      metadatas: [],
    });

    expect(result.isSuccess).toBe(true);
    expect(result.data).toEqual({ id: 1 });
    expect(result.messages).toHaveLength(1);
  });

  it("PascalCase hata zarfını da okur", () => {
    const result = normalizeEnvelope({
      Messages: [{ key: "name", message: "zorunlu", type: 2 }],
      StatusCode: 422,
      IsSuccess: false,
    });

    expect(result.isSuccess).toBe(false);
    expect(result.statusCode).toBe(422);
    expect(result.messages[0].message).toBe("zorunlu");
  });

  it("boş yanıtta isSuccess false döner", () => {
    const result = normalizeEnvelope(undefined);

    expect(result.isSuccess).toBe(false);
    expect(result.messages).toEqual([]);
  });
});

describe("adapters — metadata", () => {
  it("localizedName boşsa name'e düşer", () => {
    const [meta] = buildMetadata([
      { name: "createdDate", localizedName: "" } as any,
    ]);

    expect(meta.localizedName).toBe("createdDate");
  });

  it("eksik bayraklara güvenli varsayılan uygular", () => {
    const [meta] = buildMetadata([{ name: "id" } as any]);

    expect(meta.display).toBe(true);
    expect(meta.pinned).toBe(false);
    expect(meta.filterable).toBe(false);
  });

  it("null metadata'da boş dizi döner", () => {
    expect(buildMetadata(null)).toEqual([]);
  });
});

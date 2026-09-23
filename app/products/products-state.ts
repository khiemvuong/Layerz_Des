import { LocationOption } from "@/lib/catalog";

export type ResultsView = "products" | "shops";

export type ProductFilters = {
  q: string;
  province: string;
  district: string;
  category: string;
  occasion: string;
  shopId: string;
  minPrice: string;
  maxPrice: string;
  express: boolean;
  sort: string;
  view: ResultsView;
};

export type SortOption = {
  value: string;
  label: string;
};

export const productSortOptions: SortOption[] = [
  { value: "relevant", label: "Phù hợp nhất" },
  { value: "popular", label: "Bán chạy" },
  { value: "newest", label: "Mới nhất" },
  { value: "price-asc", label: "Giá thấp → cao" },
  { value: "price-desc", label: "Giá cao → thấp" },
];

export const shopSortOptions: SortOption[] = [
  { value: "relevant", label: "Phù hợp nhất" },
  { value: "nearest", label: "Gần khu vực chọn" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "matches", label: "Nhiều bánh phù hợp" },
];

export const DEFAULT_FILTERS: ProductFilters = {
  q: "",
  province: "",
  district: "",
  category: "",
  occasion: "",
  shopId: "",
  minPrice: "",
  maxPrice: "",
  express: false,
  sort: "popular",
  view: "products",
};

function firstValue(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0] ?? ""
    : value ?? "";
}

export function normalizeFilters(
  filters: ProductFilters,
): ProductFilters {
  const productSortValues = new Set(
    productSortOptions.map((item) => item.value),
  );

  const shopSortValues = new Set(
    shopSortOptions.map((item) => item.value),
  );

  const view: ResultsView =
    filters.view === "shops"
      ? "shops"
      : "products";

  let sort = filters.sort;

  if (
    view === "products" &&
    !productSortValues.has(sort)
  ) {
    sort = "relevant";
  }

  if (
    view === "shops" &&
    !shopSortValues.has(sort)
  ) {
    sort = filters.province || filters.district
      ? "nearest"
      : "relevant";
  }

  return {
    ...filters,
    view,
    sort,
  };
}

export function filtersFromRecord(
  raw: Record<
    string,
    string | string[] | undefined
  >,
): ProductFilters {
  const q = firstValue(raw.q);

  /*
   * Hỗ trợ link cũ:
   * ?region=Bình Dương
   *
   * Nhưng từ giờ URL canonical sẽ dùng:
   * ?province=Bình Dương
   */
  const province =
    firstValue(raw.province) ||
    firstValue(raw.region);

  const district = firstValue(raw.district);
  const category = firstValue(raw.category);
  const occasion = firstValue(raw.occasion);
  const shopId = firstValue(raw.shopId);
  const minPrice = firstValue(raw.minPrice);
  const maxPrice = firstValue(raw.maxPrice);
  const requestedSort = firstValue(raw.sort);
  const requestedView = firstValue(raw.view);

  const express =
    firstValue(raw.express) === "1";

  const productSortValues = new Set(
    productSortOptions.map((item) => item.value),
  );

  const hasProductIntent = Boolean(
    q ||
      category ||
      occasion ||
      shopId ||
      minPrice ||
      maxPrice ||
      express ||
      productSortValues.has(requestedSort),
  );

  const inferredView: ResultsView =
    hasProductIntent ? "products" : "shops";

  const view: ResultsView =
    requestedView === "products" ||
    requestedView === "shops"
      ? requestedView
      : inferredView;

  const defaultSort =
    view === "products"
      ? hasProductIntent
        ? "relevant"
        : "popular"
      : province || district
        ? "nearest"
        : "relevant";

  return normalizeFilters({
    q,
    province,
    district,
    category,
    occasion,
    shopId,
    minPrice,
    maxPrice,
    express,
    sort: requestedSort || defaultSort,
    view,
  });
}

export function filtersFromSearchParams(
  params: URLSearchParams,
): ProductFilters {
  return filtersFromRecord({
    q: params.get("q") ?? "",
    province:
      params.get("province") ??
      params.get("region") ??
      "",
    district: params.get("district") ?? "",
    category: params.get("category") ?? "",
    occasion: params.get("occasion") ?? "",
    shopId: params.get("shopId") ?? "",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    express: params.get("express") ?? "",
    sort: params.get("sort") ?? "",
    view: params.get("view") ?? "",
  });
}

export function buildProductsQuery(
  filters: ProductFilters,
) {
  const normalized =
    normalizeFilters(filters);

  const query = new URLSearchParams();

  if (normalized.q)
    query.set("q", normalized.q);

  if (normalized.province)
    query.set(
      "province",
      normalized.province,
    );

  if (
    normalized.province &&
    normalized.district
  ) {
    query.set(
      "district",
      normalized.district,
    );
  }

  if (normalized.category)
    query.set(
      "category",
      normalized.category,
    );

  if (normalized.occasion)
    query.set(
      "occasion",
      normalized.occasion,
    );

  if (normalized.shopId)
    query.set(
      "shopId",
      normalized.shopId,
    );

  if (normalized.minPrice)
    query.set(
      "minPrice",
      normalized.minPrice,
    );

  if (normalized.maxPrice)
    query.set(
      "maxPrice",
      normalized.maxPrice,
    );

  if (normalized.express)
    query.set("express", "1");

  if (normalized.sort)
    query.set("sort", normalized.sort);

  if (normalized.view)
    query.set("view", normalized.view);

  return query.toString();
}

export function numberFilterValue(
  value: string,
) {
  const parsed = Number(value);

  return Number.isFinite(parsed) &&
    parsed > 0
    ? parsed
    : null;
}
export function normalizeLocationFilters(
  filters: ProductFilters,
  locations: LocationOption[],
): ProductFilters {
  // Không có province thì district không được tồn tại.
  if (!filters.province) {
    return {
      ...filters,
      district: "",
    };
  }

  const selectedLocation = locations.find(
    (location) =>
      location.province === filters.province ||
      location.label === filters.province,
  );

  // Province không tồn tại trong catalog.
  if (!selectedLocation) {
    return {
      ...filters,
      province: "",
      district: "",
    };
  }

  // District không thuộc province hiện tại.
  if (
    filters.district &&
    !selectedLocation.districts.includes(filters.district)
  ) {
    return {
      ...filters,
      province: selectedLocation.province,
      district: "",
    };
  }

  return {
    ...filters,
    province: selectedLocation.province,
  };
}
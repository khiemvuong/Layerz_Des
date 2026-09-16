import catalogJson from "@/data/layerz-catalog.json";
import featuredJson from "@/data/featured-products.json";

export type Product = {
  id: string;
  slug: string;
  shopId: string;
  name: string;
  shopName: string;
  tags: string[];
  thumbnail: string;
  minPrice: number;
  maxPrice: number;
  rating: number;
  reviewCount: number;
  totalSold: number;
  categories: Array<{ name: string; slug: string }>;
  isExpressEligible: boolean;
  preparationTimeHours: number | null;
  sourceOrder: number;
  province: string;
  district: string;
};

export type Shop = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatarUrl: string;
  bannerUrl: string;
  acceptsCustomOrders: boolean;
  totalOrders: number;
  rating: number;
  reviewCount: number;
  streetAddress: string;
  ward: string;
  isVerified: boolean;
  province: string;
  district: string;
};

export type LocationOption = {
  province: string;
  label: string;
  requiresDistrict: boolean;
  districts: string[];
};

export type CatalogSnapshot = {
  source: string;
  scrapedAt: string;
  products: Product[];
  shops: Shop[];
  locations: LocationOption[];
};

export type HomeCatalog = {
  selection: {
    province: string;
    district: string | null;
    label: string;
  };
  shops: Shop[];
  featuredProducts: Product[];
  newProducts: Product[];
  expressProducts: Product[];
  productCount: number;
  locations: LocationOption[];
  scrapedAt: string;
};

const snapshot = catalogJson as CatalogSnapshot;
type CurationEntry = {
  location: string;
  section: "layerz-picks";
  product: string;
  position: number;
  startDate: string | null;
  endDate: string | null;
  priority: number;
};

const curation = featuredJson as { curations: CurationEntry[] };

function scoreProduct(product: Product) {
  return product.rating * 100 + product.reviewCount * 8 + product.totalSold * 5;
}

function isInArea(item: Product | Shop, province: string, district?: string | null) {
  if (item.province !== province) return false;
  return district ? item.district === district : true;
}

function getLocationLabel(province: string, district?: string | null) {
  if (district && province === "TP. Hồ Chí Minh") return district;
  return snapshot.locations.find((item) => item.province === province)?.label ?? province;
}

function mergeUniqueProducts(...groups: Product[][]) {
  const seen = new Set<string>();
  return groups.flat().filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function getPinnedSlugs(province: string, district: string | null) {
  const now = Date.now();
  const exactKey = district ? `${province}/${district}` : province;

  return curation.curations
    .filter((item) => {
      const startsOnTime = !item.startDate || new Date(item.startDate).getTime() <= now;
      const endsOnTime = !item.endDate || new Date(item.endDate).getTime() >= now;
      return (
        item.section === "layerz-picks" &&
        (item.location === exactKey || item.location === province || item.location === "*") &&
        startsOnTime &&
        endsOnTime
      );
    })
    .sort((a, b) => b.priority - a.priority || a.position - b.position)
    .map((item) => item.product);
}

export function getHomeCatalog(input?: {
  province?: string | null;
  district?: string | null;
}): HomeCatalog {
  const fallbackLocation = snapshot.locations.find(
    (item) => item.province === "Bà Rịa - Vũng Tàu",
  ) ?? snapshot.locations[0];
  const requestedProvince = input?.province?.trim();
  const knownLocation = snapshot.locations.find(
    (item) => item.province === requestedProvince,
  );
  const province = requestedProvince || fallbackLocation.province;
  const district = input?.district?.trim() || null;
  const exactProducts = knownLocation
    ? snapshot.products.filter((product) => isInArea(product, province, district))
    : [];
  const provinceProducts = knownLocation
    ? snapshot.products.filter((product) => isInArea(product, province))
    : snapshot.products;
  const areaProducts = exactProducts.length ? exactProducts : provinceProducts;
  const pinnedSlugs = getPinnedSlugs(province, district);
  const pinnedProducts = pinnedSlugs
    .map((slug) => areaProducts.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product));
  const popularProducts = [...areaProducts].sort((a, b) => scoreProduct(b) - scoreProduct(a));
  const newestProducts = [...areaProducts].sort((a, b) => a.sourceOrder - b.sourceOrder);
  const globalFallback = [...snapshot.products].sort((a, b) => scoreProduct(b) - scoreProduct(a));
  const globalNewest = [...snapshot.products].sort((a, b) => a.sourceOrder - b.sourceOrder);

  const shops = [...snapshot.shops].sort((a, b) => {
    const aLocal = isInArea(a, province, district) ? 2 : isInArea(a, province) ? 1 : 0;
    const bLocal = isInArea(b, province, district) ? 2 : isInArea(b, province) ? 1 : 0;
    if (aLocal !== bLocal) return bLocal - aLocal;
    return a.name.localeCompare(b.name, "vi");
  });

  return {
    selection: {
      province,
      district,
      label: knownLocation ? getLocationLabel(province, district) : "Tất cả khu vực",
    },
    shops,
    featuredProducts: mergeUniqueProducts(
      pinnedProducts,
      popularProducts,
      newestProducts,
      globalFallback,
    ).slice(0, 5),
    newProducts: mergeUniqueProducts(newestProducts, globalNewest).slice(0, 8),
    expressProducts: mergeUniqueProducts(
      popularProducts.filter((product) => product.isExpressEligible),
      globalFallback.filter((product) => product.isExpressEligible),
    ).slice(0, 3),
    productCount: areaProducts.length,
    locations: snapshot.locations,
    scrapedAt: snapshot.scrapedAt,
  };
}

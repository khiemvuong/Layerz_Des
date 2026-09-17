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

export type ProductCatalogInput = {
  q?: string | null;
  region?: string | null;
  district?: string | null;
  category?: string | null;
  occasion?: string | null;
  shopId?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  express?: boolean;
  sort?: string | null;
};

export type ProductShopGroup = {
  shop: Shop;
  products: Product[];
  totalProducts: number;
};

export type ProductsCatalog = {
  products: Product[];
  shops: Shop[];
  groups: ProductShopGroup[];
  resultCount: number;
  locationLabel: string | null;
  locations: LocationOption[];
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

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function productSearchText(product: Product) {
  return normalizeText([
    product.name,
    product.shopName,
    ...product.tags,
    ...product.categories.flatMap((category) => [category.name, category.slug]),
  ].join(" "));
}

function takeFairProducts(products: Product[], limit: number, maxPerShop = 2) {
  const shopCounts = new Map<string, number>();
  const selected: Product[] = [];

  for (const product of products) {
    const count = shopCounts.get(product.shopId) ?? 0;
    if (count >= maxPerShop) continue;
    selected.push(product);
    shopCounts.set(product.shopId, count + 1);
    if (selected.length === limit) break;
  }

  return selected;
}

function diversifyProducts(products: Product[], maxConsecutivePerShop = 2) {
  const productsByShop = new Map<string, Product[]>();
  const shopOrder = new Map<string, number>();
  const diversified: Product[] = [];

  for (const product of products) {
    const shopProducts = productsByShop.get(product.shopId) ?? [];
    if (!productsByShop.has(product.shopId)) shopOrder.set(product.shopId, shopOrder.size);
    shopProducts.push(product);
    productsByShop.set(product.shopId, shopProducts);
  }

  while (productsByShop.size) {
    const recentProducts = diversified.slice(-maxConsecutivePerShop);
    const blockedShopId = recentProducts.length === maxConsecutivePerShop && recentProducts.every(
      (product) => product.shopId === recentProducts[0].shopId,
    ) ? recentProducts[0].shopId : null;
    const candidates = [...productsByShop.entries()]
      .filter(([shopId]) => shopId !== blockedShopId)
      .sort(([aShopId, aProducts], [bShopId, bProducts]) => (
        bProducts.length - aProducts.length || (shopOrder.get(aShopId) ?? 0) - (shopOrder.get(bShopId) ?? 0)
      ));
    const [nextShopId, nextShopProducts] = candidates[0] ?? [...productsByShop.entries()][0];
    const nextProduct = nextShopProducts.shift();
    if (nextProduct) diversified.push(nextProduct);
    if (!nextShopProducts.length) productsByShop.delete(nextShopId);
  }

  return diversified;
}

function findLocation(region?: string | null) {
  if (!region) return null;
  const normalizedRegion = normalizeText(region);
  return snapshot.locations.find((location) =>
    [location.province, location.label, ...location.districts].some(
      (value) => normalizeText(value) === normalizedRegion,
    ),
  ) ?? null;
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

  const featuredProducts = takeFairProducts(
    mergeUniqueProducts(pinnedProducts, popularProducts, newestProducts),
    8,
  );
  const featuredIds = new Set(featuredProducts.map((product) => product.id));
  const newProducts = takeFairProducts(
    newestProducts.filter(
      (product) => !featuredIds.has(product.id),
    ),
    4,
  );

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
    featuredProducts,
    newProducts,
    expressProducts: mergeUniqueProducts(
      popularProducts.filter((product) => product.isExpressEligible),
      globalFallback.filter((product) => product.isExpressEligible),
    ).slice(0, 3),
    productCount: areaProducts.length,
    locations: snapshot.locations,
    scrapedAt: snapshot.scrapedAt,
  };
}

const occasionTerms: Record<string, string[]> = {
  birthday: ["sinh nhat"],
  bento: ["bento", "mini"],
  anniversary: ["ky niem", "tinh yeu", "le tinh nhan"],
  kids: ["hoat hinh", "tao hinh", "cho be"],
  lover: ["tinh yeu", "le tinh nhan", "ban gai"],
  opening: ["khai truong", "doanh nghiep"],
  party: ["bento", "mini", "tiec"],
};

export function getProductsCatalog(input: ProductCatalogInput = {}): ProductsCatalog {
  const location = findLocation(input.region);
  const query = normalizeText(input.q ?? "");
  const category = normalizeText(input.category ?? "");
  const occasion = normalizeText(input.occasion ?? "");
  const occasionMatches = occasionTerms[occasion] ?? (occasion ? [occasion] : []);

  let products = snapshot.products.filter((product) => {
    if (input.shopId && product.shopId !== input.shopId) return false;
    if (location && product.province !== location.province) return false;
    if (input.district && product.district !== input.district) return false;
    if (input.minPrice && (product.minPrice <= 0 || product.minPrice < input.minPrice)) return false;
    if (input.maxPrice && (product.minPrice <= 0 || product.minPrice > input.maxPrice)) return false;
    if (input.express && !product.isExpressEligible) return false;

    const searchable = productSearchText(product);
    if (query && !searchable.includes(query)) return false;
    if (category && !searchable.includes(category)) return false;
    if (occasionMatches.length && !occasionMatches.some((term) => searchable.includes(term))) {
      return false;
    }
    return true;
  });

  if (input.sort === "newest") {
    products = [...products].sort((a, b) => a.sourceOrder - b.sourceOrder);
  } else if (input.sort === "popular") {
    products = [...products].sort((a, b) => b.totalSold - a.totalSold || scoreProduct(b) - scoreProduct(a));
  } else if (input.sort === "price-asc") {
    products = [...products].sort((a, b) => {
      if (a.minPrice <= 0) return 1;
      if (b.minPrice <= 0) return -1;
      return a.minPrice - b.minPrice;
    });
  } else if (input.sort === "price-desc") {
    products = [...products].sort((a, b) => {
      if (a.minPrice <= 0) return 1;
      if (b.minPrice <= 0) return -1;
      return b.minPrice - a.minPrice;
    });
  } else {
    products = [...products].sort((a, b) => scoreProduct(b) - scoreProduct(a));
  }

  if (input.sort !== "price-asc" && input.sort !== "price-desc") {
    products = diversifyProducts(products);
  }

  const shopsById = new Map(snapshot.shops.map((shop) => [shop.id, shop]));
  const groupedProducts = new Map<string, Product[]>();
  for (const product of products) {
    const group = groupedProducts.get(product.shopId) ?? [];
    group.push(product);
    groupedProducts.set(product.shopId, group);
  }

  const groups = [...groupedProducts.entries()]
    .map(([shopId, shopProducts]) => {
      const shop = shopsById.get(shopId);
      if (!shop) return null;
      return {
        shop,
        products: shopProducts.slice(0, 4),
        totalProducts: shopProducts.length,
      };
    })
    .filter((group): group is ProductShopGroup => Boolean(group));

  groups.sort((a, b) => {
    if (input.sort === "rating") {
      return b.shop.rating - a.shop.rating || b.shop.reviewCount - a.shop.reviewCount;
    }
    if (input.sort === "matches") {
      return b.totalProducts - a.totalProducts || b.shop.rating - a.shop.rating;
    }
    if (input.sort === "nearest") {
      const localityScore = (shop: Shop) => {
        if (input.district && shop.district === input.district) return 2;
        if (location && shop.province === location.province) return 1;
        return 0;
      };
      return localityScore(b.shop) - localityScore(a.shop) || b.shop.rating - a.shop.rating;
    }
    return scoreProduct(b.products[0]) - scoreProduct(a.products[0]);
  });

  return {
    products,
    shops: snapshot.shops,
    groups,
    resultCount: products.length,
    locationLabel: location?.label ?? null,
    locations: snapshot.locations,
  };
}

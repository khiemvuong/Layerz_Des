import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://api.layerz.vn/api";
const PAGE_SIZE = 50;
const outputPath = path.join(process.cwd(), "data", "layerz-catalog.json");

function normalizeLocation(province = "", district = "") {
  const provinceValue = province.trim();
  const districtValue = district.trim();
  const normalizedDistrict = /^Quận\s+\d+$/i.test(districtValue)
    ? districtValue
    : districtValue.replace(/^Quận\s+/i, "").trim();

  if (/vũng tàu/i.test(districtValue)) {
    return { province: "Bà Rịa - Vũng Tàu", district: "Vũng Tàu" };
  }

  if (/hồ chí minh/i.test(provinceValue)) {
    return {
      province: "TP. Hồ Chí Minh",
      district: normalizedDistrict,
    };
  }

  return {
    province: provinceValue,
    district: normalizedDistrict,
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`LayerZ API returned ${response.status} for ${url}`);
  }

  return response.json();
}

async function fetchAllProducts() {
  const products = [];
  let page = 1;
  let totalCount = Number.POSITIVE_INFINITY;

  while (products.length < totalCount) {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sortBy: "createdAt",
      sortDirection: "desc",
    });
    const payload = await fetchJson(`${API_BASE}/products?${query}`);

    totalCount = payload.totalCount;
    products.push(...payload.items);

    if (!payload.items.length) break;
    page += 1;
  }

  return products.slice(0, totalCount);
}

function compactProduct(product, sourceOrder) {
  const location = normalizeLocation(product.province, product.district);

  return {
    id: product.id,
    slug: product.slug,
    shopId: product.shopId,
    name: product.name,
    shopName: product.shopName,
    tags: product.tags ?? [],
    thumbnail: product.thumbnail,
    minPrice: product.minPrice,
    maxPrice: product.maxPrice,
    rating: product.rating,
    reviewCount: product.reviewCount,
    totalSold: product.totalSold,
    categories: (product.categories ?? []).map(({ name, slug }) => ({ name, slug })),
    isExpressEligible: product.isExpressEligible,
    preparationTimeHours: product.preparationTimeHours,
    sourceOrder,
    ...location,
  };
}

function compactShop(shop) {
  const location = normalizeLocation(shop.province, shop.district);

  return {
    id: shop.shopId,
    slug: shop.slug,
    name: shop.shopName,
    description: shop.description,
    avatarUrl: shop.avatarUrl,
    bannerUrl: shop.bannerUrl,
    acceptsCustomOrders: Boolean(shop.acceptsCustomOrders),
    totalOrders: shop.totalOrders,
    rating: shop.rating,
    reviewCount: shop.reviewCount,
    streetAddress: shop.streetAddress,
    ward: shop.ward,
    isVerified: shop.isVerified,
    ...location,
  };
}

function buildLocations(products, shops) {
  const areas = new Map();

  for (const item of [...products, ...shops]) {
    if (!item.province) continue;
    const districts = areas.get(item.province) ?? new Set();
    if (item.district) districts.add(item.district);
    areas.set(item.province, districts);
  }

  const labelOverrides = {
    "Bà Rịa - Vũng Tàu": "Vũng Tàu",
    "Bình Dương": "Thủ Dầu Một",
  };

  return [...areas.entries()]
    .map(([province, districts]) => ({
      province,
      label: labelOverrides[province] ?? province,
      requiresDistrict: province === "TP. Hồ Chí Minh",
      districts: [...districts].sort((a, b) => a.localeCompare(b, "vi")),
    }))
    .sort((a, b) => {
      const order = ["TP. Hồ Chí Minh", "Bà Rịa - Vũng Tàu", "Bình Dương"];
      return order.indexOf(a.province) - order.indexOf(b.province);
    });
}

async function main() {
  const [rawProducts, rawShops] = await Promise.all([
    fetchAllProducts(),
    fetchJson(`${API_BASE}/shops?Page=1&PageSize=100`),
  ]);

  const products = rawProducts.map(compactProduct);
  const shops = rawShops.items.map(compactShop);
  const snapshot = {
    source: "https://api.layerz.vn/api",
    scrapedAt: new Date().toISOString(),
    products,
    shops,
    locations: buildLocations(products, shops),
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  console.log(`Saved ${products.length} products and ${shops.length} shops to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

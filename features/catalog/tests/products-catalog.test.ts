import { describe, expect, it } from "vitest";
import { getProductsCatalog } from "../../../lib/catalog";

describe("products catalog views", () => {
  it("applies both ends of a price range before building either view", () => {
    const catalog = getProductsCatalog({ minPrice: 200_000, maxPrice: 400_000 });

    expect(catalog.products.length).toBeGreaterThan(0);
    expect(catalog.products.every((product) => product.minPrice >= 200_000 && product.minPrice <= 400_000)).toBe(true);
    expect(catalog.groups.reduce((count, group) => count + group.totalProducts, 0)).toBe(catalog.resultCount);
  });

  it("keeps explicit price sorting monotonic", () => {
    const ascending = getProductsCatalog({ sort: "price-asc" }).products.filter((product) => product.minPrice > 0);
    const descending = getProductsCatalog({ sort: "price-desc" }).products.filter((product) => product.minPrice > 0);

    expect(ascending.every((product, index) => index === 0 || ascending[index - 1].minPrice <= product.minPrice)).toBe(true);
    expect(descending.every((product, index) => index === 0 || descending[index - 1].minPrice >= product.minPrice)).toBe(true);
  });

  it("sorts shop groups by rating or matching inventory independently from product sorting", () => {
    const byRating = getProductsCatalog({ sort: "rating" }).groups;
    const byMatches = getProductsCatalog({ sort: "matches" }).groups;

    expect(byRating.every((group, index) => index === 0 || byRating[index - 1].shop.rating >= group.shop.rating)).toBe(true);
    expect(byMatches.every((group, index) => index === 0 || byMatches[index - 1].totalProducts >= group.totalProducts)).toBe(true);
  });

  it("avoids showing more than two consecutive products from one shop in relevance mode", () => {
    const products = getProductsCatalog({ sort: "relevant" }).products;

    expect(products.every((product, index) => (
      index < 2 || product.shopId !== products[index - 1].shopId || product.shopId !== products[index - 2].shopId
    ))).toBe(true);
  });
});

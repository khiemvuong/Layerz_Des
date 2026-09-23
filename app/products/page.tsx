import type { Metadata } from "next";

import { getProductsCatalog } from "@/lib/catalog";

import { ProductsExperience } from "./products-experience";

import {
  filtersFromRecord,
  normalizeLocationFilters,
  numberFilterValue,
} from "./products-state";

export const metadata: Metadata = {
  title: "Tất cả bánh | LayerZ",
  description:
    "Tìm, lọc và khám phá bánh từ các tiệm trên LayerZ.",
};

type RawSearchParams = Record<
  string,
  string | string[] | undefined
>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const rawParams = await searchParams;

  const requestedFilters =
    filtersFromRecord(rawParams);

  /*
   * Dùng location metadata làm source of truth.
   */
  const locations =
    getProductsCatalog().locations;

  const initialFilters =
    normalizeLocationFilters(
      requestedFilters,
      locations,
    );

  const initialCatalog =
    getProductsCatalog({
      q: initialFilters.q || null,

      region:
        initialFilters.province || null,

      district:
        initialFilters.district || null,

      category:
        initialFilters.category || null,

      occasion:
        initialFilters.occasion || null,

      shopId:
        initialFilters.shopId || null,

      minPrice: numberFilterValue(
        initialFilters.minPrice,
      ),

      maxPrice: numberFilterValue(
        initialFilters.maxPrice,
      ),

      express:
        initialFilters.express,

      sort:
        initialFilters.sort || null,
    });

  return (
    <ProductsExperience
      initialCatalog={initialCatalog}
      initialFilters={initialFilters}
    />
  );
}
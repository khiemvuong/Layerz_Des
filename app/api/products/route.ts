import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getProductsCatalog } from "@/lib/catalog";

import {
  filtersFromSearchParams,
  normalizeLocationFilters,
  numberFilterValue,
} from "@/app/products/products-state";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const requestedFilters = filtersFromSearchParams(
      request.nextUrl.searchParams,
    );

    const locations = getProductsCatalog().locations;

    const filters = normalizeLocationFilters(
      requestedFilters,
      locations,
    );

    const catalog = getProductsCatalog({
      q: filters.q || null,
      region: filters.province || null,

      district: filters.district || null,
      category: filters.category || null,
      occasion: filters.occasion || null,
      shopId: filters.shopId || null,

      minPrice: numberFilterValue(filters.minPrice),
      maxPrice: numberFilterValue(filters.maxPrice),

      express: filters.express,
      sort: filters.sort || null,
    });

    return NextResponse.json({
      filters,
      catalog,
    });
  } catch (error) {
    console.error("[GET /api/products]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Không thể tải catalog.",
      },
      {
        status: 500,
      },
    );
  }
}
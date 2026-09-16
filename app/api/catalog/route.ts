import { getHomeCatalog } from "@/lib/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const catalog = getHomeCatalog({
    province: searchParams.get("province"),
    district: searchParams.get("district"),
  });

  return Response.json(catalog, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
    },
  });
}

import { HomeExperience } from "@/app/components/home-experience";
import { getHomeCatalog } from "@/lib/catalog";

export default function Home() {
  const catalog = getHomeCatalog({ province: "Bà Rịa - Vũng Tàu", district: "Vũng Tàu" });
  return <HomeExperience initialCatalog={catalog} />;
}

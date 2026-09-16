import type { Metadata } from "next";
import { CakeDesigner } from "@/features/cake-designer/components/CakeDesigner";

export const metadata: Metadata = {
  title: "Cake Studio | LayerZ",
  description: "Thiết kế bánh kem trực quan trên năm góc nhìn đồng bộ.",
};

export default function DesignerPage() {
  return <CakeDesigner />;
}

import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LayerZ | Bánh thiết kế theo khu vực",
  description: "Khám phá tiệm bánh và mẫu bánh thủ công được tuyển chọn theo khu vực của bạn.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${manrope.variable} ${playfair.variable} h-full scroll-smooth antialiased`}
    >
      <body className="m-0 flex min-h-full flex-col bg-panel font-sans text-ink">{children}</body>
    </html>
  );
}

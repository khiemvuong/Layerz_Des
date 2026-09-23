import Image from "next/image";
import { Heart, Lightning, MapPin, Star } from "@phosphor-icons/react/dist/ssr";
import type { Product } from "@/lib/catalog";

function cleanDisplayText(value: string) {
  return value
    .replace(/[–—]/g, " - ")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function ProductListingCard({
  product,
  bestseller = false,
}: {
  product: Product;
  bestseller?: boolean;
}) {
  const productUrl = `https://layerz.vn/product/${product.slug}`;
  const productName = cleanDisplayText(product.name);
  const location = cleanDisplayText(product.district || product.province);

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-line/90 bg-card shadow-[0_0.75rem_2rem_rgba(91,65,38,0.055)] transition duration-300 hover:-translate-y-1 hover:border-gold/70 hover:shadow-[0_1.125rem_2.75rem_rgba(91,65,38,0.1)]">
      <a
        className="relative block aspect-4/3 overflow-hidden bg-gold-pale"
        href={productUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Xem ${productName}`}
      >
        {bestseller ? (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/75 bg-card/90 px-3 py-1.5 text-[0.5625rem] font-extrabold text-gold-deep shadow-sm backdrop-blur-md">
            <span aria-hidden="true">●</span>
            Bán chạy
          </span>
        ) : null}
        <span className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-ink/12 text-white backdrop-blur-sm" title="Yêu thích" aria-hidden="true">
          <Heart size={21} weight="regular" />
        </span>
        <Image
          src={product.thumbnail}
          alt={productName}
          fill
          unoptimized
          sizes="(max-width: 767px) 50vw, (max-width: 1080px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
        />
      </a>

      <div className="flex flex-1 flex-col p-4 max-md:p-3">
        <p className="m-0 flex min-w-0 items-center gap-2 text-[0.625rem] font-semibold text-muted max-md:text-[0.5625rem]">
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-gold-pale font-serif text-[0.5625rem] font-bold text-gold-deep" aria-hidden="true">
            {cleanDisplayText(product.shopName).charAt(0)}
          </span>
          <span className="truncate">{cleanDisplayText(product.shopName)}</span>
        </p>

        <h3 className="mt-2 line-clamp-2 min-h-10 font-serif text-[1.125rem] font-semibold leading-[1.12] tracking-tight max-md:min-h-[2.2rem] max-md:text-[0.9375rem]">
          <a className="transition-colors hover:text-gold-deep" href={productUrl} target="_blank" rel="noreferrer">
            {productName}
          </a>
        </h3>

        <strong className="mt-1.5 text-sm tabular-nums text-gold-deep max-md:text-xs">
          {product.minPrice > 0 ? `${formatPrice(product.minPrice)}đ` : "Liên hệ báo giá"}
        </strong>

        <div className="mt-auto flex min-h-8 flex-wrap items-end gap-x-3 gap-y-2 pt-3 text-[0.5625rem] font-semibold text-muted max-md:gap-x-2 max-md:text-[0.5rem]">
          {product.rating > 0 ? (
            <span className="inline-flex items-center gap-1 text-ink">
              <Star className="text-gold-deep" size={13} weight="fill" aria-hidden="true" />
              {product.rating.toFixed(1)}{product.reviewCount > 0 ? ` (${product.reviewCount})` : ""}
            </span>
          ) : null}
          {location ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin size={13} aria-hidden="true" />
              <span className="truncate">{location}</span>
            </span>
          ) : null}
          {product.isExpressEligible ? (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-gold/55 px-2 py-1 font-bold text-gold-deep max-md:ml-0">
              <Lightning size={12} weight="fill" aria-hidden="true" />
              Giao nhanh
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

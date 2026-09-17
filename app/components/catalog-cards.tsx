"use client";

import Image from "next/image";
import { ArrowRight, ArrowUpRight, CheckCircle, Clock, Lightning, MapPin, Sparkle, Star } from "@phosphor-icons/react";
import type { Product, Shop } from "@/lib/catalog";

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

export function ProductCard({
  product,
  featured = false,
  badge,
}: {
  product: Product;
  featured?: boolean;
  badge?: string;
}) {
  return (
    <article className={`group relative min-w-0 overflow-visible pb-1.5 transition-transform duration-300 ease-out hover:-translate-y-1 ${featured ? "md:first:col-span-2 md:first:row-span-2" : ""}`}>
      <a
        className="relative block aspect-square overflow-hidden rounded-md border border-line/70 bg-gold-pale shadow-[inset_0_1px_rgba(255,255,255,0.58)]"
        href={`https://layerz.vn/product/${product.slug}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`Xem ${cleanDisplayText(product.name)}`}
      >
        {badge ? (
          <span className="absolute left-2.5 top-3 z-10 inline-flex items-center gap-1 border border-white/40 bg-linear-to-br from-sage to-sage-deep py-1.5 pl-2 pr-3 text-[0.5rem] font-extrabold uppercase tracking-[0.11em] text-white shadow-[0_0.5rem_1.125rem_rgba(63,95,60,0.22)] [clip-path:polygon(0_0,100%_0,calc(100%-6px)_50%,100%_100%,0_100%)] -rotate-1">
            <Sparkle size={10} weight="fill" aria-hidden="true" />
            {badge}
          </span>
        ) : null}
        <Image
          src={product.thumbnail}
          alt={cleanDisplayText(product.name)}
          fill
          unoptimized
          sizes={featured ? "(max-width: 767px) 100vw, 58vw" : "(max-width: 767px) 78vw, 320px"}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
        />
      </a>
      <div className="relative z-1 -mt-4 mx-2 rounded border border-line/70 bg-card/95 px-3 pb-3 pt-3 shadow-[0_0.75rem_1.75rem_rgba(91,65,38,0.09)] backdrop-blur-[0.625rem] transition duration-300 group-hover:border-gold-deep/60 group-hover:shadow-[0_1.0625rem_2.125rem_rgba(91,65,38,0.13)] max-md:-mt-3 max-md:mx-1.5 max-md:px-2 max-md:pb-2.5 max-md:pt-2.5">
        <div className="flex items-center justify-between gap-2.5 overflow-hidden whitespace-nowrap text-[0.5625rem] font-bold text-muted max-md:text-[0.625rem]">
          <span className="overflow-hidden text-ellipsis">{cleanDisplayText(product.shopName)}</span>
          {product.rating > 0 ? (
            <span className="inline-flex items-center gap-1 text-gold-deep">
              <Star size={14} weight="fill" aria-hidden="true" />
              {product.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <h3 className="mt-1.5 line-clamp-2 min-h-[2.45rem] font-serif text-[1.0625rem] font-semibold leading-[1.14] tracking-tight max-md:min-h-9 max-md:text-[0.9375rem]">
          <a className="transition-colors hover:text-gold-deep" href={`https://layerz.vn/product/${product.slug}`} target="_blank" rel="noreferrer">
            {cleanDisplayText(product.name)}
          </a>
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <strong className="text-[0.8125rem] tabular-nums text-ink max-md:text-xs">
            {product.minPrice > 0 ? `Từ ${formatPrice(product.minPrice)}đ` : "Liên hệ báo giá"}
          </strong>
          <a
            className="grid size-7.25 place-items-center rounded-full border border-line bg-white transition hover:border-gold focus-visible:outline-3 focus-visible:outline-gold/50 focus-visible:outline-offset-2"
            href={`https://layerz.vn/product/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Mở sản phẩm"
          >
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
        {product.isExpressEligible || product.preparationTimeHours ? (
          <p className="mt-1.5 flex min-h-4.5 items-center gap-1 text-[0.5625rem] font-semibold text-muted [&_svg]:text-gold-deep">
            {product.isExpressEligible ? (
              <><Lightning size={13} weight="fill" aria-hidden="true" /> Hỗ trợ đơn nhanh</>
            ) : (
              <><Clock size={13} aria-hidden="true" /> Đặt trước {product.preparationTimeHours} giờ</>
            )}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function ShopCard({ shop, href }: { shop: Shop; href?: string }) {
  const location = shop.district || shop.province;
  const shopUrl = href ?? `https://layerz.vn/artisan/${shop.slug}`;
  const externalLinkProps = shopUrl.startsWith("http")
    ? { target: "_blank", rel: "noreferrer" }
    : {};

  return (
    <article className="group relative flex min-h-full min-w-0 flex-col overflow-hidden rounded-[0.625rem] border border-line bg-card shadow-[0_0.625rem_1.875rem_rgba(91,65,38,0.055)] transition duration-300 hover:-translate-y-1 hover:border-gold/70 hover:shadow-[0_1.125rem_2.625rem_rgba(91,65,38,0.1)] max-md:grid max-md:grid-cols-[40%_minmax(0,1fr)]">
      <a
        className="relative block aspect-3/2 overflow-hidden bg-gold-pale max-md:h-full max-md:min-h-40 max-md:aspect-auto"
        href={shopUrl}
        {...externalLinkProps}
        aria-label={`Xem ${cleanDisplayText(shop.name)}`}
      >
        <Image
          src={shop.bannerUrl || shop.avatarUrl}
          alt={`Không gian bánh của ${cleanDisplayText(shop.name)}`}
          fill
          unoptimized
          sizes="(max-width: 767px) 92vw, 45vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
        />
        {shop.isVerified ? (
          <span className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-lg border border-white/70 bg-card/95 px-3 py-2 text-[0.5625rem] font-extrabold uppercase tracking-[0.04em] text-sage-deep shadow-[0_0.5rem_1.25rem_rgba(63,95,60,0.09)] backdrop-blur-md max-md:right-1.5 max-md:top-1.5 max-md:px-2 max-md:py-1.5 max-md:text-[0.45rem]" title="Đã xác minh">
            <CheckCircle size={14} weight="fill" aria-hidden="true" />
            Tiệm xác minh
          </span>
        ) : null}
      </a>
      <div className="flex flex-1 flex-col p-4.5 max-md:p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="m-0 font-serif text-[clamp(1.25rem,1.6vw,1.5625rem)] font-semibold leading-[1.05] tracking-[-0.03em]">{cleanDisplayText(shop.name)}</h3>
            <p className="mb-0 mt-2 flex items-center gap-1.5 text-[0.6875rem] font-bold text-gold-deep">
              <MapPin size={16} aria-hidden="true" />
              {cleanDisplayText(location)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-y-2 border-t border-line pt-3 text-[0.625rem] font-bold text-muted max-md:mt-3 max-md:text-[0.5625rem] [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1 [&>span]:px-3 [&>span:first-child]:pl-0 [&>span+span]:border-l [&>span+span]:border-line">
          <span className={shop.rating > 0 ? "text-gold-deep" : "rounded-full! border-0! bg-gold-pale px-3! py-1.5 text-gold-deep"}>
            {shop.rating > 0 ? (
              <>{shop.rating.toFixed(1)} <Star size={12} weight="fill" aria-hidden="true" /></>
            ) : "Tiệm mới"}
          </span>
          <span>{shop.acceptsCustomOrders ? "Nhận custom" : "Bánh có sẵn"}</span>
          {shop.totalOrders > 0 ? <span>{shop.totalOrders} đơn</span> : null}
        </div>
        <div className="mt-auto flex items-center justify-between gap-4 pt-4">
          <a className="inline-flex items-center gap-2.5 text-xs font-extrabold transition-all hover:gap-3.5 hover:text-gold-deep" href={shopUrl} {...externalLinkProps}>
            Xem tiệm <ArrowRight size={18} aria-hidden="true" />
          </a>
          <a
            className="grid size-10.5 shrink-0 place-items-center rounded-full border border-gold-deep/60 bg-white/55 transition hover:-translate-y-0.5 hover:translate-x-0.5 hover:bg-white focus-visible:outline-3 focus-visible:outline-gold/50 focus-visible:outline-offset-2"
            href={shopUrl}
            {...externalLinkProps}
            aria-label={`Mở trang ${cleanDisplayText(shop.name)}`}
          >
            <ArrowUpRight size={19} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

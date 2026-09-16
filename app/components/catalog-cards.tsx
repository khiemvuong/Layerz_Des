"use client";

import Image from "next/image";
import { ArrowUpRight, CheckCircle, MapPin, Sparkle, Star } from "@phosphor-icons/react";
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
    <article className={`product-card ${featured ? "product-card-featured" : ""}`}>
      <a
        className="product-image-wrap"
        href={`https://layerz.vn/product/${product.slug}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`Xem ${cleanDisplayText(product.name)}`}
      >
        {badge ? (
          <span className="product-badge">
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
          className="product-image"
        />
      </a>
      <div className="product-copy">
        <div className="product-meta">
          <span>{cleanDisplayText(product.shopName)}</span>
          {product.rating > 0 ? (
            <span className="rating">
              <Star size={14} weight="fill" aria-hidden="true" />
              {product.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <h3>
          <a href={`https://layerz.vn/product/${product.slug}`} target="_blank" rel="noreferrer">
            {cleanDisplayText(product.name)}
          </a>
        </h3>
        <div className="product-price-row">
          <strong>
            {product.minPrice > 0 ? `Từ ${formatPrice(product.minPrice)}đ` : "Liên hệ báo giá"}
          </strong>
          <a
            className="round-link"
            href={`https://layerz.vn/product/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Mở sản phẩm"
          >
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

export function ShopCard({ shop }: { shop: Shop }) {
  const location = shop.district || shop.province;

  return (
    <article className="shop-card">
      <a
        className="shop-banner"
        href={`https://layerz.vn/artisan/${shop.slug}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`Xem ${cleanDisplayText(shop.name)}`}
      >
        <Image
          src={shop.bannerUrl || shop.avatarUrl}
          alt={`Không gian bánh của ${cleanDisplayText(shop.name)}`}
          fill
          unoptimized
          sizes="(max-width: 767px) 92vw, 45vw"
          className="shop-banner-image"
        />
        {shop.isVerified ? (
          <span className="shop-verified-badge" title="Đã xác minh">
            <CheckCircle size={14} weight="fill" aria-hidden="true" />
            Tiệm xác minh
          </span>
        ) : null}
      </a>
      <div className="shop-copy">
        <div className="shop-title-row">
          <div>
            <h3>{cleanDisplayText(shop.name)}</h3>
            <p className="shop-location">
              <MapPin size={16} aria-hidden="true" />
              {cleanDisplayText(location)}
            </p>
          </div>
        </div>
        <p className="shop-description">
          {cleanDisplayText(
            shop.description || "Nhận làm bánh theo mẫu và ý tưởng riêng cho từng dịp.",
          )}
        </p>
        <div className="shop-stats">
          <span>{shop.rating > 0 ? `${shop.rating.toFixed(1)} ★` : "Tiệm mới"}</span>
          <span>{shop.acceptsCustomOrders ? "Nhận custom" : "Bánh có sẵn"}</span>
          {shop.totalOrders > 0 ? <span>{shop.totalOrders} đơn</span> : null}
        </div>
      </div>
    </article>
  );
}

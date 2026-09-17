"use client";

import Image from "next/image";
import {
  ArrowRight,
  Cake,
  CurrencyCircleDollar,
  Gift,
  Heart,
  Lightning,
  MagnifyingGlass,
  MapPin,
  PaintBrush,
  SealCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkle,
  Storefront,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { HomeCatalog, Product } from "@/lib/catalog";
import { ProductCard, ShopCard } from "./catalog-cards";
import { LocationModal } from "./location-modal";

type SavedLocation = {
  province: string;
  district: string;
  otherLocation: string;
  notificationOptIn?: boolean;
};

const LOCATION_STORAGE_KEY = "layerz-preferred-location";
const pageWidth = "mx-auto w-[min(calc(100%_-_3rem),80rem)] max-md:w-[min(calc(100%_-_1.75rem),80rem)]";
const brandClass = "w-fit font-serif text-[1.8125rem] font-bold leading-none tracking-[-0.055em] [&_span]:text-gold-deep max-md:text-[1.625rem]";
const eyebrowClass = "m-0 text-[0.625rem] font-extrabold uppercase tracking-[0.16em] text-gold-deep";
const sectionLinkClass = "inline-flex items-center gap-2 border-b border-current pb-1 text-[0.6875rem] font-extrabold transition-all hover:gap-2.5 hover:text-gold-deep";
const primaryButtonClass = "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent bg-gradient-to-br from-[#e3b24c] to-[#b9821e] px-[1.125rem] text-xs font-extrabold text-[#2f261e] shadow-[0_0.625rem_1.625rem_rgba(185,130,30,0.2)] transition hover:-translate-y-px hover:shadow-[0_0.8125rem_2rem_rgba(185,130,30,0.3)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";
const sectionHeadingClass = "flex items-end justify-between gap-8 max-md:gap-4";
const titleLockupClass = "relative grid min-w-0 grid-cols-[2.6875rem_minmax(0,1fr)] items-start gap-3.5 max-md:grid-cols-[2.125rem_minmax(0,1fr)] max-md:gap-2.5";
const sectionIndexClass = "grid size-[2.6875rem] place-items-center border-r border-gold-deep/50 font-serif text-[1.3125rem] italic leading-none text-muted/60 tabular-nums max-md:h-9 max-md:w-[2.125rem] max-md:text-[1.0625rem]";
const sectionTitleClass = "mt-2 text-balance font-serif text-[clamp(1.9375rem,3.3vw,2.8125rem)] font-semibold leading-[1.05] tracking-[-0.035em] [&_em]:font-medium [&_em]:text-gold-deep max-md:text-[2.125rem]";
const sectionNoteClass = "mt-2.5 max-w-[33.75rem] text-[0.625rem] leading-[1.55] text-muted max-md:text-[0.625rem]";
const emptyStateClass = "grid min-h-[16.25rem] place-items-center content-center gap-2.5 border border-dashed border-line text-center text-muted [&_h3]:font-serif [&_h3]:text-[1.75rem] [&_h3]:font-semibold [&_h3]:tracking-[-0.035em] [&_h3]:text-ink [&_p]:m-0 [&_p]:max-w-[32.5rem] [&_p]:text-xs";

const occasions = [
  { label: "Sinh nhật", description: "Cho một tuổi mới thật riêng", param: "birthday" },
  { label: "Bento", description: "Nhỏ xinh, vừa đủ niềm vui", param: "bento" },
  { label: "Kỷ niệm", description: "Đánh dấu câu chuyện của hai người", param: "anniversary" },
  { label: "Cho bé", description: "Màu sắc và nhân vật bé yêu", param: "kids" },
  { label: "Tặng người yêu", description: "Một lời nhắn ngọt ngào", param: "lover" },
  { label: "Khai trương", description: "Chúc một khởi đầu hanh thông", param: "opening" },
];

const quickFilters = [
  { label: "Giao nhanh", params: { express: "1" }, icon: Lightning },
  { label: "Dưới 300K", params: { maxPrice: "300000" }, icon: CurrencyCircleDollar },
  { label: "Bento", params: { category: "bento" }, icon: Gift },
  { label: "Sinh nhật", params: { occasion: "birthday" }, icon: Cake },
  { label: "Mới nhất", params: { sort: "newest" }, icon: Sparkle },
  { label: "Bánh custom", params: { q: "bánh custom" }, icon: PaintBrush },
];

function productUrl(product: Product) {
  return `https://layerz.vn/product/${product.slug}`;
}

function formatSyncDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function uniqueProducts(products: Product[]) {
  return products.filter(
    (product, index, list) => list.findIndex((item) => item.id === product.id) === index,
  );
}

function productsUrl(params: Record<string, string | null | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const queryString = query.toString();
  return queryString ? `/products?${queryString}` : "/products";
}

export function HomeExperience({ initialCatalog }: { initialCatalog: HomeCatalog }) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [modalOpen, setModalOpen] = useState(false);
  const [draftProvince, setDraftProvince] = useState(initialCatalog.selection.province);
  const [draftDistrict, setDraftDistrict] = useState(initialCatalog.selection.district ?? "");
  const [otherLocation, setOtherLocation] = useState("");
  const [notificationOptIn, setNotificationOptIn] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(initialCatalog.selection.label);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async (province: string, district: string) => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({ province });
      if (district) query.set("district", district);
      const response = await fetch(`/api/catalog?${query}`);
      if (!response.ok) throw new Error("Không thể tải danh sách bánh.");
      setCatalog((await response.json()) as HomeCatalog);
    } catch {
      setError("Danh sách bánh chưa thể cập nhật. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedValue = window.localStorage.getItem(LOCATION_STORAGE_KEY);
      if (!savedValue) {
        setModalOpen(true);
        return;
      }

      try {
        const saved = JSON.parse(savedValue) as SavedLocation;
        setDraftProvince(saved.province);
        setDraftDistrict(saved.district);
        setOtherLocation(saved.otherLocation);
        setNotificationOptIn(Boolean(saved.notificationOptIn));
        setDisplayLocation(saved.otherLocation || saved.district || saved.province);
        void loadCatalog(saved.province, saved.district);
      } catch {
        window.localStorage.removeItem(LOCATION_STORAGE_KEY);
        setModalOpen(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCatalog]);

  function openLocationModal() {
    setModalOpen(true);
  }

  async function confirmLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstVisit = !window.localStorage.getItem(LOCATION_STORAGE_KEY);
    const selected = catalog.locations.find((item) => item.province === draftProvince);
    const nextDisplayLocation =
      otherLocation.trim() ||
      (selected?.requiresDistrict ? draftDistrict : selected?.label) ||
      draftProvince;
    const saved = {
      province: draftProvince,
      district: draftDistrict,
      otherLocation: otherLocation.trim(),
      notificationOptIn,
    };

    window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(saved));
    setDisplayLocation(nextDisplayLocation);
    setModalOpen(false);
    await loadCatalog(draftProvince, draftDistrict);

    void fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...saved,
        source: firstVisit ? "first_visit" : "location_change",
      }),
    });
  }

  const promoProducts = catalog.featuredProducts.slice(0, 2);
  const discoveryProducts = uniqueProducts([
    ...catalog.featuredProducts,
    ...catalog.newProducts,
    ...catalog.expressProducts,
  ]).slice(0, 6);
  const customCakeProduct = discoveryProducts[0];
  const nearbyShops = catalog.shops
    .filter((shop) => shop.province === catalog.selection.province)
    .filter((shop) => !catalog.selection.district || shop.district === catalog.selection.district)
    .slice(0, 3);
  const locationParams = {
    region: catalog.selection.province,
    district: catalog.selection.district,
  };
  const allProductsUrl = productsUrl(locationParams);

  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="fixed left-1/2 top-3 z-40 grid h-14.5 w-[min(calc(100%-4rem),98rem)] animate-[header-enter_620ms_cubic-bezier(0.16,1,0.3,1)_both] grid-cols-[1fr_auto_1fr] items-center rounded-[0.875rem] border border-line/90 bg-card/90 px-4.5 shadow-[0_0.875rem_2.625rem_rgba(91,65,38,0.1),inset_0_1px_rgba(255,255,255,0.72)] backdrop-blur-xl max-[1080px]:w-[min(calc(100%-2rem),80rem)] max-md:top-2 max-md:h-13.5 max-md:w-[calc(100%-1rem)] max-md:grid-cols-[auto_1fr] max-md:px-3 motion-reduce:animate-none motion-reduce:backdrop-blur-none">
        <a className={brandClass} href="#top" aria-label="LayerZ trang chủ">
          LayerZ<span>.</span>
        </a>
        <nav className="flex items-center gap-5.5 text-xs font-bold text-muted max-md:hidden [&_a]:relative [&_a]:py-5 [&_a]:transition-colors [&_a]:after:absolute [&_a]:after:inset-x-0 [&_a]:after:bottom-3.25 [&_a]:after:h-px [&_a]:after:origin-right [&_a]:after:scale-x-0 [&_a]:after:bg-gold-deep [&_a]:after:transition-transform [&_a:hover]:text-gold-deep [&_a:hover]:after:origin-left [&_a:hover]:after:scale-x-100 [&_a:focus-visible]:after:origin-left [&_a:focus-visible]:after:scale-x-100" aria-label="Điều hướng chính">
          <a href="#occasions">Chọn theo dịp</a>
          <a href="#suggested">Bánh dành cho bạn</a>
          <a href="#artisans">Tiệm bánh</a>
          <a href="#new">Bánh mới</a>
          <a href="#design-your-cake">Tự thiết kế</a>
        </nav>
        <div className="flex items-center justify-self-end gap-2 max-md:min-w-0">
          <button className="inline-flex min-h-9.5 max-w-55 cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-card px-3.5 text-xs font-bold text-ink transition hover:border-gold hover:bg-white active:translate-y-px max-md:min-h-9 max-md:max-w-[min(53vw,11.875rem)] max-md:px-2.5 [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap" type="button" onClick={openLocationModal}>
            <MapPin size={17} weight="duotone" aria-hidden="true" />
            <span>{displayLocation}</span>
          </button>
          <a className="inline-flex size-9.5 min-h-9.5 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-ink transition hover:border-gold hover:bg-white active:translate-y-px max-md:size-9 max-md:min-h-9" href="https://layerz.vn/cart" aria-label="Giỏ hàng">
            <ShoppingBag size={19} aria-hidden="true" />
          </a>
        </div>
      </header>

      <main className="pt-15 max-md:pt-17.5" id="main-content">
        <section className="mx-auto grid h-[min(46.875rem,calc(100dvh-7rem))] min-h-162.5 w-[min(calc(100%-4rem),98rem)] grid-cols-[minmax(0,2.05fr)_minmax(17.5rem,0.78fr)] gap-3.5 pt-6.5 max-[1080px]:w-[min(calc(100%-3rem),80rem)] max-[1080px]:grid-cols-[minmax(0,1.8fr)_minmax(15rem,0.72fr)] max-md:h-auto max-md:min-h-0 max-md:w-[min(calc(100%-1.75rem),80rem)] max-md:grid-cols-1 max-md:pt-3.5" id="top" aria-labelledby="hero-title">
          <div className="relative isolate min-w-0 overflow-hidden rounded-[0.625rem] bg-cream max-md:min-h-156.25">
            <Image
              src="/images/hero-cake.png"
              alt="Bánh kem thủ công màu ivory với hoa và chi tiết vàng champagne"
              fill
              priority
              sizes="(max-width: 767px) 100vw, 68vw"
              className="-z-20 animate-[hero-settle_1.1s_cubic-bezier(0.16,1,0.3,1)_both] object-cover object-[66%_center] transition-transform duration-700 ease-out motion-reduce:animate-none"
            />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(248,241,232,0.99)_0%,rgba(248,241,232,0.94)_35%,rgba(248,241,232,0.2)_72%)] max-md:bg-[linear-gradient(90deg,rgba(248,241,232,0.98)_0%,rgba(248,241,232,0.88)_62%,rgba(248,241,232,0.28)_100%)]" />
            <div className="flex h-full w-[min(66%,40rem)] flex-col items-start justify-center px-11.5 pb-28 pt-11.5 max-[1080px]:w-[73%] max-[1080px]:px-9 max-[1080px]:pb-27 max-[1080px]:pt-9 max-md:w-full max-md:justify-end max-md:px-5.5 max-md:py-7.5">
              <p className={`${eyebrowClass} flex items-center gap-3.5 before:h-px before:w-10.75 before:bg-gold-deep`}>Bánh được làm riêng cho bạn</p>
              <h1 className="mt-3.5 max-w-150 text-balance font-serif text-[clamp(2.8125rem,4.7vw,4.1875rem)] font-semibold leading-[0.98] tracking-[-0.045em] max-md:max-w-110 max-md:text-[clamp(2.625rem,12vw,3.5rem)]" id="hero-title">Tìm chiếc bánh đúng với dịp của bạn.</h1>
              <p className="mt-4.5 max-w-125 text-pretty text-sm leading-[1.65] text-muted max-md:max-w-97.5 max-md:text-[0.8125rem]">
                Khám phá tiệm gần {displayLocation} và những mẫu bánh được LayerZ tuyển chọn.
              </p>
              <form className="mt-6 grid min-h-14 w-[min(100%,37.5rem)] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 border border-gold-deep/40 bg-white/90 py-1 pl-4 pr-1 shadow-[0_0.75rem_2.125rem_rgba(91,65,38,0.09)] [&>svg]:text-gold-deep max-md:mt-5 max-md:min-h-12.5" action="/products" method="get">
                <MagnifyingGlass size={19} aria-hidden="true" />
                <input
                  type="search"
                  name="q"
                  className="min-w-0 border-0 bg-transparent text-xs text-ink outline-none placeholder:text-faint"
                  aria-label="Tìm kiếm bánh"
                  placeholder="Tìm bento, bánh sinh nhật, tiramisu..."
                />
                <input type="hidden" name="region" value={catalog.selection.province} />
                {catalog.selection.district ? (
                  <input type="hidden" name="district" value={catalog.selection.district} />
                ) : null}
                <button className="self-stretch border-0 bg-ink px-7 text-[0.6875rem] font-extrabold text-white transition hover:bg-gold-deep active:translate-y-px max-md:px-3" type="submit">Tìm bánh</button>
              </form>
              <div className="mt-5 flex flex-wrap items-center gap-5 max-md:flex-nowrap max-md:gap-3.5">
                <button className={`${primaryButtonClass} min-h-12 px-5.5 max-md:min-h-11 max-md:px-3.5 max-md:text-[0.6875rem]`} type="button" onClick={openLocationModal}>
                  <MapPin size={18} aria-hidden="true" />
                  Đổi khu vực
                </button>
                <a className="inline-flex min-h-11 shrink-0 items-center gap-2.5 border-l border-line pl-5.5 text-xs font-extrabold transition hover:text-gold-deep max-md:min-w-0 max-md:gap-1.5 max-md:pl-3 max-md:text-[0.625rem] [&_span]:border-b [&_span]:border-current [&_span]:pb-1 [&_span]:whitespace-nowrap [&_svg]:transition-transform hover:[&_svg]:translate-x-1" href="/designer">
                  <span>Thiết kế bánh riêng</span>
                  <ArrowRight size={21} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="absolute bottom-6 left-11.5 grid w-[min(calc(100%-5.75rem),41.25rem)] grid-cols-3 text-ink max-[1080px]:bottom-5.5 max-[1080px]:left-9 max-[1080px]:w-[calc(100%-4.5rem)] max-md:hidden [&_article]:grid [&_article]:min-w-0 [&_article]:grid-cols-[auto_minmax(0,1fr)] [&_article]:items-center [&_article]:gap-2.5 [&_article]:px-4 [&_article:first-child]:pl-0 [&_article+article]:border-l [&_article+article]:border-line [&_svg]:shrink-0 [&_svg]:text-gold-deep [&_strong]:block [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[0.6875rem] [&_strong]:font-extrabold [&_small]:mt-1 [&_small]:block [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[0.5625rem] [&_small]:leading-[1.35] [&_small]:text-muted" aria-label="Lợi ích khi chọn bánh tại LayerZ">
              <article>
                <Cake size={28} weight="duotone" aria-hidden="true" />
                <span><strong>Đa dạng mẫu bánh</strong><small>Cho mọi dịp đặc biệt</small></span>
              </article>
              <article>
                <ShieldCheck size={28} weight="duotone" aria-hidden="true" />
                <span><strong>Tiệm bánh uy tín</strong><small>Được LayerZ tuyển chọn</small></span>
              </article>
              <article>
                <Heart size={28} weight="duotone" aria-hidden="true" />
                <span><strong>Gửi trọn yêu thương</strong><small>Qua từng chiếc bánh</small></span>
              </article>
            </div>
          </div>

          <div className="grid min-w-0 grid-rows-2 gap-3.5 max-md:min-h-52.5 max-md:grid-cols-2 max-md:grid-rows-none" aria-label="Gợi ý nổi bật">
            {promoProducts.map((product, index) => (
              <a className="group/promo relative isolate overflow-hidden rounded-[0.625rem] bg-cream" href={productUrl(product)} key={product.id}>
                <Image
                  src={product.thumbnail}
                  alt={product.name}
                  fill
                  unoptimized
                  sizes="(max-width: 767px) 50vw, 30vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover/promo:scale-105"
                />
                <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_28%,rgba(58,49,40,0.74)_100%)]" />
                <span className="absolute inset-x-6 bottom-5.5 flex flex-col items-start text-white max-md:inset-x-3.5 max-md:bottom-3.5">
                  <small className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em]">{index === 0 ? "LayerZ chọn" : "Mới trong khu vực"}</small>
                  <strong className="mt-2 line-clamp-2 font-serif text-2xl leading-[1.05] max-md:text-lg">{product.name}</strong>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[0.625rem] font-extrabold">Xem mẫu <ArrowRight size={14} aria-hidden="true" /></span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className={`${pageWidth} py-11.5 pb-13 max-md:py-9.5 max-md:pb-11`} id="occasions" aria-labelledby="occasion-title">
          <div className="mb-5.5 flex items-end justify-between gap-7 max-md:mb-4.5 max-md:block">
            <div>
              <p className={eyebrowClass}>Bắt đầu từ khoảnh khắc</p>
              <h2 className="mt-2 max-w-190 text-balance font-serif text-[clamp(1.875rem,3.2vw,2.875rem)] font-semibold leading-[1.02] tracking-[-0.04em] [&_em]:font-medium [&_em]:text-gold-deep max-md:text-[2.125rem]" id="occasion-title">Chọn một dịp, <em>tìm đúng chiếc bánh.</em></h2>
            </div>
            <a className={`${sectionLinkClass} max-md:hidden`} href={allProductsUrl}>
              Xem mọi lựa chọn <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="grid grid-cols-6 gap-2.5 max-md:w-[calc(100vw-0.875rem)] max-md:auto-cols-[minmax(13.125rem,62vw)] max-md:grid-flow-col max-md:grid-cols-none max-md:overflow-x-auto max-md:pr-3.5 max-md:scrollbar-none max-md:snap-x max-md:snap-mandatory">
            {occasions.slice(0, discoveryProducts.length).map((occasion, index) => {
              const product = discoveryProducts[index];
              return (
                <a
                  className="group/occasion relative min-h-67.5 overflow-hidden rounded-[0.3125rem] text-white max-md:min-h-62.5 max-md:snap-start"
                  href={productsUrl({ ...locationParams, occasion: occasion.param })}
                  key={occasion.param}
                >
                  <Image className="object-cover transition-transform duration-500 ease-out group-hover/occasion:scale-[1.045]" src={product.thumbnail} alt="" fill unoptimized sizes="(max-width: 767px) 62vw, 18vw" />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_24%,rgba(42,33,25,0.82)_100%)]" />
                  <span className="absolute inset-x-4 bottom-4 grid gap-1.5">
                    <strong className="font-serif text-[1.4375rem] leading-none">{occasion.label}</strong>
                    <small className="min-h-7 text-[0.5625rem] leading-[1.45] text-white/75">{occasion.description}</small>
                    <ArrowRight className="mt-1 transition-transform group-hover/occasion:translate-x-1" size={18} aria-hidden="true" />
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        {error ? <div className={`${pageWidth} mt-6 border border-danger/25 bg-danger/5 px-4 py-3 text-xs text-danger`}>{error}</div> : null}

        <section className="border-y border-line/75 bg-cream bg-[url('/images/yellow-bg.png')] bg-cover bg-center bg-no-repeat py-15.5 pb-18 max-md:py-11.5 max-md:pb-13" id="suggested">
          <div className={pageWidth}>
            <div className={`${sectionHeadingClass} mb-7 max-md:mb-5.5`}>
              <div className={titleLockupClass}>
                <span className={sectionIndexClass} aria-hidden="true">01</span>
                <div>
                  <p className={eyebrowClass}>Ưu tiên theo khu vực</p>
                  <h2 className={sectionTitleClass}>Một tuyển tập riêng <em>cho {displayLocation}</em></h2>
                  <p className={sectionNoteClass}>Mỗi tiệm chỉ xuất hiện tối đa hai lần để bạn có nhiều lựa chọn hơn.</p>
                </div>
              </div>
              <a className={`${sectionLinkClass} max-md:hidden`} href={allProductsUrl}>
                Xem tất cả bánh <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            {catalog.featuredProducts.length ? (
              <div className={`grid grid-cols-4 gap-3.5 transition-opacity max-[1080px]:grid-cols-3 max-md:grid-cols-2 max-md:gap-2.5 ${loading ? "pointer-events-none opacity-40" : ""}`}>
                {catalog.featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className={emptyStateClass}>
                <Cake size={34} weight="duotone" aria-hidden="true" />
                <h3>Chưa có bánh phù hợp tại khu vực này</h3>
                <p>Thử đổi khu vực hoặc xem toàn bộ danh sách bánh trên LayerZ.</p>
              </div>
            )}
          </div>
        </section>

        <nav className={`${pageWidth} flex items-center gap-4.5 border-b border-line py-5.5 max-md:items-start max-md:gap-3 max-md:overflow-hidden max-md:py-4`} aria-label="Lọc nhanh danh sách bánh">
          <span className="shrink-0 font-serif text-lg italic max-md:pt-2.5 max-md:text-base">Tìm nhanh</span>
          <div className="flex gap-2 max-md:min-w-0 max-md:overflow-x-auto max-md:pb-1 max-md:scrollbar-none">
            {quickFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <a className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border border-line bg-white/35 px-3.5 text-[0.625rem] font-bold transition hover:-translate-y-0.5 hover:border-gold-deep hover:bg-white" href={productsUrl({ ...locationParams, ...filter.params })} key={filter.label}>
                  <Icon size={18} weight="duotone" aria-hidden="true" />
                  {filter.label}
                </a>
              );
            })}
          </div>
        </nav>

        <section className={`${pageWidth} mt-14 grid min-h-107.5 grid-cols-[minmax(18.75rem,0.8fr)_minmax(0,1.35fr)] overflow-hidden border border-line bg-cream max-md:mt-11.5 max-md:grid-cols-1`} id="design-your-cake">
          <div className="flex flex-col items-start justify-center p-10.5 max-md:px-5.5 max-md:py-8.5">
            <p className={eyebrowClass}>02 / Làm theo ý bạn</p>
            <h2 className="mt-2 max-w-120 text-balance font-serif text-[clamp(2.625rem,4.6vw,3.875rem)] font-semibold leading-[0.98] tracking-[-0.035em] max-md:text-[2.75rem]">Thiết kế chiếc bánh của riêng bạn.</h2>
            <p className="mb-6 mt-4 max-w-112.5 text-[0.8125rem] leading-[1.65] text-muted">Chọn mẫu, đổi màu, thêm chữ và trang trí. Xem trước thiết kế trước khi gửi yêu cầu đến tiệm.</p>
            <ol className="mb-6 flex flex-wrap gap-x-4.5 gap-y-2.5 p-0 text-[0.625rem] font-bold text-muted max-md:gap-x-2.5 [&_li]:flex [&_li]:items-center [&_li]:gap-2 [&_li+li]:before:mr-1.5 [&_li+li]:before:text-gold-deep [&_li+li]:before:content-['→'] [&_span]:text-gold-deep [&_span]:tabular-nums" aria-label="Ba bước thiết kế bánh">
              <li><span>01</span> Chọn mẫu</li>
              <li><span>02</span> Tùy chỉnh</li>
              <li><span>03</span> Gửi tiệm</li>
            </ol>
            <a className={primaryButtonClass} href="/designer">
              Bắt đầu thiết kế <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="relative min-h-107.5 overflow-hidden max-md:min-h-82.5">
            {customCakeProduct ? (
              <Image
                src={customCakeProduct.thumbnail}
                alt={`Mẫu ${customCakeProduct.name} dùng để minh họa tùy chỉnh bánh`}
                fill
                unoptimized
                sizes="(max-width: 767px) 100vw, 60vw"
                className="object-cover object-[72%_center] transition-transform duration-700 ease-out hover:scale-[1.025]"
              />
            ) : (
              <Cake className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gold-deep" size={80} weight="duotone" aria-hidden="true" />
            )}
            <div className="absolute bottom-6 right-6 z-2 w-[min(13.75rem,calc(100%-3rem))] rounded-lg border border-white/65 bg-card/90 p-4 shadow-[0_1.125rem_2.8125rem_rgba(58,49,40,0.16)] backdrop-blur-[0.875rem] max-md:bottom-3.5 max-md:right-3.5" aria-hidden="true">
              <span className="text-[0.5625rem] font-extrabold uppercase tracking-[0.08em] text-muted">Tông màu</span>
              <div className="my-2.5 flex gap-2 [&_i]:size-6 [&_i]:rounded-full [&_i]:border-2 [&_i]:border-white [&_i]:bg-[#f2d9c8] [&_i]:shadow-[0_0_0_1px_var(--line)] [&_i:nth-child(2)]:bg-[#d7c69e] [&_i:nth-child(3)]:bg-[#c9d2be] [&_i:nth-child(4)]:bg-[#e2c1c1]"><i /><i /><i /><i /></div>
              <small className="block border border-line bg-white/70 px-2.5 py-2 font-serif text-xs">“Lời nhắn trên bánh”</small>
            </div>
          </div>
        </section>

        <section className="mx-auto w-[min(calc(100%-4rem),98rem)] py-15.5 pb-18 max-[1080px]:w-[min(calc(100%-3rem),80rem)] max-md:w-[min(calc(100%-1.75rem),80rem)] max-md:py-11.5 max-md:pb-13" id="artisans">
          <div className={`${sectionHeadingClass} mb-7 max-md:mb-5.5`}>
            <div className={titleLockupClass}>
              <span className={sectionIndexClass} aria-hidden="true">03</span>
              <div>
                <p className={eyebrowClass}>Khám phá quanh bạn</p>
                <h2 className={sectionTitleClass}>Tiệm bánh đáng ghé <em>tại {displayLocation}</em></h2>
                <p className={sectionNoteClass}>Chỉ hiển thị tiệm có dữ liệu đúng khu vực bạn đã chọn.</p>
              </div>
            </div>
            <a className={`${sectionLinkClass} max-md:hidden`} href={allProductsUrl}>
              Xem bánh theo tiệm <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          {nearbyShops.length ? (
            <div className={`grid grid-cols-3 items-stretch gap-4 transition-opacity max-[1080px]:grid-cols-2 max-md:grid-cols-1 ${loading ? "pointer-events-none opacity-40" : ""}`}>
              {nearbyShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} href={productsUrl({ shopId: shop.id })} />
              ))}
            </div>
          ) : (
            <div className={`${emptyStateClass} min-h-52.5`}>
              <Storefront size={30} weight="duotone" aria-hidden="true" />
              <h3>Chưa có tiệm tại khu vực này</h3>
              <p>Bạn vẫn có thể xem bánh từ các tiệm khác trên LayerZ.</p>
            </div>
          )}
        </section>

        <section className="grid min-h-dvh items-center border-y border-sage/30 bg-sage-pale bg-[url('/images/green-bg.png')] bg-cover bg-center bg-no-repeat py-15.5 pb-18 max-md:block max-md:min-h-0 max-md:py-11.5 max-md:pb-13" id="new">
          <div className={pageWidth}>
            <div className={`${sectionHeadingClass} mb-7 max-md:mb-5.5`}>
              <div className={titleLockupClass}>
                <span className={`${sectionIndexClass} border-sage/40 text-sage`} aria-hidden="true">04</span>
                <div>
                  <p className={`${eyebrowClass} flex items-center gap-1.5 text-sage`}><Sparkle size={15} weight="fill" aria-hidden="true" /> Vừa cập nhật tại {displayLocation}</p>
                  <h2 className={`${sectionTitleClass} text-sage-deep [&_em]:text-sage`}>Vừa lên kệ, <em>đang chờ bạn chọn.</em></h2>
                  <p className={sectionNoteClass}>Các mẫu mới chưa xuất hiện trong tuyển tập phía trên.</p>
                </div>
              </div>
              <a className={`${sectionLinkClass} text-sage max-md:hidden`} href={productsUrl({ ...locationParams, sort: "newest" })}>
                Xem tất cả <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div className={`grid grid-cols-4 gap-3.5 transition-opacity max-[1080px]:grid-cols-3 max-md:grid-cols-2 max-md:gap-2.5 ${loading ? "pointer-events-none opacity-40" : ""}`}>
              {catalog.newProducts.map((product) => (
                <ProductCard key={product.id} product={product} badge="Mới lên" />
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-card py-7.5">
          <div className={`${pageWidth} grid grid-cols-4 max-[1080px]:grid-cols-2 max-md:grid-cols-1 [&_article]:grid [&_article]:min-w-0 [&_article]:grid-cols-[auto_minmax(0,1fr)] [&_article]:items-center [&_article]:gap-3 [&_article]:px-6 [&_article]:py-2 [&_article+article]:border-l [&_article+article]:border-line max-[1080px]:[&_article:nth-child(3)]:border-l-0 max-[1080px]:[&_article:nth-child(n+3)]:mt-4.5 max-md:[&_article]:px-1 max-md:[&_article]:py-3 max-md:[&_article+article]:mt-0 max-md:[&_article+article]:border-l-0 max-md:[&_article+article]:border-t max-md:[&_article:nth-child(3)]:border-t [&_article>span]:text-gold-deep [&_strong]:block [&_strong]:text-[0.6875rem] [&_p]:mb-0 [&_p]:mt-1 [&_p]:text-[0.5625rem] [&_p]:leading-[1.45] [&_p]:text-muted`}>
            <article>
              <span><MapPin size={23} weight="duotone" aria-hidden="true" /></span>
              <div><strong>Chọn khu vực</strong><p>Ưu tiên tiệm gần nơi bạn nhận bánh.</p></div>
            </article>
            <article>
              <span><Storefront size={23} weight="duotone" aria-hidden="true" /></span>
              <div><strong>Tiệm thật, mẫu thật</strong><p>Xem trực tiếp sản phẩm của từng nghệ nhân.</p></div>
            </article>
            <article>
              <span><PaintBrush size={23} weight="duotone" aria-hidden="true" /></span>
              <div><strong>Nhận làm theo ý tưởng</strong><p>Gửi yêu cầu riêng khi chưa thấy mẫu phù hợp.</p></div>
            </article>
            <article>
              <span><SealCheck size={23} weight="duotone" aria-hidden="true" /></span>
              <div><strong>Đặt qua LayerZ</strong><p>Một luồng rõ ràng từ chọn bánh đến liên hệ tiệm.</p></div>
            </article>
          </div>
        </section>
      </main>

      <footer className="bg-cream py-14">
        <div className={`${pageWidth} grid grid-cols-[1.25fr_1fr_1fr] items-end gap-11 max-md:grid-cols-1 max-md:items-start max-md:gap-6`}>
          <div>
            <a className={`${brandClass} mb-3 block`} href="#top">LayerZ<span>.</span></a>
            <p className="m-0 max-w-100 text-[0.625rem] leading-relaxed text-muted">Bánh thủ công, được chọn theo nơi bạn sống và cách bạn muốn kỷ niệm.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[0.6875rem] font-bold [&_a]:transition-colors [&_a:hover]:text-gold-deep">
            <a href="/products">Mua bánh</a>
            <a href="#artisans">Tiệm bánh</a>
            <a href="/designer">Thiết kế 3D</a>
            <a href="https://layerz.vn/contact">Liên hệ</a>
          </div>
          <div className="justify-self-end text-right max-md:justify-self-start max-md:text-left [&_p]:m-0 [&_p]:max-w-100 [&_p]:text-[0.625rem] [&_p]:leading-relaxed [&_p]:text-muted [&_p+p]:mt-2 [&_a]:transition-colors [&_a:hover]:text-gold-deep">
            <p>Dữ liệu đồng bộ ngày {formatSyncDate(catalog.scrapedAt)}.</p>
            <p><a href="https://layerz.vn/terms">Điều khoản</a> · <a href="https://layerz.vn/privacy">Quyền riêng tư</a></p>
          </div>
        </div>
      </footer>

      <LocationModal
        open={modalOpen}
        locations={catalog.locations}
        province={draftProvince}
        district={draftDistrict}
        otherLocation={otherLocation}
        notificationOptIn={notificationOptIn}
        onProvinceChange={(province, district) => {
          setDraftProvince(province);
          setDraftDistrict(district);
          if (province !== "Khác") {
            setOtherLocation("");
            setNotificationOptIn(false);
          }
        }}
        onDistrictChange={setDraftDistrict}
        onOtherLocationChange={setOtherLocation}
        onNotificationOptInChange={setNotificationOptIn}
        onClose={() => setModalOpen(false)}
        onSubmit={confirmLocation}
      />
    </div>
  );
}

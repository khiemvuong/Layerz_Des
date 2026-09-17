import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Cake,
  MagnifyingGlass,
  MapPin,
  SlidersHorizontal,
  Star,
} from "@phosphor-icons/react/dist/ssr";
import { ProductCard } from "@/app/components/catalog-cards";
import { getProductsCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Tất cả bánh | LayerZ",
  description: "Tìm, lọc và so sánh bánh thật từ các tiệm đang có trên LayerZ.",
};

type RawSearchParams = Record<string, string | string[] | undefined>;
type ResultsView = "products" | "shops";
type SortOption = { value: string; label: string };
const pageWidth = "mx-auto w-[min(calc(100%_-_3rem),80rem)] max-md:w-[min(calc(100%_-_1.75rem),80rem)]";
const brandClass = "w-fit font-serif text-[1.8125rem] font-bold leading-none tracking-[-0.055em] [&_span]:text-gold-deep max-md:text-[1.625rem]";
const eyebrowClass = "m-0 text-[0.625rem] font-extrabold uppercase tracking-[0.16em] text-gold-deep";
const filterTriggerClass = "inline-flex min-h-10 cursor-pointer list-none items-center gap-2 whitespace-nowrap rounded-full border border-line bg-white/45 px-3.5 text-[0.625rem] font-extrabold text-ink transition hover:border-gold-deep hover:bg-gold-pale active:translate-y-px [&::-webkit-details-marker]:hidden";
const filterMenuClass = "absolute left-0 top-[calc(100%_+_0.5rem)] z-20 grid max-h-[min(31.25rem,calc(100dvh_-_8rem))] min-w-48 gap-1 overflow-y-auto rounded-xl border border-line bg-card p-2 shadow-[0_1.125rem_2.75rem_rgba(91,65,38,0.14)] [&_a]:flex [&_a]:min-h-9 [&_a]:items-center [&_a]:justify-between [&_a]:gap-4 [&_a]:rounded-lg [&_a]:px-3 [&_a]:text-[0.625rem] [&_a]:font-bold [&_a]:transition [&_a:hover]:bg-gold-pale";
const productSortOptions: SortOption[] = [
  { value: "relevant", label: "Phù hợp nhất" },
  { value: "popular", label: "Bán chạy" },
  { value: "newest", label: "Mới nhất" },
  { value: "price-asc", label: "Giá thấp → cao" },
  { value: "price-desc", label: "Giá cao → thấp" },
];
const shopSortOptions: SortOption[] = [
  { value: "relevant", label: "Phù hợp nhất" },
  { value: "nearest", label: "Gần khu vực chọn" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "matches", label: "Nhiều bánh phù hợp" },
];

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function compactPrice(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  if (amount >= 1_000_000) return `${amount / 1_000_000} triệu`;
  return `${Math.round(amount / 1_000)}K`;
}

function productsHref(
  current: RawSearchParams,
  changes: Record<string, string | null | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(current)) {
    const value = firstValue(rawValue);
    if (value) query.set(key, value);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value) query.set(key, value);
    else query.delete(key);
  }
  const queryString = query.toString();
  return queryString ? `/products?${queryString}` : "/products";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const rawParams = await searchParams;
  const q = firstValue(rawParams.q);
  const region = firstValue(rawParams.region);
  const district = firstValue(rawParams.district);
  const category = firstValue(rawParams.category);
  const occasion = firstValue(rawParams.occasion);
  const shopId = firstValue(rawParams.shopId);
  const minPrice = firstValue(rawParams.minPrice);
  const maxPrice = firstValue(rawParams.maxPrice);
  const requestedSort = firstValue(rawParams.sort);
  const requestedView = firstValue(rawParams.view);
  const express = firstValue(rawParams.express) === "1";
  const productSortValues = new Set(productSortOptions.map((option) => option.value));
  const shopSortValues = new Set(shopSortOptions.map((option) => option.value));
  const hasProductIntent = Boolean(
    q || category || occasion || shopId || minPrice || maxPrice || express || productSortValues.has(requestedSort),
  );
  const inferredView: ResultsView = hasProductIntent ? "products" : "shops";
  const view: ResultsView = requestedView === "products" || requestedView === "shops"
    ? requestedView
    : inferredView;
  const defaultProductSort = hasProductIntent ? "relevant" : "popular";
  const defaultShopSort = region || district ? "nearest" : "relevant";
  const sortOptions = view === "products" ? productSortOptions : shopSortOptions;
  const sort = (view === "products" ? productSortValues : shopSortValues).has(requestedSort)
    ? requestedSort
    : view === "products"
      ? defaultProductSort
      : defaultShopSort;
  const catalog = getProductsCatalog({
    q,
    region,
    district,
    category,
    occasion,
    shopId,
    minPrice: numberValue(minPrice),
    maxPrice: numberValue(maxPrice),
    express,
    sort,
  });
  const selectedShop = shopId ? catalog.shops.find((shop) => shop.id === shopId) : null;
  const hasAnyFilter = Boolean(q || region || district || category || occasion || shopId || minPrice || maxPrice || express);
  const pageTitle = selectedShop
    ? `Bánh của ${selectedShop.name}`
    : q
      ? `Kết quả cho “${q}”`
      : catalog.locationLabel
        ? `Bánh tại ${catalog.locationLabel}`
        : "Tất cả bánh trên LayerZ";

  const categoryOptions = [
    { label: "Bento", value: "bento" },
    { label: "Tiramisu", value: "tiramisu" },
    { label: "Trái cây", value: "trai cay" },
    { label: "Tạo hình", value: "tao hinh" },
  ];
  const occasionOptions = [
    { label: "Sinh nhật", value: "birthday" },
    { label: "Kỷ niệm", value: "anniversary" },
    { label: "Cho bé", value: "kids" },
    { label: "Khai trương", value: "opening" },
  ];
  const priceOptions = [
    { label: "Dưới 200K", min: null, max: "200000" },
    { label: "200K – 300K", min: "200000", max: "300000" },
    { label: "300K – 500K", min: "300000", max: "500000" },
    { label: "500K – 1 triệu", min: "500000", max: "1000000" },
    { label: "Trên 1 triệu", min: "1000000", max: null },
  ];
  const activeCategory = categoryOptions.find((option) => option.value === category);
  const activeOccasion = occasionOptions.find((option) => option.value === occasion);
  const activePrice = priceOptions.find((option) => option.min === (minPrice || null) && option.max === (maxPrice || null));
  const activePriceLabel = activePrice?.label ?? (
    minPrice && maxPrice
      ? `${compactPrice(minPrice)} – ${compactPrice(maxPrice)}`
      : minPrice
        ? `Từ ${compactPrice(minPrice)}`
        : maxPrice
          ? `Dưới ${compactPrice(maxPrice)}`
          : null
  );
  const activeSort = sortOptions.find((option) => option.value === sort) ?? sortOptions[0];
  const productViewHref = productsHref(rawParams, {
    view: "products",
    sort: productSortValues.has(requestedSort) ? requestedSort : defaultProductSort,
  });
  const shopViewHref = productsHref(rawParams, {
    view: "shops",
    sort: shopSortValues.has(requestedSort) ? requestedSort : defaultShopSort,
  });
  const clearFiltersHref = productsHref(rawParams, {
    q: null,
    region: null,
    district: null,
    category: null,
    occasion: null,
    shopId: null,
    minPrice: null,
    maxPrice: null,
    express: null,
  });

  return (
    <div className="min-h-dvh overflow-x-clip bg-panel">
      <a className="fixed left-3 top-3 z-100 translate-y-[-160%] bg-ink px-3.5 py-2.5 text-white transition-transform focus:translate-y-0" href="#products-results">Đi thẳng đến kết quả</a>
      <header className="sticky top-0 z-30 flex min-h-17.5 items-center justify-between border-b border-line/80 bg-panel/90 px-[max(1.5rem,calc((100%-80rem)/2))] backdrop-blur-lg max-md:min-h-15.5 max-md:px-3.5">
        <Link className={brandClass} href="/" aria-label="LayerZ trang chủ">LayerZ<span>.</span></Link>
        <nav className="flex items-center gap-6 text-[0.6875rem] font-bold text-muted max-md:gap-3.5 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5 [&_a]:transition-colors [&_a:hover]:text-ink max-md:[&_a:last-child]:hidden" aria-label="Điều hướng trang sản phẩm">
          <Link href="/"><ArrowLeft size={16} aria-hidden="true" /> Trang chủ</Link>
          <a href="/designer">Tự thiết kế</a>
        </nav>
      </header>

      <main>
        <section className={`${pageWidth} py-19 pb-9.5 max-md:py-11.5 max-md:pb-7`}>
          <p className={eyebrowClass}>Khám phá toàn bộ LayerZ</p>
          <h1 className="mb-3 mt-2 max-w-225 text-balance font-serif text-[clamp(3.25rem,6.2vw,5.375rem)] font-semibold leading-[0.98] tracking-[-0.055em] [&_em]:font-medium [&_em]:text-gold-deep max-md:text-[clamp(2.6875rem,13vw,3.625rem)]">Tìm chiếc bánh <em>hợp đúng dịp.</em></h1>
          <p className="m-0 max-w-162.5 text-xs leading-[1.7] text-muted">Tìm theo tên, dịp hoặc khu vực. LayerZ chỉ hiển thị những thông tin thực sự có trong dữ liệu của tiệm.</p>
          <form className="mt-7.5 grid grid-cols-[minmax(17.5rem,1fr)_minmax(11.875rem,0.34fr)_auto] gap-2 rounded-xl border border-line bg-white/65 p-2 shadow-[0_1rem_2.75rem_rgba(91,65,38,0.07)] max-md:mt-5.5 max-md:grid-cols-1" action="/products" method="get">
            <label className="flex min-h-12.5 min-w-0 items-center gap-2.5 px-3.5 text-gold-deep">
              <MagnifyingGlass size={20} aria-hidden="true" />
              <span className="sr-only">Tìm bánh</span>
              <input className="w-full min-w-0 border-0 bg-transparent text-xs text-ink outline-none placeholder:text-faint" name="q" type="search" defaultValue={q} placeholder="Tìm bento, bánh sinh nhật, tiramisu..." />
            </label>
            <label className="flex min-h-12.5 min-w-0 items-center gap-2.5 border-l border-line px-3.5 text-gold-deep max-md:border-l-0 max-md:border-t">
              <MapPin size={18} aria-hidden="true" />
              <span className="sr-only">Khu vực</span>
              <select className="w-full min-w-0 border-0 bg-transparent text-xs text-ink outline-none" name="region" defaultValue={region}>
                <option value="">Tất cả khu vực</option>
                {catalog.locations.map((location) => (
                  <option value={location.province} key={location.province}>{location.label}</option>
                ))}
              </select>
            </label>
            {district ? <input type="hidden" name="district" value={district} /> : null}
            {category ? <input type="hidden" name="category" value={category} /> : null}
            {occasion ? <input type="hidden" name="occasion" value={occasion} /> : null}
            {shopId ? <input type="hidden" name="shopId" value={shopId} /> : null}
            {minPrice ? <input type="hidden" name="minPrice" value={minPrice} /> : null}
            {maxPrice ? <input type="hidden" name="maxPrice" value={maxPrice} /> : null}
            {express ? <input type="hidden" name="express" value="1" /> : null}
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="view" value={view} />
            <button className="inline-flex min-h-12.5 cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-ink px-6 text-[0.6875rem] font-extrabold text-white transition hover:bg-[#4b4035] active:translate-y-px active:scale-[0.99]" type="submit">Tìm bánh <ArrowRight size={17} aria-hidden="true" /></button>
          </form>
        </section>

        <section className={`${pageWidth} border-y border-line py-4.5`} aria-label="Bộ lọc và cách hiển thị">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="mr-1 inline-flex min-h-10 shrink-0 items-center gap-1.5 text-[0.625rem] font-extrabold max-md:w-full"><SlidersHorizontal size={17} aria-hidden="true" /> Bộ lọc</span>

            <details className="group relative">
              <summary className={`${filterTriggerClass} ${activeCategory ? "border-gold-deep bg-gold-pale" : ""}`}>
                {activeCategory ? `Danh mục · ${activeCategory.label}` : "Danh mục"}<span aria-hidden="true">⌄</span>
              </summary>
              <div className={filterMenuClass}>
                <a href={productsHref(rawParams, { category: null })}>Tất cả danh mục {!category ? <span aria-hidden="true">●</span> : null}</a>
                {categoryOptions.map((option) => (
                  <a href={productsHref(rawParams, { category: option.value })} key={option.value}>{option.label} {category === option.value ? <span aria-hidden="true">●</span> : null}</a>
                ))}
              </div>
            </details>

            <details className="group relative">
              <summary className={`${filterTriggerClass} ${minPrice || maxPrice ? "border-gold-deep bg-gold-pale" : ""}`}>
                {activePriceLabel ? `Giá · ${activePriceLabel}` : "Khoảng giá"}<span aria-hidden="true">⌄</span>
              </summary>
              <div className={`${filterMenuClass} min-w-64`}>
                <a href={productsHref(rawParams, { minPrice: null, maxPrice: null })}>Mọi mức giá {!minPrice && !maxPrice ? <span aria-hidden="true">●</span> : null}</a>
                {priceOptions.map((option) => (
                  <a href={productsHref(rawParams, { minPrice: option.min, maxPrice: option.max })} key={option.label}>{option.label} {activePrice?.label === option.label ? <span aria-hidden="true">●</span> : null}</a>
                ))}
                <form className="mt-1 grid grid-cols-2 gap-2 border-t border-line p-2 pt-3" action="/products" method="get">
                  {q ? <input type="hidden" name="q" value={q} /> : null}
                  {region ? <input type="hidden" name="region" value={region} /> : null}
                  {district ? <input type="hidden" name="district" value={district} /> : null}
                  {category ? <input type="hidden" name="category" value={category} /> : null}
                  {occasion ? <input type="hidden" name="occasion" value={occasion} /> : null}
                  {shopId ? <input type="hidden" name="shopId" value={shopId} /> : null}
                  {express ? <input type="hidden" name="express" value="1" /> : null}
                  <input type="hidden" name="view" value={view} />
                  <input type="hidden" name="sort" value={sort} />
                  <label className="grid gap-1 text-[0.5625rem] font-bold text-muted">Từ
                    <input className="h-9 min-w-0 rounded-lg border border-line bg-white px-2 text-[0.625rem] text-ink outline-none focus:border-gold-deep" type="number" name="minPrice" min="0" step="50000" defaultValue={minPrice} placeholder="200000" />
                  </label>
                  <label className="grid gap-1 text-[0.5625rem] font-bold text-muted">Đến
                    <input className="h-9 min-w-0 rounded-lg border border-line bg-white px-2 text-[0.625rem] text-ink outline-none focus:border-gold-deep" type="number" name="maxPrice" min="0" step="50000" defaultValue={maxPrice} placeholder="500000" />
                  </label>
                  <button className="col-span-2 min-h-9 rounded-lg bg-ink px-3 text-[0.625rem] font-extrabold text-white transition hover:bg-gold-deep" type="submit">Áp dụng khoảng giá</button>
                </form>
              </div>
            </details>

            <details className="group relative">
              <summary className={`${filterTriggerClass} ${activeOccasion ? "border-gold-deep bg-gold-pale" : ""}`}>
                {activeOccasion ? `Dịp · ${activeOccasion.label}` : "Dịp"}<span aria-hidden="true">⌄</span>
              </summary>
              <div className={filterMenuClass}>
                <a href={productsHref(rawParams, { occasion: null })}>Mọi dịp {!occasion ? <span aria-hidden="true">●</span> : null}</a>
                {occasionOptions.map((option) => (
                  <a href={productsHref(rawParams, { occasion: option.value })} key={option.value}>{option.label} {occasion === option.value ? <span aria-hidden="true">●</span> : null}</a>
                ))}
              </div>
            </details>

            <a className={`${filterTriggerClass} ${express ? "border-gold-deep bg-gold-pale" : ""}`} href={productsHref(rawParams, { express: express ? null : "1" })}>Giao nhanh {express ? <span aria-hidden="true">●</span> : null}</a>
            {hasAnyFilter ? <a className="ml-auto whitespace-nowrap border-b border-current pb-1 text-[0.5625rem] font-bold text-muted max-md:ml-0" href={clearFiltersHref}>Xóa bộ lọc</a> : null}
          </div>

          <div className="mt-4 flex items-center justify-between gap-5 border-t border-line/70 pt-4 max-md:flex-col max-md:items-stretch max-md:gap-3">
            <details className="group relative max-md:order-2">
              <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-2 text-[0.6875rem] font-bold text-muted [&::-webkit-details-marker]:hidden max-md:w-full max-md:justify-between max-md:rounded-lg max-md:border max-md:border-line max-md:bg-white/35 max-md:px-3.5">
                <span>{view === "products" ? "Sắp xếp bánh" : "Sắp xếp tiệm"}: <strong className="text-ink">{activeSort.label}</strong></span><span aria-hidden="true">⌄</span>
              </summary>
              <div className={`${filterMenuClass} bottom-auto left-0 min-w-56`}>
                {sortOptions.map((option) => (
                  <a href={productsHref(rawParams, { view, sort: option.value })} key={option.value}>{option.label} {sort === option.value ? <span aria-hidden="true">●</span> : null}</a>
                ))}
              </div>
            </details>

            <nav className="grid grid-cols-2 rounded-xl border border-line bg-white/35 p-1 max-md:order-1 max-md:w-full" aria-label="Cách hiển thị kết quả">
              <a className={`inline-flex min-h-9 items-center justify-center rounded-lg px-5 text-[0.625rem] font-extrabold transition ${view === "products" ? "bg-ink text-white shadow-[0_0.375rem_1rem_rgba(58,49,40,0.16)]" : "text-muted hover:bg-white/70 hover:text-ink"}`} href={productViewHref} aria-current={view === "products" ? "page" : undefined}>Theo bánh</a>
              <a className={`inline-flex min-h-9 items-center justify-center rounded-lg px-5 text-[0.625rem] font-extrabold transition ${view === "shops" ? "bg-ink text-white shadow-[0_0.375rem_1rem_rgba(58,49,40,0.16)]" : "text-muted hover:bg-white/70 hover:text-ink"}`} href={shopViewHref} aria-current={view === "shops" ? "page" : undefined}>Theo tiệm</a>
            </nav>
          </div>
        </section>

        <section className={`${pageWidth} py-14.5 pb-22 max-md:py-10.5 max-md:pb-16`} id="products-results" aria-labelledby="results-title">
          <div className="mb-7.5 flex items-end justify-between gap-6 max-md:mb-5.5 max-md:block">
            <div>
              <p className={eyebrowClass}>{catalog.resultCount} bánh · {catalog.groups.length} tiệm</p>
              <h2 className="mt-1.5 text-balance font-serif text-[clamp(2.125rem,4.2vw,3.5rem)] font-semibold leading-none tracking-[-0.04em] max-md:text-[2.3125rem]" id="results-title">{pageTitle}</h2>
            </div>
            <span className="text-[0.5625rem] font-bold uppercase tracking-[0.07em] text-muted max-md:mt-2.5 max-md:inline-block">{view === "products" ? "Đang so sánh từng bánh" : "Đang khám phá theo tiệm"}</span>
          </div>

          {catalog.resultCount === 0 ? (
            <div className="grid min-h-65 place-items-center content-center gap-2.5 border border-dashed border-line text-center text-muted [&_h3]:font-serif [&_h3]:text-[1.75rem] [&_h3]:font-semibold [&_h3]:text-ink [&_p]:m-0 [&_p]:text-xs">
              <Cake size={38} weight="duotone" aria-hidden="true" />
              <h3>Chưa tìm thấy chiếc bánh phù hợp</h3>
              <p>Thử từ khóa ngắn hơn hoặc bỏ bớt một bộ lọc.</p>
              <a className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-linear-to-br from-[#e3b24c] to-[#b9821e] px-4.5 text-xs font-extrabold text-[#2f261e] shadow-[0_0.625rem_1.625rem_rgba(185,130,30,0.2)]" href="/products">Xem toàn bộ bánh</a>
            </div>
          ) : view === "products" ? (
            <div className="grid grid-cols-4 gap-x-3.5 gap-y-4.5 max-[1080px]:grid-cols-3 max-md:grid-cols-2 max-md:gap-x-2.5 max-md:gap-y-4">
              {catalog.products.map((product) => <ProductCard product={product} key={product.id} />)}
            </div>
          ) : (
            <div className="grid gap-16 max-md:gap-12">
              {catalog.groups.map((group) => (
                <section className="border-t border-line pt-6" key={group.shop.id} aria-labelledby={`shop-${group.shop.id}`}>
                  <div className="mb-5 flex items-center justify-between gap-6 max-md:items-end">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span className="relative size-13 shrink-0 overflow-hidden rounded-xl border border-line bg-gold-pale">
                        <Image
                          className="object-cover"
                          src={group.shop.avatarUrl || group.shop.bannerUrl}
                          alt=""
                          fill
                          unoptimized
                          sizes="56px"
                        />
                      </span>
                      <div>
                        <h3 className="m-0 font-serif text-[1.5625rem] leading-[1.05] max-md:text-xl" id={`shop-${group.shop.id}`}>{group.shop.name}</h3>
                        <p className="mt-1.5 flex items-center gap-1 text-[0.5625rem] text-muted [&_svg]:text-gold-deep">
                          {group.shop.rating > 0 ? <><Star size={13} weight="fill" aria-hidden="true" /> {group.shop.rating.toFixed(1)} · </> : null}
                          {group.shop.district || group.shop.province} · {group.totalProducts} bánh phù hợp
                        </p>
                      </div>
                    </div>
                    <a className="inline-flex items-center gap-2 whitespace-nowrap border-b border-current pb-1 text-[0.625rem] font-extrabold max-md:text-[0] max-md:[&_svg]:size-5" href={productsHref(rawParams, { shopId: group.shop.id, view: "products", sort: "relevant" })}>
                      Xem tất cả {group.totalProducts} bánh <ArrowRight size={16} aria-hidden="true" />
                    </a>
                  </div>
                  <div className="grid grid-cols-4 gap-x-3.5 gap-y-4.5 max-[1080px]:grid-cols-3 max-md:grid-cols-2 max-md:gap-x-2.5 max-md:gap-y-4">
                    {group.products.map((product) => <ProductCard product={product} key={product.id} />)}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="grid grid-cols-[auto_1fr_auto] items-center gap-7 border-t border-line bg-cream px-[max(1.5rem,calc((100%-80rem)/2))] py-9.5 max-md:grid-cols-1 max-md:gap-3 max-md:px-3.5 max-md:py-8">
        <Link className={brandClass} href="/">LayerZ<span>.</span></Link>
        <p className="m-0 text-[0.625rem] text-muted">Bánh thật từ các tiệm thật, được sắp xếp để bạn chọn dễ hơn.</p>
        <Link className="text-[0.625rem] font-extrabold" href="/">Quay lại trang chủ</Link>
      </footer>
    </div>
  );
}

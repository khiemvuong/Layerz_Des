"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Cake,
  Gift,
  GridFour,
  Lightning,
  MagnifyingGlass,
  MapPin,
  SlidersHorizontal,
  Star,
  Tag,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import type { ProductsCatalog } from "@/lib/catalog";

import { ProductListingCard } from "./product-listing-card";

import {
  buildProductsQuery,
  filtersFromSearchParams,
  normalizeFilters,
  productSortOptions,
  shopSortOptions,
  type ProductFilters,
} from "./products-state";

type ProductsApiResponse = {
  filters: ProductFilters;
  catalog: ProductsCatalog;
};

const pageWidth =
  "mx-auto w-[min(calc(100%_-_3rem),93rem)] max-md:w-[min(calc(100%_-_1.75rem),93rem)]";

const brandClass =
  "w-fit font-serif text-[1.8125rem] font-bold leading-none tracking-[-0.055em] [&_span]:text-gold-deep max-md:text-[1.625rem]";

const quickTagClass =
  "inline-flex min-h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-full border px-4 text-[0.6875rem] font-semibold transition duration-200 hover:border-gold-deep hover:bg-gold-pale hover:text-gold-deep active:translate-y-px";

const categoryOptions = [
  {
    label: "Bento",
    value: "bento",
  },
  {
    label: "Tiramisu",
    value: "tiramisu",
  },
  {
    label: "Trái cây",
    value: "trai cay",
  },
  {
    label: "Tạo hình",
    value: "tao hinh",
  },
];

const occasionOptions = [
  {
    label: "Sinh nhật",
    value: "birthday",
  },
  {
    label: "Kỷ niệm",
    value: "anniversary",
  },
  {
    label: "Cho bé",
    value: "kids",
  },
  {
    label: "Khai trương",
    value: "opening",
  },
];

const priceOptions = [
  {
    label: "Dưới 200K",
    min: "",
    max: "200000",
  },
  {
    label: "200K – 300K",
    min: "200000",
    max: "300000",
  },
  {
    label: "300K – 500K",
    min: "300000",
    max: "500000",
  },
  {
    label: "500K – 1 triệu",
    min: "500000",
    max: "1000000",
  },
  {
    label: "Trên 1 triệu",
    min: "1000000",
    max: "",
  },
];

export function ProductsExperience({
  initialCatalog,
  initialFilters,
}: {
  initialCatalog: ProductsCatalog;
  initialFilters: ProductFilters;
}) {
  const [catalog, setCatalog] = useState(initialCatalog);

  const [filters, setFilters] = useState(initialFilters);

  const [searchQuery, setSearchQuery] = useState(initialFilters.q);

  const [minPriceDraft, setMinPriceDraft] = useState(initialFilters.minPrice);

  const [maxPriceDraft, setMaxPriceDraft] = useState(initialFilters.maxPrice);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  /*
   * Không navigate Next.js route.
   *
   * Chỉ:
   * 1. đổi URL bằng History API
   * 2. fetch data mới
   * 3. setCatalog()
   *
   * Header / search / filters không rerender
   * theo kiểu route transition.
   */
  const loadFilters = useCallback(
    async (
      requestedFilters: ProductFilters,
      historyMode: "push" | "replace" | "none" = "push",
    ) => {
      const normalized = normalizeFilters(requestedFilters);

      // Mỗi request có một ID riêng để response cũ không ghi đè response mới.
      const requestId = ++requestIdRef.current;

      // Hủy request trước nếu user đổi filter liên tục.
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const query = buildProductsQuery(normalized);

        const response = await fetch(
          query ? `/api/products?${query}` : "/api/products",
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          console.error(
            "[ProductsExperience] API error:",
            response.status,
            payload,
          );

          throw new Error(
            payload?.error ||
              `API /api/products trả về HTTP ${response.status}`,
          );
        }

        // Nếu đã có request mới hơn thì bỏ response này.
        if (requestId !== requestIdRef.current) {
          return;
        }

        const data = payload as ProductsApiResponse;
        const safeFilters = normalizeFilters(data.filters);

        setFilters(safeFilters);
        setCatalog(data.catalog);
        setSearchQuery(safeFilters.q);
        setMinPriceDraft(safeFilters.minPrice);
        setMaxPriceDraft(safeFilters.maxPrice);

        if (historyMode !== "none") {
          const safeQuery = buildProductsQuery(safeFilters);
          const nextUrl = safeQuery ? `/products?${safeQuery}` : "/products";

          if (historyMode === "replace") {
            window.history.replaceState(null, "", nextUrl);
          } else {
            window.history.pushState(null, "", nextUrl);
          }
        }
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        // Request cũ không được phép ghi error đè request mới.
        if (requestId !== requestIdRef.current) {
          return;
        }

        console.error("[ProductsExperience] loadFilters:", requestError);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể cập nhật danh sách bánh.",
        );
      } finally {
        // Chỉ request mới nhất được phép tắt loading.
        if (requestId === requestIdRef.current) {
          setLoading(false);

          if (abortRef.current === controller) {
            abortRef.current = null;
          }
        }
      }
    },
    [],
  );

  function updateFilters(changes: Partial<ProductFilters>) {
    const next = normalizeFilters({
      ...filters,
      ...changes,
    });

    void loadFilters(next, "push");
  }

  /*
   * Back / forward browser vẫn hoạt động.
   */
  useEffect(() => {
    function handlePopState() {
      const next = filtersFromSearchParams(
        new URLSearchParams(window.location.search),
      );

      void loadFilters(next, "none");
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);

      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [loadFilters]);

  /*
   * URL cũ ?region=...
   * → đổi ngay sang ?province=...
   * nhưng không tạo history entry.
   */
  useEffect(() => {
    if (window.location.search.includes("region=")) {
      const query = buildProductsQuery(filters);

      window.history.replaceState(
        null,
        "",
        query ? `/products?${query}` : "/products",
      );
    }
  }, [filters]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateFilters({
      q: searchQuery.trim(),
      view: "products",
      sort: "relevant",
    });
  }

  function submitCustomPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateFilters({
      minPrice: minPriceDraft,
      maxPrice: maxPriceDraft,
      view: "products",
      sort: "relevant",
    });
  }

  const sortOptions =
    filters.view === "products" ? productSortOptions : shopSortOptions;

  const activeSort =
    sortOptions.find((option) => option.value === filters.sort) ??
    sortOptions[0];

  const activePrice = priceOptions.find(
    (option) =>
      option.min === filters.minPrice && option.max === filters.maxPrice,
  );

  const hasAnyFilter = Boolean(
    filters.q ||
    filters.province ||
    filters.district ||
    filters.category ||
    filters.occasion ||
    filters.shopId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.express,
  );

  const activeFilterCount = [
    filters.q,
    filters.province || filters.district,
    filters.category,
    filters.occasion,
    filters.shopId,
    filters.minPrice || filters.maxPrice,
    filters.express ? "express" : "",
  ].filter(Boolean).length;

  const quickFilters = [
    {
      label: "Dưới 300K",
      active: !filters.minPrice && filters.maxPrice === "300000",
      changes: {
        minPrice: "",
        maxPrice:
          !filters.minPrice && filters.maxPrice === "300000" ? "" : "300000",
        view: "products" as const,
        sort: "relevant",
      },
    },
    {
      label: "Bento",
      active: filters.category === "bento",
      changes: {
        category: filters.category === "bento" ? "" : "bento",
        view: "products" as const,
        sort: "relevant",
      },
    },
    {
      label: "Sinh nhật",
      active: filters.occasion === "birthday",
      changes: {
        occasion: filters.occasion === "birthday" ? "" : "birthday",
        view: "products" as const,
        sort: "relevant",
      },
    },
    {
      label: "Tạo hình",
      active: filters.category === "tao hinh",
      changes: {
        category: filters.category === "tao hinh" ? "" : "tao hinh",
        view: "products" as const,
        sort: "relevant",
      },
    },
    {
      label: "Đốt cháy",
      active: filters.q === "đốt cháy",
      changes: {
        q: filters.q === "đốt cháy" ? "" : "đốt cháy",
        view: "products" as const,
        sort: "relevant",
      },
    },
    {
      label: "Rút tiền",
      active: filters.q === "rút tiền",
      changes: {
        q: filters.q === "rút tiền" ? "" : "rút tiền",
        view: "products" as const,
        sort: "relevant",
      },
    },
  ];

  const hasQuickSelection = quickFilters.some((filter) => filter.active);

  return (
    <div className="min-h-dvh overflow-x-clip bg-panel">
      {/* =========================
          HEADER
      ========================== */}

      <header className="sticky top-0 z-30 flex min-h-19 items-center justify-between border-b border-line/80 bg-panel/92 px-[max(1.5rem,calc((100%-93rem)/2))] backdrop-blur-lg max-md:min-h-15.5 max-md:px-3.5">
        <Link className={brandClass} href="/" aria-label="LayerZ trang chủ">
          LayerZ<span>.</span>
        </Link>

        <nav
          className="flex items-center gap-7 text-[0.6875rem] font-semibold text-ink max-md:gap-4 [&_a]:transition-colors [&_a:hover]:text-gold-deep"
          aria-label="Điều hướng chính"
        >
          <Link href="/">Trang chủ</Link>

          <Link href="/products" className="text-gold-deep" aria-current="page">
            Tất cả sản phẩm
          </Link>
        </nav>
      </header>

      <main>
        {/* =========================
            SEARCH HERO
        ========================== */}

        <section className={`${pageWidth} pb-3 pt-7 max-md:pb-2 max-md:pt-8`}>
          <h1 className="mb-1.5 mt-0 whitespace-nowrap font-serif text-[clamp(3.25rem,4.3vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.055em] max-md:whitespace-normal max-md:text-[clamp(2.65rem,13vw,3.5rem)]">
            Tìm chiếc bánh{" "}
            <em className="font-medium text-gold-deep">hợp đúng dịp.</em>
          </h1>

          <p className="m-0 text-xs leading-[1.65] text-muted">
            Khám phá bánh từ những tiệm bánh uy tín, cho mọi khoảnh khắc thêm
            ngọt ngào.
          </p>

          <form
            onSubmit={submitSearch}
            className="mt-6 grid grid-cols-[minmax(17.5rem,1fr)_20rem_12rem] gap-2 rounded-xl border border-line bg-white/70 p-2 shadow-[0_1rem_2.75rem_rgba(91,65,38,0.07)] max-lg:grid-cols-[minmax(15rem,1fr)_15rem_10.5rem] max-md:mt-5 max-md:grid-cols-1"
          >
            <label className="flex min-h-12.5 min-w-0 items-center gap-2.5 px-3.5 text-gold-deep">
              <MagnifyingGlass size={20} aria-hidden="true" />

              <span className="sr-only">Tìm bánh</span>

              <input
                className="w-full min-w-0 border-0 bg-transparent text-xs text-ink outline-none placeholder:text-faint"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="dâu tây, sinh nhật, kem tươi..."
              />
            </label>

            <label className="flex min-h-12.5 min-w-0 items-center gap-2.5 border-l border-line px-3.5 text-gold-deep max-md:border-l-0 max-md:border-t">
              <MapPin size={18} aria-hidden="true" />

              <span className="sr-only">Khu vực</span>

              <select
                className="w-full min-w-0 border-0 bg-transparent text-xs text-ink outline-none"
                value={filters.province}
                onChange={(event) => {
                  const nextProvince = event.target.value;

                  /*
                   * RULE QUAN TRỌNG:
                   *
                   * Province thay đổi
                   * → district cũ phải chết.
                   */
                  updateFilters({
                    province: nextProvince,
                    district: "",
                    shopId: "",
                  });
                }}
              >
                <option value="">Tất cả khu vực</option>

                {catalog.locations.map((location) => (
                  <option value={location.province} key={location.province}>
                    {location.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="inline-flex min-h-12.5 cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-ink px-6 text-[0.6875rem] font-extrabold text-white transition hover:bg-[#4b4035] active:translate-y-px"
              type="submit"
            >
              Tìm bánh
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>
        </section>

        {/* =========================
            FILTER AREA
        ========================== */}

        <section className={`${pageWidth} border-b border-line pb-5 pt-5`}>
          <div className="flex items-center justify-between gap-5">
            <p className="m-0 text-xs font-semibold text-ink">Chọn nhanh</p>

            <button
              type="button"
              disabled={!hasQuickSelection}
              onClick={() =>
                updateFilters({
                  q: "",
                  category: "",
                  occasion: "",
                  minPrice: "",
                  maxPrice: "",
                })
              }
              className="cursor-pointer border-0 bg-transparent text-[0.625rem] font-semibold text-gold-deep transition hover:text-ink disabled:pointer-events-none disabled:opacity-45"
            >
              Bỏ chọn nhanh
            </button>
          </div>

          <nav className="mt-3 flex flex-wrap gap-2.5">
            {quickFilters.map((filter) => (
              <button
                type="button"
                key={filter.label}
                onClick={() => updateFilters(filter.changes)}
                className={`${quickTagClass} ${
                  filter.active
                    ? "border-gold-deep bg-gold-pale text-gold-deep"
                    : "border-line bg-white/30 text-ink"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </nav>

          {/* =====================
              RESULTS HEADER
          ====================== */}

          <div className="mt-10 flex items-end justify-between gap-8 max-lg:flex-col max-lg:items-stretch max-md:mt-8">
            <div className="flex min-w-0 items-baseline gap-3 max-md:block">
              <h2
                className="m-0 font-serif text-[clamp(2rem,3vw,2.75rem)] font-semibold leading-none tracking-[-0.045em]"
                id="results-title"
              >
                {filters.view === "products"
                  ? "Bánh được yêu thích"
                  : "Tiệm bánh phù hợp"}
              </h2>

              <span className="whitespace-nowrap text-[0.6875rem] text-muted max-md:mt-2 max-md:block">
                {filters.view === "products"
                  ? `${catalog.resultCount} mẫu bánh`
                  : `${catalog.groups.length} tiệm · ${catalog.resultCount} mẫu bánh`}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2 max-md:grid max-md:grid-cols-2">
              {/* FILTER PANEL */}

              <details className="group relative max-md:static">
                <summary className="inline-flex min-h-12 cursor-pointer list-none items-center gap-2.5 rounded-xl border border-line bg-white/35 px-4 text-[0.6875rem] font-bold text-ink transition hover:border-gold-deep hover:bg-white/70 [&::-webkit-details-marker]:hidden max-md:w-full max-md:justify-center">
                  <SlidersHorizontal size={18} />
                  Bộ lọc
                  {activeFilterCount > 0 ? (
                    <span className="grid size-5 place-items-center rounded-full bg-ink text-[0.5625rem] text-white">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </summary>

                <div className="absolute right-0 top-[calc(100%+0.625rem)] z-40 grid w-152 grid-cols-3 gap-5 rounded-2xl border border-line bg-card p-5 shadow-[0_1.25rem_3.5rem_rgba(91,65,38,0.16)] max-md:fixed max-md:inset-x-3.5 max-md:top-20 max-md:max-h-[calc(100dvh-6rem)] max-md:w-auto max-md:grid-cols-1 max-md:overflow-y-auto">
                  {/* CATEGORY */}

                  <div className="grid content-start gap-2">
                    <p className="m-0 text-[0.625rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                      <GridFour size={15} className="mr-1 inline" />
                      Danh mục
                    </p>

                    <FilterButton
                      active={!filters.category}
                      onClick={() =>
                        updateFilters({
                          category: "",
                        })
                      }
                    >
                      Tất cả danh mục
                    </FilterButton>

                    {categoryOptions.map((option) => (
                      <FilterButton
                        key={option.value}
                        active={filters.category === option.value}
                        onClick={() =>
                          updateFilters({
                            category: option.value,
                            view: "products",
                            sort: "relevant",
                          })
                        }
                      >
                        {option.label}
                      </FilterButton>
                    ))}
                  </div>

                  {/* OCCASION */}

                  <div className="grid content-start gap-2">
                    <p className="m-0 text-[0.625rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                      <Gift size={15} className="mr-1 inline" />
                      Dịp
                    </p>

                    <FilterButton
                      active={!filters.occasion}
                      onClick={() =>
                        updateFilters({
                          occasion: "",
                        })
                      }
                    >
                      Mọi dịp
                    </FilterButton>

                    {occasionOptions.map((option) => (
                      <FilterButton
                        key={option.value}
                        active={filters.occasion === option.value}
                        onClick={() =>
                          updateFilters({
                            occasion: option.value,
                            view: "products",
                            sort: "relevant",
                          })
                        }
                      >
                        {option.label}
                      </FilterButton>
                    ))}
                  </div>

                  {/* PRICE */}

                  <div className="grid content-start gap-2">
                    <p className="m-0 text-[0.625rem] font-extrabold uppercase tracking-[0.08em] text-muted">
                      <Tag size={15} className="mr-1 inline" />
                      Khoảng giá
                    </p>

                    <FilterButton
                      active={!filters.minPrice && !filters.maxPrice}
                      onClick={() =>
                        updateFilters({
                          minPrice: "",
                          maxPrice: "",
                        })
                      }
                    >
                      Mọi mức giá
                    </FilterButton>

                    {priceOptions.map((option) => (
                      <FilterButton
                        key={option.label}
                        active={activePrice?.label === option.label}
                        onClick={() =>
                          updateFilters({
                            minPrice: option.min,
                            maxPrice: option.max,
                            view: "products",
                            sort: "relevant",
                          })
                        }
                      >
                        {option.label}
                      </FilterButton>
                    ))}
                  </div>

                  {/* CUSTOM PRICE */}

                  <form
                    onSubmit={submitCustomPrice}
                    className="col-span-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2 border-t border-line pt-4 max-md:col-span-1 max-md:grid-cols-2"
                  >
                    <label className="grid gap-1 text-[0.5625rem] font-bold text-muted">
                      Từ
                      <input
                        className="h-10 min-w-0 rounded-lg border border-line bg-white px-3 text-[0.625rem] text-ink outline-none focus:border-gold-deep"
                        type="number"
                        min="0"
                        step="50000"
                        value={minPriceDraft}
                        onChange={(event) =>
                          setMinPriceDraft(event.target.value)
                        }
                        placeholder="200000"
                      />
                    </label>

                    <label className="grid gap-1 text-[0.5625rem] font-bold text-muted">
                      Đến
                      <input
                        className="h-10 min-w-0 rounded-lg border border-line bg-white px-3 text-[0.625rem] text-ink outline-none focus:border-gold-deep"
                        type="number"
                        min="0"
                        step="50000"
                        value={maxPriceDraft}
                        onChange={(event) =>
                          setMaxPriceDraft(event.target.value)
                        }
                        placeholder="500000"
                      />
                    </label>

                    <button
                      className="min-h-10 rounded-lg border-0 bg-ink px-4 text-[0.625rem] font-extrabold text-white transition hover:bg-gold-deep max-md:col-span-2"
                      type="submit"
                    >
                      Áp dụng
                    </button>
                  </form>

                  <div className="col-span-3 flex items-center justify-between border-t border-line pt-4 max-md:col-span-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateFilters({
                          express: !filters.express,
                          view: "products",
                          sort: "relevant",
                        })
                      }
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-transparent px-3 py-2 text-[0.625rem] font-bold transition hover:bg-gold-pale ${
                        filters.express
                          ? "border-gold-deep bg-gold-pale text-gold-deep"
                          : ""
                      }`}
                    >
                      <Lightning size={14} />
                      Giao nhanh
                    </button>

                    {hasAnyFilter ? (
                      <button
                        type="button"
                        onClick={() =>
                          void loadFilters(
                            {
                              q: "",
                              province: "",
                              district: "",
                              category: "",
                              occasion: "",
                              shopId: "",
                              minPrice: "",
                              maxPrice: "",
                              express: false,
                              sort: "popular",
                              view: "products",
                            },
                            "push",
                          )
                        }
                        className="cursor-pointer border-0 border-b border-current bg-transparent pb-0.5 text-[0.625rem] font-semibold text-gold-deep"
                      >
                        Xóa bộ lọc
                      </button>
                    ) : null}
                  </div>
                </div>
              </details>

              {/* SORT */}

              <details className="group relative">
                <summary className="inline-flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-xl border border-line bg-white/35 px-4 text-[0.6875rem] font-semibold text-muted transition hover:border-gold-deep hover:bg-white/70 [&::-webkit-details-marker]:hidden max-md:w-full max-md:justify-center">
                  <span>
                    Sắp xếp:{" "}
                    <strong className="text-ink">{activeSort.label}</strong>
                  </span>

                  <span aria-hidden="true">⌄</span>
                </summary>

                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 grid min-w-56 gap-1 rounded-xl border border-line bg-card p-2 shadow-[0_1.125rem_2.75rem_rgba(91,65,38,0.14)]">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateFilters({
                          sort: option.value,
                        })
                      }
                      className="flex min-h-9 cursor-pointer items-center justify-between gap-4 rounded-lg border-0 bg-transparent px-3 text-left text-[0.625rem] font-bold transition hover:bg-gold-pale"
                    >
                      {option.label}

                      {filters.sort === option.value ? <span>●</span> : null}
                    </button>
                  ))}
                </div>
              </details>

              {/* VIEW MODE */}

              <nav className="grid grid-cols-2 rounded-xl border border-line bg-white/35 p-1 max-md:col-span-2 max-md:w-full">
                <button
                  type="button"
                  onClick={() =>
                    updateFilters({
                      view: "products",
                      sort: productSortOptions.some(
                        (item) => item.value === filters.sort,
                      )
                        ? filters.sort
                        : "relevant",
                    })
                  }
                  className={`inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border-0 px-5 text-[0.625rem] font-extrabold transition ${
                    filters.view === "products"
                      ? "bg-ink text-white shadow-[0_0.375rem_1rem_rgba(58,49,40,0.16)]"
                      : "bg-transparent text-muted hover:bg-white/70 hover:text-ink"
                  }`}
                >
                  Theo bánh
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateFilters({
                      view: "shops",
                      sort: shopSortOptions.some(
                        (item) => item.value === filters.sort,
                      )
                        ? filters.sort
                        : filters.province
                          ? "nearest"
                          : "relevant",
                    })
                  }
                  className={`inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border-0 px-5 text-[0.625rem] font-extrabold transition ${
                    filters.view === "shops"
                      ? "bg-ink text-white shadow-[0_0.375rem_1rem_rgba(58,49,40,0.16)]"
                      : "bg-transparent text-muted hover:bg-white/70 hover:text-ink"
                  }`}
                >
                  Theo tiệm
                </button>
              </nav>
            </div>
          </div>
        </section>

        {/* ERROR */}

        {error ? (
          <div className={`${pageWidth} pt-4`}>
            <div className="border border-danger/25 bg-danger/5 px-4 py-3 text-xs text-danger">
              {error}
            </div>
          </div>
        ) : null}

        {/* =========================
            RESULTS

            CHỈ PHẦN NÀY MỜ/LOAD
        ========================== */}

        <section
          className={`${pageWidth} pb-22 pt-5 max-md:pb-16 max-md:pt-4`}
          id="products-results"
          aria-labelledby="results-title"
          aria-busy={loading}
        >
          <div
            className={`relative ${loading ? "pointer-events-none" : ""}`}
          >
            {loading ? (
              <div className="absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-line">
                <div className="h-full w-1/3 animate-pulse bg-gold-deep" />
              </div>
            ) : null}

            {catalog.resultCount === 0 ? (
              <div className="grid min-h-65 place-items-center content-center gap-2.5 border border-dashed border-line text-center text-muted">
                <Cake size={38} weight="duotone" />

                <h3 className="font-serif text-[1.75rem] font-semibold text-ink">
                  Chưa tìm thấy chiếc bánh phù hợp
                </h3>

                <p className="m-0 text-xs">
                  Thử từ khóa ngắn hơn hoặc bỏ bớt một bộ lọc.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void loadFilters(
                      {
                        q: "",
                        province: "",
                        district: "",
                        category: "",
                        occasion: "",
                        shopId: "",
                        minPrice: "",
                        maxPrice: "",
                        express: false,
                        sort: "popular",
                        view: "products",
                      },
                      "push",
                    )
                  }
                  className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border-0 bg-gold px-4.5 text-xs font-extrabold text-[#2f261e]"
                >
                  Xem toàn bộ bánh
                </button>
              </div>
            ) : filters.view === "products" ? (
              <div className="grid grid-cols-4 gap-4 max-[1080px]:grid-cols-3 max-md:grid-cols-2 max-md:gap-x-2.5 max-md:gap-y-4">
                {catalog.products.map((product, index) => (
                  <ProductListingCard
                    product={product}
                    bestseller={
                      filters.sort === "popular" &&
                      index === 0 &&
                      product.totalSold > 0
                    }
                    key={product.id}
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-16 max-md:gap-12">
                {catalog.groups.map((group) => (
                  <section
                    className="border-t border-line pt-6"
                    key={group.shop.id}
                  >
                    <div className="mb-5 flex items-center justify-between gap-6 max-md:items-end">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <span className="relative size-13 shrink-0 overflow-hidden rounded-xl border border-line bg-gold-pale">
                          <Image
                            className="object-cover"
                            src={group.shop.avatarUrl || group.shop.bannerUrl}
                            alt={`Logo ${group.shop.name}`}
                            fill
                            unoptimized
                            sizes="56px"
                          />
                        </span>

                        <div>
                          <h3 className="m-0 font-serif text-[1.5625rem] leading-[1.05] max-md:text-xl">
                            {group.shop.name}
                          </h3>

                          <p className="mt-1.5 flex items-center gap-1 text-[0.5625rem] text-muted [&_svg]:text-gold-deep">
                            {group.shop.rating > 0 ? (
                              <>
                                <Star size={13} weight="fill" />

                                {group.shop.rating.toFixed(1)}

                                {" · "}
                              </>
                            ) : null}
                            {group.shop.district || group.shop.province}
                            {" · "}
                            {group.totalProducts} bánh phù hợp
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          updateFilters({
                            shopId: group.shop.id,
                            view: "products",
                            sort: "relevant",
                          })
                        }
                        className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap border-0 border-b border-current bg-transparent pb-1 text-[0.625rem] font-extrabold max-md:text-[0]"
                      >
                        Xem tất cả {group.totalProducts} bánh
                        <ArrowRight size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 max-[1080px]:grid-cols-3 max-md:grid-cols-2 max-md:gap-x-2.5 max-md:gap-y-4">
                      {group.products.map((product) => (
                        <ProductListingCard
                          product={product}
                          key={product.id}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="grid grid-cols-[auto_1fr_auto] items-center gap-7 border-t border-line bg-cream px-[max(1.5rem,calc((100%-93rem)/2))] py-9.5 max-md:grid-cols-1 max-md:gap-3 max-md:px-3.5 max-md:py-8">
        <Link className={brandClass} href="/">
          LayerZ<span>.</span>
        </Link>

        <p className="m-0 text-[0.625rem] text-muted">
          Bánh thật từ các tiệm thật, được sắp xếp để bạn chọn dễ hơn.
        </p>

        <Link className="text-[0.625rem] font-extrabold" href="/">
          Quay lại trang chủ
        </Link>
      </footer>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-lg border-0 px-3 py-2 text-left text-[0.625rem] font-semibold transition hover:bg-gold-pale ${
        active ? "bg-gold-pale text-gold-deep" : "bg-transparent text-ink"
      }`}
    >
      {children}
    </button>
  );
}
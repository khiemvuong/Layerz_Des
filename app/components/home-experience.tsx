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

const shoppingIntents = [
  { label: "Sinh nhật", query: "sinh nhật", icon: Cake },
  { label: "Bento", query: "bento", icon: Gift },
  { label: "Giao hôm nay", query: "giao hôm nay", icon: Lightning },
  { label: "Bánh custom", query: "bánh custom", icon: PaintBrush },
  { label: "Kỷ niệm", query: "kỷ niệm", icon: Heart },
  { label: "Dưới 300K", query: "dưới 300k", icon: CurrencyCircleDollar },
];

const occasionLabels = ["Sinh nhật thật riêng", "Một chiếc bento nhỏ", "Kỷ niệm của hai người"];

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
  const inspirationProducts = uniqueProducts([
    ...catalog.featuredProducts,
    ...catalog.newProducts,
  ]).slice(0, 3);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Đi thẳng đến nội dung</a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="LayerZ trang chủ">
          LayerZ<span>.</span>
        </a>
        <nav className="desktop-nav" aria-label="Điều hướng chính">
          <a href="#artisans">Tiệm bánh</a>
          <a href="#suggested">LayerZ chọn</a>
          <a href="#new">Bánh mới</a>
          <a href="#design-your-cake">Tự thiết kế</a>
        </nav>
        <div className="header-actions">
          <button className="location-trigger" type="button" onClick={openLocationModal}>
            <MapPin size={17} weight="duotone" aria-hidden="true" />
            <span>{displayLocation}</span>
          </button>
          <a className="cart-link" href="https://layerz.vn/cart" aria-label="Giỏ hàng">
            <ShoppingBag size={19} aria-hidden="true" />
          </a>
        </div>
      </header>

      <main id="main-content">
        <section className="hero-showcase page-width" id="top" aria-labelledby="hero-title">
          <div className="hero-main-tile">
            <Image
              src="/images/hero-cake.png"
              alt="Bánh kem thủ công màu ivory với hoa và chi tiết vàng champagne"
              fill
              priority
              sizes="(max-width: 767px) 100vw, 68vw"
              className="hero-image"
            />
            <div className="hero-scrim" />
            <div className="hero-content">
              <p className="hero-kicker">Bánh được làm riêng cho bạn</p>
              <h1 id="hero-title">Tìm chiếc bánh đúng với dịp của bạn.</h1>
              <p className="hero-copy">
                Khám phá tiệm gần {displayLocation} và những mẫu bánh được LayerZ tuyển chọn.
              </p>
              <form className="hero-search" action="https://layerz.vn/products" method="get">
                <MagnifyingGlass size={19} aria-hidden="true" />
                <input
                  type="search"
                  name="search"
                  aria-label="Tìm kiếm bánh"
                  placeholder="Tìm bento, sinh nhật, bánh dưới 300K..."
                />
                <button type="submit">Tìm bánh</button>
              </form>
              <div className="hero-actions">
                <button className="button button-primary" type="button" onClick={openLocationModal}>
                  <MapPin size={18} aria-hidden="true" />
                  Đổi khu vực
                </button>
                <a className="hero-text-link" href="https://layerz.vn/configurator-3d">
                  <span>Thiết kế bánh riêng</span>
                  <ArrowRight size={21} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="hero-benefits" aria-label="Lợi ích khi chọn bánh tại LayerZ">
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

          <div className="hero-side-stack" aria-label="Gợi ý nổi bật">
            {promoProducts.map((product, index) => (
              <a className={`hero-promo-card hero-promo-${index + 1}`} href={productUrl(product)} key={product.id}>
                <Image
                  src={product.thumbnail}
                  alt={product.name}
                  fill
                  unoptimized
                  sizes="(max-width: 767px) 50vw, 30vw"
                  className="hero-promo-image"
                />
                <span className="hero-promo-shade" />
                <span className="hero-promo-copy">
                  <small>{index === 0 ? "LayerZ chọn" : "Mới trong khu vực"}</small>
                  <strong>{product.name}</strong>
                  <span>Xem mẫu <ArrowRight size={14} aria-hidden="true" /></span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <nav className="intent-strip page-width" aria-label="Tìm bánh theo nhu cầu">
          {shoppingIntents.map((intent) => {
            const Icon = intent.icon;
            return (
              <a
                href={`https://layerz.vn/products?search=${encodeURIComponent(intent.query)}`}
                key={intent.label}
              >
                <Icon size={21} weight="duotone" aria-hidden="true" />
                <span>{intent.label}</span>
              </a>
            );
          })}
        </nav>

        {error ? <div className="page-width error-banner">{error}</div> : null}

        <section className="catalog-section page-width nearby-section" id="artisans">
          <div className="catalog-heading">
            <div className="title-lockup">
              <span className="section-index" aria-hidden="true">01</span>
              <div>
                <p className="section-eyebrow">Khám phá quanh bạn</p>
                <h2>Tiệm bánh đáng ghé <em>gần {displayLocation}</em></h2>
                <p className="section-note">Những tiệm có mẫu bánh thật, thông tin rõ và đang nhận đơn.</p>
              </div>
            </div>
            <a className="section-link" href="https://layerz.vn/artisans">
              Xem tất cả <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div className={`shop-grid ${loading ? "is-loading" : ""}`}>
            {catalog.shops.slice(0, 4).map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        </section>

        <section className="catalog-section suggested-section" id="suggested">
          <div className="page-width">
            <div className="catalog-heading catalog-heading-tabs">
              <div className="title-lockup">
                <span className="section-index" aria-hidden="true">02</span>
                <div>
                  <p className="section-eyebrow">Biên tập thủ công</p>
                  <h2>Một tuyển tập riêng <em>cho {displayLocation}</em></h2>
                  <p className="section-note">Được ghim thủ công theo khu vực, dịp và thời điểm.</p>
                </div>
              </div>
              <div className="section-tabs" aria-label="Đi đến nhóm sản phẩm">
                <a className="is-active" href="#suggested">Được chọn</a>
                <a href="#new">Mới nhất</a>
              </div>
            </div>
            {catalog.featuredProducts.length ? (
              <div className={`featured-grid ${loading ? "is-loading" : ""}`}>
                {catalog.featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Cake size={34} weight="duotone" aria-hidden="true" />
                <h3>Chưa có bánh được ghim tại đây</h3>
                <p>LayerZ sẽ tự chuyển sang bánh phổ biến và bánh mới nhất để bạn luôn có gợi ý.</p>
              </div>
            )}
          </div>
        </section>

        {catalog.expressProducts.length ? (
          <section className="express-banner page-width" aria-labelledby="express-title">
            <div className="express-copy">
              <span className="express-icon"><Lightning size={24} weight="fill" aria-hidden="true" /></span>
              <p className="section-eyebrow">Lựa chọn nhanh</p>
              <h2 id="express-title">Cần một chiếc bánh sớm?</h2>
              <p>Các mẫu dưới đây đang được đánh dấu hỗ trợ đơn nhanh trong dữ liệu của tiệm.</p>
              <a className="section-link" href="https://layerz.vn/products?sort=nearest">
                Xem bánh giao nhanh <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div className="express-products">
              {catalog.expressProducts.map((product) => (
                <a href={productUrl(product)} key={product.id}>
                  <span className="express-thumb">
                    <Image src={product.thumbnail} alt={product.name} fill unoptimized sizes="112px" />
                  </span>
                  <strong>{product.name}</strong>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="new-section" id="new">
          <div className="page-width">
            <div className="catalog-heading">
              <div className="title-lockup">
                <span className="section-index section-index-green" aria-hidden="true">03</span>
                <div>
                  <p className="section-eyebrow new-eyebrow"><Sparkle size={15} weight="fill" aria-hidden="true" /> Vừa cập nhật tại {displayLocation}</p>
                  <h2>Vừa lên kệ, <em>đang chờ bạn chọn.</em></h2>
                  <p className="section-note">Những mẫu mới nhất từ các tiệm đang hoạt động trong khu vực.</p>
                </div>
              </div>
              <a className="section-link new-link" href="https://layerz.vn/products?sort=newest">
                Xem tất cả <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div className={`new-products-grid ${loading ? "is-loading" : ""}`}>
              {catalog.newProducts.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} badge="Mới lên" />
              ))}
            </div>
          </div>
        </section>

        <section className="configurator-section page-width" id="design-your-cake">
          <div className="configurator-copy">
            <p className="section-eyebrow">04 / Xưởng thiết kế 3D</p>
            <h2>Thiết kế chiếc bánh của riêng bạn.</h2>
            <p>Chọn dáng bánh, màu sắc và trang trí trong trình thiết kế 3D trước khi gửi yêu cầu cho tiệm.</p>
            <a className="button button-primary" href="https://layerz.vn/configurator-3d">
              Mở trình thiết kế 3D <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="configurator-visual">
            <Image
              src="/images/hero-cake.png"
              alt="Mẫu bánh màu ivory dùng làm cảm hứng thiết kế"
              fill
              sizes="(max-width: 767px) 100vw, 52vw"
              className="configurator-image"
            />
          </div>
        </section>

        <section className="catalog-section page-width inspiration-section">
          <div className="catalog-heading">
            <div className="title-lockup">
              <span className="section-index" aria-hidden="true">05</span>
              <div>
                <p className="section-eyebrow">Chọn theo khoảnh khắc</p>
                <h2>Chọn một dịp, <em>tìm đúng chiếc bánh.</em></h2>
                <p className="section-note">Đi từ câu chuyện bạn muốn kể, thay vì một mã sản phẩm.</p>
              </div>
            </div>
          </div>
          <div className="inspiration-grid">
            {inspirationProducts.map((product, index) => (
              <a className="inspiration-card" href={productUrl(product)} key={product.id}>
                <Image src={product.thumbnail} alt={product.name} fill unoptimized sizes="(max-width: 767px) 100vw, 33vw" />
                <span className="inspiration-shade" />
                <span>
                  <small>Bộ sưu tập</small>
                  <strong>{occasionLabels[index]}</strong>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="trust-section">
          <div className="page-width trust-grid">
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

      <footer className="site-footer">
        <div className="page-width footer-inner">
          <div>
            <a className="brand footer-brand" href="#top">LayerZ<span>.</span></a>
            <p>Bánh thủ công, được chọn theo nơi bạn sống và cách bạn muốn kỷ niệm.</p>
          </div>
          <div className="footer-links">
            <a href="https://layerz.vn/products">Mua bánh</a>
            <a href="https://layerz.vn/artisans">Tiệm bánh</a>
            <a href="https://layerz.vn/configurator-3d">Thiết kế 3D</a>
            <a href="https://layerz.vn/contact">Liên hệ</a>
          </div>
          <div className="footer-meta">
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

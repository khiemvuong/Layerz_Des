"use client";

import { Check, MapPin, X } from "@phosphor-icons/react";
import type { FormEvent } from "react";
import type { LocationOption } from "@/lib/catalog";

type LocationModalProps = {
  open: boolean;
  locations: LocationOption[];
  province: string;
  district: string;
  otherLocation: string;
  notificationOptIn: boolean;
  onProvinceChange: (province: string, district: string) => void;
  onDistrictChange: (district: string) => void;
  onOtherLocationChange: (value: string) => void;
  onNotificationOptInChange: (value: boolean) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LocationModal({
  open,
  locations,
  province,
  district,
  otherLocation,
  notificationOptIn,
  onProvinceChange,
  onDistrictChange,
  onOtherLocationChange,
  onNotificationOptInChange,
  onClose,
  onSubmit,
}: LocationModalProps) {
  if (!open) return null;

  const selectedLocation = locations.find((item) => item.province === province);
  const isOther = province === "Khác";
  const canSubmit = isOther
    ? Boolean(otherLocation.trim())
    : Boolean(selectedLocation && (!selectedLocation.requiresDistrict || district));

  return (
    <div className="fixed inset-0 z-50 grid animate-[fade-in_200ms_ease_both] place-items-center overflow-y-auto bg-ink/50 p-6 backdrop-blur-xl max-md:items-end max-md:p-2.5 motion-reduce:animate-none motion-reduce:backdrop-blur-none" role="presentation">
      <section className="relative w-[min(100%,40.625rem)] animate-[modal-rise_420ms_cubic-bezier(0.16,1,0.3,1)_both] rounded-[1.125rem] border border-white/45 bg-panel p-10 shadow-[0_1.375rem_4.375rem_rgba(91,65,38,0.12)] max-md:max-h-[calc(100dvh-1.125rem)] max-md:overflow-y-auto max-md:rounded-[1.125rem] max-md:px-5 max-md:pb-5 max-md:pt-8 motion-reduce:animate-none" role="dialog" aria-modal="true" aria-labelledby="location-title">
        <button className="absolute right-4 top-4 grid size-9.5 cursor-pointer place-items-center rounded-full border border-line bg-card text-ink transition hover:border-gold focus-visible:outline-3 focus-visible:outline-gold/50 focus-visible:outline-offset-2" type="button" onClick={onClose} aria-label="Đóng">
          <X size={20} aria-hidden="true" />
        </button>
        <div className="mb-5 grid size-11 place-items-center rounded-full bg-gold-pale text-gold-deep" aria-hidden="true">
          <MapPin size={22} weight="duotone" />
        </div>
        <p className="mb-2 text-[0.625rem] font-extrabold uppercase tracking-[0.16em] text-gold-deep">Chọn nơi bạn muốn nhận bánh</p>
        <h2 className="mt-2 max-w-125 text-balance font-serif text-[clamp(2.25rem,6vw,3.125rem)] font-semibold leading-none tracking-[-0.035em]" id="location-title">Hôm nay bạn đang ở đâu?</h2>
        <p className="mb-6 mt-3 max-w-130 text-xs leading-[1.65] text-muted">
          LayerZ sẽ ưu tiên tiệm gần bạn và ghi nhận nhu cầu để mở thêm khu vực phù hợp.
        </p>

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-2.5 max-md:grid-cols-1">
            {locations.map((location) => {
              const active = location.province === province;
              return (
                <button
                  className={`flex min-h-12.5 cursor-pointer items-center justify-between gap-3 rounded-[0.625rem] border px-4 text-left text-xs font-bold text-ink transition active:translate-y-px ${active ? "border-gold bg-gold-pale" : "border-line bg-card hover:border-gold hover:bg-gold-pale"}`}
                  type="button"
                  key={location.province}
                  onClick={() =>
                    onProvinceChange(
                      location.province,
                      location.requiresDistrict ? "" : location.districts[0] ?? "",
                    )
                  }
                >
                  <span>{location.label}</span>
                  {active ? <Check size={18} weight="bold" aria-hidden="true" /> : null}
                </button>
              );
            })}
            <button
              className={`flex min-h-12.5 cursor-pointer items-center justify-between gap-3 rounded-[0.625rem] border px-4 text-left text-xs font-bold text-ink transition active:translate-y-px ${isOther ? "border-gold bg-gold-pale" : "border-line bg-card hover:border-gold hover:bg-gold-pale"}`}
              type="button"
              onClick={() => onProvinceChange("Khác", "")}
            >
              <span>Khu vực khác</span>
              {isOther ? <Check size={18} weight="bold" aria-hidden="true" /> : null}
            </button>
          </div>

          {selectedLocation?.requiresDistrict ? (
            <label className="mt-4 grid gap-2 text-[0.6875rem] font-extrabold text-ink">
              <span>Quận hoặc thành phố</span>
              <select className="h-12 w-full rounded-[0.625rem] border border-[#cdbda8] bg-white px-3.5 text-[0.8125rem] text-ink" value={district} onChange={(event) => onDistrictChange(event.target.value)}>
                <option value="">Chọn khu vực cụ thể</option>
                {selectedLocation.districts.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {isOther ? (
            <div>
              <label className="mt-4 grid gap-2 text-[0.6875rem] font-extrabold text-ink">
                <span>Tỉnh thành hoặc quận của bạn</span>
                <input
                  className="h-12 w-full rounded-[0.625rem] border border-[#cdbda8] bg-white px-3.5 text-[0.8125rem] text-ink placeholder:text-[#81715d]"
                  value={otherLocation}
                  onChange={(event) => onOtherLocationChange(event.target.value)}
                  placeholder="Ví dụ: Biên Hòa, Long An"
                  autoFocus
                />
                <small className="text-[0.625rem] font-medium text-muted">Thông tin này giúp LayerZ ưu tiên khu vực tiếp theo.</small>
              </label>
              <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-[0.6875rem] font-semibold text-muted">
                <input
                  className="size-4 accent-gold-deep"
                  type="checkbox"
                  checked={notificationOptIn}
                  onChange={(event) => onNotificationOptInChange(event.target.checked)}
                />
                <span>Báo cho tôi khi LayerZ có tiệm tại đây</span>
              </label>
            </div>
          ) : null}

          <button className="mt-5.5 inline-flex min-h-11 w-full items-center justify-center rounded-[0.625rem] border border-gold bg-gold px-4.5 text-[0.6875rem] font-extrabold text-ink transition hover:-translate-y-0.5 hover:bg-gold-deep active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!canSubmit}>
            Xem bánh gần tôi
          </button>
        </form>
      </section>
    </div>
  );
}

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
    <div className="modal-backdrop" role="presentation">
      <section className="location-modal" role="dialog" aria-modal="true" aria-labelledby="location-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Đóng">
          <X size={20} aria-hidden="true" />
        </button>
        <div className="modal-icon" aria-hidden="true">
          <MapPin size={22} weight="duotone" />
        </div>
        <p className="modal-kicker">Chọn nơi bạn muốn nhận bánh</p>
        <h2 id="location-title">Hôm nay bạn đang ở đâu?</h2>
        <p className="modal-intro">
          LayerZ sẽ ưu tiên tiệm gần bạn và ghi nhận nhu cầu để mở thêm khu vực phù hợp.
        </p>

        <form onSubmit={onSubmit}>
          <div className="location-options">
            {locations.map((location) => {
              const active = location.province === province;
              return (
                <button
                  className={`location-option ${active ? "is-active" : ""}`}
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
              className={`location-option ${isOther ? "is-active" : ""}`}
              type="button"
              onClick={() => onProvinceChange("Khác", "")}
            >
              <span>Khu vực khác</span>
              {isOther ? <Check size={18} weight="bold" aria-hidden="true" /> : null}
            </button>
          </div>

          {selectedLocation?.requiresDistrict ? (
            <label className="field-block">
              <span>Quận hoặc thành phố</span>
              <select value={district} onChange={(event) => onDistrictChange(event.target.value)}>
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
            <div className="other-location-fields">
              <label className="field-block">
                <span>Tỉnh thành hoặc quận của bạn</span>
                <input
                  value={otherLocation}
                  onChange={(event) => onOtherLocationChange(event.target.value)}
                  placeholder="Ví dụ: Biên Hòa, Long An"
                  autoFocus
                />
                <small>Thông tin này giúp LayerZ ưu tiên khu vực tiếp theo.</small>
              </label>
              <label className="notification-option">
                <input
                  type="checkbox"
                  checked={notificationOptIn}
                  onChange={(event) => onNotificationOptInChange(event.target.checked)}
                />
                <span>Báo cho tôi khi LayerZ có tiệm tại đây</span>
              </label>
            </div>
          ) : null}

          <button className="button button-primary modal-submit" type="submit" disabled={!canSubmit}>
            Xem bánh gần tôi
          </button>
        </form>
      </section>
    </div>
  );
}

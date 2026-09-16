"use client";

import { Cake } from "@phosphor-icons/react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="route-error">
      <Cake size={40} weight="duotone" aria-hidden="true" />
      <h1>Trang bánh chưa thể mở</h1>
      <p>Vui lòng thử tải lại. Dữ liệu của bạn vẫn được giữ nguyên.</p>
      <button className="button button-primary" type="button" onClick={reset}>
        Thử lại
      </button>
    </main>
  );
}

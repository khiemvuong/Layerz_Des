"use client";

import { Cake } from "@phosphor-icons/react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center content-center gap-4 bg-panel p-6 text-center text-gold-deep">
      <Cake size={40} weight="duotone" aria-hidden="true" />
      <h1 className="m-0 font-serif text-[clamp(2.625rem,6vw,3.875rem)] font-semibold tracking-[-0.035em] text-ink">Trang bánh chưa thể mở</h1>
      <p className="mb-2.5 mt-0 text-muted">Vui lòng thử tải lại. Dữ liệu của bạn vẫn được giữ nguyên.</p>
      <button className="inline-flex min-h-11 items-center justify-center rounded-[0.625rem] border border-gold bg-gold px-[1.125rem] text-[0.6875rem] font-extrabold text-ink transition hover:-translate-y-0.5 hover:bg-gold-deep active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={reset}>
        Thử lại
      </button>
    </main>
  );
}

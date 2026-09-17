export default function Loading() {
  return (
    <main className="grid min-h-dvh place-items-center content-center gap-4 bg-panel p-6 text-center" aria-label="Đang tải nội dung">
      <div className="h-4 w-36 animate-pulse rounded-full bg-line" />
      <div className="h-16 w-[min(90vw,40rem)] animate-pulse rounded-full bg-gold-pale" />
      <div className="h-4 w-[min(86vw,26rem)] animate-pulse rounded-full bg-line" />
    </main>
  );
}

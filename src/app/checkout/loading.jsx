export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 bg-bg px-4 py-8">
      <div className="h-10 w-1/2 animate-pulse rounded bg-card" />
      <div className="h-12 w-full animate-pulse rounded-lg bg-card" />
      <div className="h-12 w-full animate-pulse rounded-lg bg-card" />
      <div className="h-12 w-full animate-pulse rounded-lg bg-card" />
      <div className="h-12 w-full animate-pulse rounded-lg bg-card" />
      <div className="h-32 w-full animate-pulse rounded-2xl bg-card" />
      <div className="h-14 w-full animate-pulse rounded bg-card" />
    </div>
  );
}

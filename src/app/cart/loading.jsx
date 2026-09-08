export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-bg px-4 py-8">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-hairline py-4"
        >
          <div className="h-20 w-20 flex-shrink-0 animate-pulse rounded-xl bg-card" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-40 animate-pulse rounded bg-card" />
            <div className="h-4 w-20 animate-pulse rounded bg-card" />
          </div>
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-card" />
        </div>
      ))}
      <div className="mt-6 h-40 w-full animate-pulse rounded-2xl bg-card" />
    </div>
  );
}

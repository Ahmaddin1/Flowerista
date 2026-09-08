export default function Loading() {
  return (
    <div className="flex min-h-screen bg-[#000000]">
      <div className="w-64 h-screen bg-[#282828] flex flex-col gap-4 p-6 flex-shrink-0">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-5 w-3/4 rounded bg-[#3a3a3a] animate-pulse" />
        ))}
      </div>
      <div className="flex-1 p-6 flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#282828] animate-pulse" />
          ))}
        </div>
        <div className="h-8 w-full rounded bg-[#282828] animate-pulse" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-12 w-full rounded bg-[#282828] animate-pulse border-b border-[#1a1a1a]" />
        ))}
      </div>
    </div>
  );
}

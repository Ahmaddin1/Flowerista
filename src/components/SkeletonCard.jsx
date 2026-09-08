"use client";

function SkeletonCard() {
  return (
    <div className="card-surface p-2">
      <div className="aspect-[3/4] rounded-[16px] bg-hairline/40 animate-pulse" />

      <div className="px-2 pb-2 pt-3">
        <div className="h-2 w-1/3 rounded-sm bg-card-border animate-pulse" />
        <div className="mt-2 h-4 w-4/5 rounded-sm bg-card-border animate-pulse" />

        <div className="mt-3 flex items-center justify-between">
          <div className="h-4 w-1/4 rounded-sm bg-hairline animate-pulse" />
          <div className="h-[10px] w-[10px] rounded-full bg-card-border animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-[10px] md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export default SkeletonCard;

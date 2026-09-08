export default function Loading() {
  return (
    <div className="min-h-screen bg-bg px-4 pt-8 pb-8 md:px-10 lg:px-20">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Image Gallery Skeleton */}
        <div className="flex flex-row gap-3">
          {/* Thumbnail Column */}
          <div className="w-18 shrink-0">
            <div className="flex flex-col gap-2">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="relative aspect-3/4 w-full animate-pulse overflow-hidden rounded-[10px] border border-card-border bg-card-border"
                />
              ))}
            </div>
          </div>

          {/* Main Image */}
          <div className="relative aspect-3/4 flex-1 animate-pulse overflow-hidden rounded-[20px] border border-card-border bg-card-border" />
        </div>

        {/* Product Info Skeleton */}
        <div className="flex flex-col gap-4">
          {/* Breadcrumb */}
          <div className="h-3 w-48 animate-pulse rounded bg-card-border" />

          {/* Product Name */}
          <div className="h-10 w-3/4 animate-pulse rounded bg-card-border" />

          {/* Price */}
          <div className="h-8 w-32 animate-pulse rounded bg-card-border" />

          {/* Quantity Section */}
          <div className="mt-2 flex items-center gap-4">
            <div className="h-3 w-16 animate-pulse rounded bg-card-border" />
            <div className="h-9 w-9 animate-pulse rounded-full border border-card-border bg-card-border" />
            <div className="h-5 w-8 animate-pulse rounded bg-card-border" />
            <div className="h-9 w-9 animate-pulse rounded-full border border-card-border bg-card-border" />
          </div>

          {/* Add to Cart Button */}
          <div className="h-14 w-full animate-pulse rounded-pill bg-card-border" />

          {/* Description */}
          <div>
            <div className="mb-2 h-3 w-32 animate-pulse rounded bg-card-border" />
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-card-border" />
              <div className="h-3 w-full animate-pulse rounded bg-card-border" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-card-border" />
            </div>
          </div>

          {/* Accordion Sections */}
          <div>
            <div className="rounded-card border border-card-border bg-card">
              <div className="flex w-full items-center justify-between px-4 py-4">
                <div className="h-4 w-20 animate-pulse rounded bg-card-border" />
                <div className="h-4 w-4 animate-pulse rounded bg-card-border" />
              </div>
            </div>

            <div className="mt-3 rounded-card border border-card-border bg-card">
              <div className="flex w-full items-center justify-between px-4 py-4">
                <div className="h-4 w-32 animate-pulse rounded bg-card-border" />
                <div className="h-4 w-4 animate-pulse rounded bg-card-border" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

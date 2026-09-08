import { SkeletonGrid } from "@/components/SkeletonCard";

export default function Loading() {
  return (
    <div className="p-4 bg-bg">
      <SkeletonGrid count={8} />
    </div>
  );
}

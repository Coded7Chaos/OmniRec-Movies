export function RowSkeleton() {
  return (
    <div className="px-4 sm:px-8">
      <div className="skeleton mb-4 h-7 w-56 rounded-lg" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="w-40 shrink-0 sm:w-44">
            <div className="skeleton aspect-2/3 rounded-xl" />
            <div className="skeleton mt-2 h-4 w-3/4 rounded" />
            <div className="skeleton mt-1.5 h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return <div className="skeleton h-[78vh] min-h-[480px] w-full" />;
}

export function GridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-2/3 rounded-xl" />
          <div className="skeleton mt-2 h-4 w-3/4 rounded" />
          <div className="skeleton mt-1.5 h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';

export const JobCardSkeleton = () => {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4 flex-1">
          <Skeleton className="w-16 h-16 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-2 flex flex-col items-end">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>

      {/* Job Details */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Skills */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-24 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
      </div>
    </div>
  );
};

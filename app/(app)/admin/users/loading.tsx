import Skeleton from "@/components/ui/Skeleton";

export default function AdminUsersLoading() {
  return (
    <div>
      <Skeleton className="h-6 w-24" />
      <Skeleton className="mt-2 h-4 w-80" />
      <Skeleton className="mt-4 mb-4 h-9 w-full max-w-md" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

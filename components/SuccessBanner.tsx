export default function SuccessBanner({ message }: { message: string }) {
  return (
    <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>
  );
}

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      <div className="h-8 w-40 rounded-md bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-96 rounded-xl bg-muted" />
    </div>
  );
}

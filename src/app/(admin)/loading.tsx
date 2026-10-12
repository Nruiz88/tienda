export default function Cargando() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-md bg-panel-2" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-panel-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-borde bg-panel" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-borde bg-panel" />
    </div>
  );
}

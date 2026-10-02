export function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="mb-4 rounded-lg border border-rose-300 border-l-4 border-l-rose-500 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
      Error: {message}
    </div>
  );
}

export function LoadingBanner() {
  return (
    <div role="status" className="mb-4 flex items-center gap-2.5 rounded-lg border border-indigo-200 border-l-4 border-l-indigo-500 bg-indigo-50 px-3.5 py-2.5 text-sm text-indigo-700">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
      </span>
      Cargando…
    </div>
  );
}

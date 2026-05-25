export function AbstractBlueArt() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white" />
      <div className="absolute -right-24 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-blue-500/15 blur-2xl" />
      <div className="absolute -right-10 top-10 h-[260px] w-[260px] rounded-full bg-blue-600/20 blur-xl" />
      <div className="absolute right-12 bottom-14 h-[220px] w-[220px] rotate-12 rounded-3xl bg-blue-500/10 blur-lg" />
      <div className="absolute left-8 top-10 rounded-2xl border bg-white/70 p-4 shadow-soft backdrop-blur">
        <div className="h-2 w-28 rounded bg-blue-500/70" />
        <div className="mt-3 h-2 w-40 rounded bg-slate-200" />
        <div className="mt-2 h-2 w-32 rounded bg-slate-200" />
      </div>
    </div>
  );
}

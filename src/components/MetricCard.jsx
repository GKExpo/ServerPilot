export function MetricCard({ icon: Icon, label, value, accent = 'text-neon' }) {
  return (
    <div className="rounded-lg border border-line bg-panel/80 p-4 shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(52,241,123,0.15)]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">{label}</span>
        {Icon && <Icon className={`h-5 w-5 ${accent}`} />}
      </div>
      <div className="mt-3 text-2xl font-semibold text-zinc-100">{value}</div>
    </div>
  );
}

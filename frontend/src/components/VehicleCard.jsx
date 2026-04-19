export default function VehicleCard({ vehicle, onClick }) {
  const yearDisplay = vehicle.year_start === vehicle.year_end
    ? vehicle.year_start
    : `${vehicle.year_start}–${vehicle.year_end}`;

  return (
    <button
      onClick={onClick}
      className="group relative rounded-3xl border border-neutral-800/60
                 bg-gradient-to-br from-neutral-900/40 to-neutral-900/60
                 p-6 text-left shadow-xl hover:shadow-2xl
                 hover:border-amber-400/40 transition-all duration-300
                 backdrop-blur-sm overflow-hidden w-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          {/* Year — brighter color, larger font */}
          <div className="text-xs font-medium tracking-[0.15em] text-amber-400/80 mb-1 uppercase">
            {yearDisplay}
          </div>

          <div className="text-xl font-semibold text-neutral-50 tracking-tight">
            {vehicle.make}
          </div>

          <div className="text-neutral-300">{vehicle.model}</div>
        </div>

        <div className="flex items-center justify-center h-8 w-8
                     rounded-full border border-amber-400/40
                     bg-amber-500/10 text-amber-300
                     group-hover:bg-amber-500/20 group-hover:border-amber-400/60
                     transition-all flex-shrink-0">
          →
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        {vehicle.drivetrain && (
          <span className="px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-400">
            {vehicle.drivetrain}
          </span>
        )}
      </div>
    </button>
  );
}
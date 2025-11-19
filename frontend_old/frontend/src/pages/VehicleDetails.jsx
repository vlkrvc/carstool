import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Droplet,
  Wrench,
  AlertCircle,
  Gauge,
  Zap,
} from "lucide-react";
import { fetchVehicle } from "../api/vehicles";

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral:
      "border-neutral-700/80 bg-neutral-900/60 text-neutral-300",
    subtle:
      "border-neutral-800/60 bg-neutral-900/40 text-neutral-400",
    amber:
      "border-amber-400/40 bg-amber-500/10 text-amber-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.15em] font-medium backdrop-blur-sm ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export default function VehicleDetails({ vehicleId, onBack }) {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!vehicleId) return;

    setLoading(true);
    setError("");

    (async () => {
      try {
        const data = await fetchVehicle(vehicleId);
        setVehicle(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load vehicle details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [vehicleId]);

  if (!vehicleId) return null;

  if (loading) {
    return (
      <section className="py-10">
        <p className="text-neutral-400 text-sm">Loading vehicle...</p>
      </section>
    );
  }

  if (error || !vehicle) {
    return (
      <section className="py-10 space-y-4">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500 hover:text-amber-300 transition-colors font-medium"
        >
          <ArrowLeft
            size={12}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back
        </button>
        <p className="text-sm text-red-300">{error || "Vehicle not found."}</p>
      </section>
    );
  }

  const trims = vehicle.trims || [];
  const engines = vehicle.engines || [];
  const fluids = vehicle.fluids || [];
  const maintenance = vehicle.maintenance || [];
  const issues = vehicle.common_issues || [];

  return (
    <section className="space-y-8 py-10">
      {}
      <div className="flex flex-col gap-4">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500 hover:text-amber-300 transition-colors font-medium w-fit"
        >
          <ArrowLeft
            size={12}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to results
        </button>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-50 tracking-tight">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <div className="flex flex-wrap gap-2">
            {vehicle.drivetrain && (
              <Badge tone="neutral">{vehicle.drivetrain}</Badge>
            )}
            {vehicle.body_style && (
              <Badge tone="subtle">{vehicle.body_style}</Badge>
            )}
            {trims.length > 0 && (
              <Badge tone="amber">
                {trims.length} trim{trims.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="grid gap-6 lg:grid-cols-2">
        {}
        <div className="space-y-6">
          {}
          <div className="rounded-3xl border border-neutral-800/60 bg-gradient-to-br from-neutral-900/40 to-neutral-900/60 p-6 backdrop-blur-sm shadow-xl">
            <h2 className="text-sm font-semibold text-neutral-100 mb-4 tracking-tight flex items-center gap-2">
              <Gauge size={16} className="text-amber-400" />
              Overview
            </h2>

            <div className="space-y-3 text-sm text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-500">Year</span>
                <span>{vehicle.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Make</span>
                <span>{vehicle.make}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Model</span>
                <span>{vehicle.model}</span>
              </div>
              {vehicle.drivetrain && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Drivetrain</span>
                  <span>{vehicle.drivetrain}</span>
                </div>
              )}
            </div>

            {engines.length > 0 && (
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-[0.16em]">
                  <Zap size={14} className="text-amber-400" />
                  Powertrain
                </div>
                <div className="space-y-2">
                  {engines.map((e, i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-neutral-950/60 border border-neutral-800/40 px-4 py-3 text-sm"
                    >
                      <div className="text-neutral-100 font-medium mb-1">
                        {e.engine_name}
                      </div>
                      <div className="text-[11px] text-neutral-500 flex gap-2">
                        {e.horsepower && <span>{e.horsepower} hp</span>}
                        {e.horsepower && e.torque && <span>•</span>}
                        {e.torque && <span>{e.torque} Nm</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {}
          <div className="rounded-3xl border border-neutral-800/60 bg-gradient-to-br from-neutral-900/40 to-neutral-900/60 p-6 backdrop-blur-sm shadow-xl">
            <h2 className="text-sm font-semibold text-neutral-100 mb-4 tracking-tight flex items-center gap-2">
              <Droplet size={16} className="text-amber-400" />
              Fluid Specifications
            </h2>

            {fluids.length === 0 ? (
              <p className="text-xs text-neutral-500">
                No documented fluid specifications for this vehicle yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                {fluids.map((f, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-neutral-800/40 bg-neutral-950/60 px-4 py-3 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-neutral-100">
                        {f.system}
                      </span>
                      {f.capacity_liters != null && (
                        <span className="text-[11px] text-neutral-500">
                          {Number(f.capacity_liters).toFixed(1)} L
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-300 mb-1">
                      {f.spec}
                    </div>
                    {f.notes && (
                      <div className="text-[11px] text-neutral-500 mt-2 pt-2 border-t border-neutral-800/40">
                        {f.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {}
        <div className="space-y-6">
          {}
          <div className="rounded-3xl border border-neutral-800/60 bg-gradient-to-br from-neutral-900/40 to-neutral-900/60 p-6 backdrop-blur-sm shadow-xl">
            <h2 className="text-sm font-semibold text-neutral-100 mb-4 tracking-tight flex items-center gap-2">
              <Wrench size={16} className="text-amber-400" />
              Maintenance Schedule
            </h2>

            {maintenance.length === 0 ? (
              <p className="text-xs text-neutral-500">
                No maintenance items recorded for this vehicle yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                {maintenance.map((m, i) => {
                  const sev = (m.severity || "").toLowerCase();
                  const sevStyles = {
                    high: "text-red-300 border-red-500/40 bg-red-500/10",
                    medium:
                      "text-amber-300 border-amber-400/40 bg-amber-500/10",
                    low: "text-emerald-300 border-emerald-400/40 bg-emerald-500/10",
                  };
                  const sevLabel =
                    sev.charAt(0).toUpperCase() + sev.slice(1) || "Info";

                  return (
                    <div
                      key={i}
                      className="rounded-2xl border border-neutral-800/40 bg-neutral-950/60 px-4 py-3.5 backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-sm font-medium text-neutral-50">
                            {m.name}
                          </div>
                          {m.code && (
                            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 mt-0.5">
                              {m.code}
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-medium ${sevStyles[sev] || "border-neutral-700/70 text-neutral-300 bg-neutral-900/60"}`}
                        >
                          {sevLabel}
                        </span>
                      </div>

                      {m.details && (
                        <div className="text-xs text-neutral-400 mb-2 leading-relaxed">
                          {m.details}
                        </div>
                      )}

                      {m.interval && (
                        <div className="text-[11px] text-neutral-500 flex flex-wrap gap-2">
                          {m.interval.miles_every && (
                            <span>
                              Every {m.interval.miles_every.toLocaleString()} mi
                            </span>
                          )}
                          {m.interval.months_every && (
                            <span>
                              Every {m.interval.months_every} months
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {}
          <div className="rounded-3xl border border-neutral-800/60 bg-gradient-to-br from-neutral-900/40 to-neutral-900/60 p-6 backdrop-blur-sm shadow-xl">
            <h2 className="text-sm font-semibold text-neutral-100 mb-4 tracking-tight flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-400" />
              Common Issues
            </h2>

            {issues.length === 0 ? (
              <p className="text-xs text-neutral-500">
                No documented common issues for this vehicle yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {issues.map((i, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-neutral-800/40 bg-neutral-950/60 px-4 py-3 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium text-neutral-100 text-sm">
                        {i.title}
                      </span>
                      {i.ts && (
                        <span className="text-[10px] text-neutral-600 whitespace-nowrap">
                          {new Date(i.ts).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 mb-2 leading-relaxed">
                      {i.description}
                    </div>
                    {i.severity && (
                      <span className="text-[10px] text-amber-400 uppercase tracking-wider font-medium">
                        {i.severity} severity
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(23, 23, 23, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(115, 115, 115, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(163, 163, 163, 0.7);
        }
      `}</style>
    </section>
  );
}

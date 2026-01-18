import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
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
        console.log("Vehicle data:", data); 
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

  // Format year display
  const yearDisplay = vehicle.year_start === vehicle.year_end 
    ? vehicle.year_start 
    : `${vehicle.year_start}-${vehicle.year_end}`;
  
  const trims = vehicle.trims || [];
  const engines = vehicle.engines || [];
  const drivetrains = vehicle.drivetrains || [];
  const maintenance = vehicle.maintenance || [];
  const issues = vehicle.issues || []; 

  return (
    <section className="space-y-8 py-10">
      {/* Back button + Header */}
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
            {yearDisplay} {vehicle.make} {vehicle.model}
          </h1>
          <div className="flex flex-wrap gap-2">
            {drivetrains.length > 0 && drivetrains.map((dt, i) => (
              <Badge key={i} tone="neutral">{dt}</Badge>
            ))}
            {trims.length > 0 && (
              <Badge tone="amber">
                {trims.length} trim{trims.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Overview card */}
          <div className="rounded-3xl border border-neutral-800/60 bg-gradient-to-br from-neutral-900/40 to-neutral-900/60 p-6 backdrop-blur-sm shadow-xl">
            <h2 className="text-sm font-semibold text-neutral-100 mb-4 tracking-tight flex items-center gap-2">
              <Gauge size={16} className="text-amber-400" />
              Overview
            </h2>

            <div className="space-y-3 text-sm text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-500">Years</span>
                <span>{yearDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Make</span>
                <span>{vehicle.make}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Model</span>
                <span>{vehicle.model}</span>
              </div>
              {drivetrains.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Drivetrain</span>
                  <span>{drivetrains.join(", ")}</span>
                </div>
              )}
            </div>

            {engines.length > 0 && (
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-[0.16em]">
                  <Zap size={14} className="text-amber-400" />
                  Powertrain Options
                </div>
                <div className="space-y-2">
                  {engines.map((e, i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-neutral-950/60 border border-neutral-800/40 px-4 py-3 text-sm"
                    >
                      <div className="text-neutral-100 font-medium">
                        {e.engine_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trims.length > 0 && (
              <div className="mt-5 space-y-2">
                <div className="text-xs text-neutral-400 uppercase tracking-[0.16em]">
                  Available Trims
                </div>
                <div className="flex flex-wrap gap-2">
                  {trims.map((t, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full bg-neutral-950/60 border border-neutral-800/40 text-xs text-neutral-300"
                    >
                      {t.trim_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Maintenance card */}
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
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {maintenance.map((m, i) => {
                  return (
                    <div
                      key={i}
                      className="rounded-2xl border border-neutral-800/40 bg-neutral-950/60 px-4 py-3.5 backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="text-sm font-medium text-neutral-50">
                          {m.name}
                        </div>
                      </div>

                      {m.details && (
                        <div className="text-xs text-neutral-400 mb-2 leading-relaxed">
                          {m.details}
                        </div>
                      )}

                      <div className="text-[11px] text-neutral-500 flex flex-wrap gap-2">
                        {m.interval_miles && (
                          <span>
                            Every {m.interval_miles.toLocaleString()} mi
                          </span>
                        )}
                        {m.interval_miles && m.interval_months && (
                          <span>•</span>
                        )}
                        {m.interval_months && (
                          <span>
                            Every {m.interval_months} months
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Issues card */}
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
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {issues.map((issue, idx) => {
                  const sev = (issue.severity || "").toLowerCase();
                  const sevStyles = {
                    high: "text-red-300 border-red-500/40 bg-red-500/10",
                    medium: "text-amber-300 border-amber-400/40 bg-amber-500/10",
                    low: "text-emerald-300 border-emerald-400/40 bg-emerald-500/10",
                  };
                  const sevLabel = sev.charAt(0).toUpperCase() + sev.slice(1) || "Info";

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-neutral-800/40 bg-neutral-950/60 px-4 py-3 backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-medium text-neutral-100 text-sm">
                          {issue.issue}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-medium ${sevStyles[sev] || "border-neutral-700/70 text-neutral-300 bg-neutral-900/60"}`}
                        >
                          {sevLabel}
                        </span>
                      </div>
                      {issue.details && (
                        <div className="text-xs text-neutral-400 leading-relaxed">
                          {issue.details}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
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
// src/pages/Garage.jsx
import { useState, useEffect } from "react";
import { Car, Plus, Trash2, AlertTriangle, CheckCircle, Clock, HelpCircle, Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchGarage, addToGarage, removeFromGarage, updateMileage, fetchServiceLog, addServiceLog } from "../api/auth";
import { fetchVehicles } from "../api/vehicles";

// ── Status badge ──────────────────────────────────────────
function StatusBadge({ status, milesUntilDue }) {
  const configs = {
    due: {
      icon: <AlertTriangle size={11} />,
      label: milesUntilDue !== null ? `${Math.abs(milesUntilDue).toLocaleString()} mi overdue` : "Due",
      className: "text-red-300 border-red-500/40 bg-red-500/10",
    },
    due_soon: {
      icon: <Clock size={11} />,
      label: `Due in ${milesUntilDue?.toLocaleString()} mi`,
      className: "text-amber-300 border-amber-400/40 bg-amber-500/10",
    },
    ok: {
      icon: <CheckCircle size={11} />,
      label: `${milesUntilDue?.toLocaleString()} mi to go`,
      className: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
    },
    unknown: {
      icon: <HelpCircle size={11} />,
      label: "Not logged yet",
      className: "text-neutral-400 border-neutral-700/60 bg-neutral-800/40",
    },
  };

  const cfg = configs[status] || configs.unknown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ── Add Vehicle Modal ─────────────────────────────────────
function AddVehicleModal({ onClose, onAdd }) {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [nickname, setNickname] = useState("");
  const [mileage, setMileage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVehicles().then(setVehicles);
  }, []);

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      String(v.year_start).includes(q)
    );
  });

  const handleAdd = async () => {
    if (!selected) { setError("Select a vehicle"); return; }
    if (!mileage || isNaN(Number(mileage))) { setError("Enter valid mileage"); return; }
    setLoading(true);
    try {
      await onAdd(selected.id, nickname, Number(mileage));
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-neutral-800/60 bg-neutral-900 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-50">Add to Garage</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 transition-colors text-xl leading-none">×</button>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">{error}</div>
        )}

        {/* Vehicle search */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.16em] text-neutral-500">Search Vehicle</label>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
            placeholder="e.g. Toyota Camry, Honda Civic…"
            className="w-full rounded-2xl bg-neutral-950/60 border border-neutral-800/60 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
          />
          {search && !selected && (
            <div className="max-h-48 overflow-y-auto rounded-2xl border border-neutral-800/60 bg-neutral-950 divide-y divide-neutral-800/40">
              {filtered.slice(0, 12).map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setSelected(v); setSearch(`${v.year_start}-${v.year_end} ${v.make} ${v.model}`); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/40 transition-colors"
                >
                  {v.year_start === v.year_end ? v.year_start : `${v.year_start}-${v.year_end}`} {v.make} {v.model}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-3 text-sm text-neutral-500">No vehicles found</div>
              )}
            </div>
          )}
        </div>

        {/* Nickname */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.16em] text-neutral-500">Nickname <span className="text-neutral-600">(optional)</span></label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. My Daily Driver"
            className="w-full rounded-2xl bg-neutral-950/60 border border-neutral-800/60 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
          />
        </div>

        {/* Mileage */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.16em] text-neutral-500">Current Mileage</label>
          <input
            type="number"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            placeholder="e.g. 45000"
            className="w-full rounded-2xl bg-neutral-950/60 border border-neutral-800/60 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-neutral-700 text-neutral-400 text-sm py-3 hover:text-neutral-200 hover:border-neutral-600 transition-all">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="flex-1 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm py-3 transition-all disabled:opacity-50"
          >
            {loading ? "Adding…" : "Add Vehicle"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Log Service Modal ─────────────────────────────────────
function LogServiceModal({ garageEntry, onClose, onLogged }) {
  const { token } = useAuth();
  const [maintenanceId, setMaintenanceId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [mileage, setMileage] = useState(String(garageEntry.current_mileage));
  const [notes, setNotes] = useState("");
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!maintenanceId) { setError("Select a maintenance item"); return; }
    setLoading(true);
    try {
      await addServiceLog(token, garageEntry.id, {
        maintenance_id: Number(maintenanceId),
        service_date: date,
        mileage: Number(mileage),
        notes: notes || null,
        cost: cost ? Number(cost) : null,
      });
      onLogged();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800/60 bg-neutral-900 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-50">Log Service</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 text-xl leading-none">×</button>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">{error}</div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.16em] text-neutral-500">Service Item</label>
            <select
              value={maintenanceId}
              onChange={(e) => setMaintenanceId(e.target.value)}
              className="w-full rounded-2xl bg-neutral-950/60 border border-neutral-800/60 px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
            >
              <option value="">Select item…</option>
              {garageEntry.maintenance_due.map((m) => (
                <option key={m.maintenance_id} value={m.maintenance_id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.16em] text-neutral-500">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl bg-neutral-950/60 border border-neutral-800/60 px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.16em] text-neutral-500">Mileage</label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="w-full rounded-2xl bg-neutral-950/60 border border-neutral-800/60 px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.16em] text-neutral-500">Cost <span className="text-neutral-600">(optional)</span></label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="$0.00"
              className="w-full rounded-2xl bg-neutral-950/60 border border-neutral-800/60 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.16em] text-neutral-500">Notes <span className="text-neutral-600">(optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Shop name, parts used, etc."
              rows={2}
              className="w-full rounded-2xl bg-neutral-950/60 border border-neutral-800/60 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-neutral-700 text-neutral-400 text-sm py-3 hover:text-neutral-200 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm py-3 transition-all disabled:opacity-50"
          >
            {loading ? "Logging…" : "Log Service"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Garage Card ───────────────────────────────────────────
function GarageCard({ entry, onRemove, onRefresh }) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [editingMileage, setEditingMileage] = useState(false);
  const [newMileage, setNewMileage] = useState(String(entry.current_mileage));
  const [showLogModal, setShowLogModal] = useState(false);

  const yearDisplay = entry.year_start === entry.year_end
    ? entry.year_start
    : `${entry.year_start}–${entry.year_end}`;

  const dueCount = entry.maintenance_due.filter((m) => m.status === "due").length;
  const dueSoonCount = entry.maintenance_due.filter((m) => m.status === "due_soon").length;

  const handleMileageSave = async () => {
    try {
      await updateMileage(token, entry.id, Number(newMileage));
      setEditingMileage(false);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-neutral-800/60 bg-gradient-to-br from-neutral-900/40 to-neutral-900/60 backdrop-blur-sm shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1">{yearDisplay}</div>
              <h3 className="text-xl font-semibold text-neutral-50">{entry.make} {entry.model}</h3>
              {entry.nickname && (
                <div className="text-sm text-amber-400/80 mt-0.5">{entry.nickname}</div>
              )}
            </div>
            <button
              onClick={() => onRemove(entry.id)}
              className="text-neutral-600 hover:text-red-400 transition-colors p-1"
            >
              <Trash2 size={15} />
            </button>
          </div>

          {/* Mileage */}
          <div className="flex items-center gap-3">
            {editingMileage ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={newMileage}
                  onChange={(e) => setNewMileage(e.target.value)}
                  className="w-32 rounded-xl bg-neutral-950/60 border border-amber-400/40 px-3 py-1.5 text-sm text-neutral-100 focus:outline-none"
                  autoFocus
                />
                <button onClick={handleMileageSave} className="text-xs text-amber-400 hover:text-amber-300">Save</button>
                <button onClick={() => setEditingMileage(false)} className="text-xs text-neutral-500 hover:text-neutral-300">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => setEditingMileage(true)}
                className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors group"
              >
                <span className="text-neutral-100 font-medium">{entry.current_mileage.toLocaleString()} mi</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-600 group-hover:text-amber-400 transition-colors">update</span>
              </button>
            )}
          </div>

          {/* Summary badges */}
          <div className="flex flex-wrap gap-2">
            {dueCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 text-red-300 px-3 py-1 text-[10px] font-medium">
                <AlertTriangle size={10} />
                {dueCount} item{dueCount > 1 ? "s" : ""} due
              </span>
            )}
            {dueSoonCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 text-amber-300 px-3 py-1 text-[10px] font-medium">
                <Clock size={10} />
                {dueSoonCount} due soon
              </span>
            )}
            {dueCount === 0 && dueSoonCount === 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 px-3 py-1 text-[10px] font-medium">
                <CheckCircle size={10} />
                All up to date
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 hover:bg-amber-500/20 px-3 py-2 text-xs font-medium transition-all"
            >
              <Wrench size={12} />
              Log Service
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 rounded-xl bg-neutral-800/40 border border-neutral-700/40 text-neutral-400 hover:text-neutral-200 px-3 py-2 text-xs font-medium transition-all"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Hide" : "Show"} maintenance
            </button>
          </div>
        </div>

        {/* Expanded maintenance list */}
        {expanded && (
          <div className="border-t border-neutral-800/60 divide-y divide-neutral-800/40 max-h-80 overflow-y-auto">
            {entry.maintenance_due.map((m) => (
              <div key={m.maintenance_id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm text-neutral-200 font-medium truncate">{m.name}</div>
                  {m.notes && (
                    <div className="text-[11px] text-amber-300/70 mt-0.5 truncate">{m.notes}</div>
                  )}
                  {m.last_service_mileage && (
                    <div className="text-[11px] text-neutral-600 mt-0.5">
                      Last: {m.last_service_mileage.toLocaleString()} mi
                    </div>
                  )}
                </div>
                <StatusBadge status={m.status} milesUntilDue={m.miles_until_due} />
              </div>
            ))}
          </div>
        )}
      </div>

      {showLogModal && (
        <LogServiceModal
          garageEntry={entry}
          onClose={() => setShowLogModal(false)}
          onLogged={onRefresh}
        />
      )}
    </>
  );
}

// ── Main Garage Page ──────────────────────────────────────
export default function Garage() {
  const { token, user } = useAuth();
  const [garage, setGarage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadGarage = async () => {
    try {
      const data = await fetchGarage(token);
      setGarage(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGarage(); }, []);

  const handleAdd = async (vehicleId, nickname, mileage) => {
    await addToGarage(token, vehicleId, nickname, mileage);
    await loadGarage();
  };

  const handleRemove = async (garageId) => {
    if (!confirm("Remove this vehicle from your garage?")) return;
    await removeFromGarage(token, garageId);
    await loadGarage();
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-neutral-400 text-sm">Loading your garage…</div>
    );
  }

  return (
    <>
      <section className="space-y-8 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-neutral-50 tracking-tight">My Garage</h1>
            <p className="text-neutral-400 text-sm mt-2">
              {garage.length === 0
                ? "Add your vehicles to track maintenance"
                : `${garage.length} vehicle${garage.length > 1 ? "s" : ""} tracked`}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm px-4 py-2.5 transition-all"
          >
            <Plus size={15} />
            Add Vehicle
          </button>
        </div>

        {garage.length === 0 ? (
          <div className="rounded-3xl border border-neutral-800/40 border-dashed p-16 flex flex-col items-center gap-4 text-center">
            <Car size={40} className="text-neutral-700" />
            <div>
              <p className="text-neutral-400 font-medium">No vehicles yet</p>
              <p className="text-neutral-600 text-sm mt-1">Add your first vehicle to start tracking maintenance</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm px-5 py-2.5 transition-all"
            >
              Add Vehicle
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {garage.map((entry) => (
              <GarageCard
                key={entry.id}
                entry={entry}
                onRemove={handleRemove}
                onRefresh={loadGarage}
              />
            ))}
          </div>
        )}
      </section>

      {showAddModal && (
        <AddVehicleModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </>
  );
}

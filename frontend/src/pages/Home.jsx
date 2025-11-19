import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { fetchVehicles } from "../api/vehicles";
import VehicleCard from "../components/VehicleCard";

export default function Home({ onSelectVehicle }) {
  const [vehicles, setVehicles] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles()
      .then((data) => {
        setVehicles(data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = vehicles.filter((v) => {
    const q = query.toLowerCase();
    return (
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      String(v.year).includes(q)
    );
  });

  if (loading) {
    return (
      <div className="py-20 text-center text-neutral-400">
        Loading vehicles…
      </div>
    );
  }

  return (
    <section className="space-y-10 py-10">

      {}
      <div className="space-y-4">
        <h1 className="text-5xl font-bold text-neutral-50 tracking-tight">
          Carstool
        </h1>
        <p className="text-neutral-400 text-sm max-w-xl">
          Search for your vehicle to see factory maintenance schedules, fluids,
          known issues, and more.
        </p>
      </div>

      {}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by make, model, or year…"
            className="w-full rounded-2xl bg-neutral-900/60 border border-neutral-800/60 
                       pl-11 pr-4 py-3.5 text-sm text-neutral-100 placeholder:text-neutral-500
                       focus:outline-none focus:ring-2 focus:ring-amber-400/40 
                       focus:border-amber-400/60 backdrop-blur-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-400"></div>
          {filtered.length} vehicles
        </div>
      </div>

      {}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            onClick={() => onSelectVehicle(v.id)}
          />
        ))}
      </div>
    </section>
  );
}

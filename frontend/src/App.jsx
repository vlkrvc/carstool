import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import VehicleDetails from "./pages/VehicleDetails";
import { useState } from "react";

export default function App() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {selectedId ? (
          <VehicleDetails
            vehicleId={selectedId}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <Home onSelectVehicle={setSelectedId} />
        )}
      </main>
    </div>
  );
}

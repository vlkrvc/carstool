
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import VehicleDetails from "./pages/VehicleDetails";
import Garage from "./pages/Garage";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  const { user, loading } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState("home"); // "home" | "garage"
  const [authPage, setAuthPage] = useState("login"); // "login" | "register"

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-500 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user && page === "garage") {
    return authPage === "login"
      ? <Login onSwitchToRegister={() => setAuthPage("register")} onBack={() => setPage("home")} />
      : <Register onSwitchToLogin={() => setAuthPage("login")} onBack={() => setPage("home")} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Navbar page={page} onNavigate={(p) => { setPage(p); setSelectedId(null); }} />
      <main className="max-w-7xl mx-auto px-6 py-10">
        {page === "garage" ? (
          <Garage />
        ) : selectedId ? (
          <VehicleDetails vehicleId={selectedId} onBack={() => setSelectedId(null)} />
        ) : (
          <Home onSelectVehicle={setSelectedId} />
        )}
      </main>
    </div>
  );
}

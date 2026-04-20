import { useState, useEffect } from "react";
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
  const [page, setPage] = useState("home");
  const [authPage, setAuthPage] = useState("login");

  // Push state to browser history when navigation changes
  useEffect(() => {
    const state = { page, selectedId };
    const url = selectedId
      ? `/?vehicle=${selectedId}`
      : page === "garage"
      ? "/garage"
      : "/";
    window.history.pushState(state, "", url);
  }, [page, selectedId]);

  // Listen for browser back/forward button
  useEffect(() => {
    const handlePop = (e) => {
      if (e.state) {
        setPage(e.state.page || "home");
        setSelectedId(e.state.selectedId || null);
      } else {
        setPage("home");
        setSelectedId(null);
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  // Navigate to a page
  const navigateTo = (newPage) => {
    setSelectedId(null);
    setPage(newPage);
  };

  // Select a vehicle
  const selectVehicle = (id) => {
    setSelectedId(id);
    setPage("home");
  };

  // Go back to browse
  const goBack = () => {
    setSelectedId(null);
    setPage("home");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-500 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user && page === "garage") {
    return authPage === "login"
      ? <Login
          onSwitchToRegister={() => setAuthPage("register")}
          onBack={() => navigateTo("home")}
        />
      : <Register
          onSwitchToLogin={() => setAuthPage("login")}
          onBack={() => navigateTo("home")}
        />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Navbar page={page} onNavigate={navigateTo} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {page === "garage" ? (
          <Garage />
        ) : selectedId ? (
          <VehicleDetails
            vehicleId={selectedId}
            onBack={goBack}
          />
        ) : (
          <Home onSelectVehicle={selectVehicle} />
        )}
      </main>
    </div>
  );
}
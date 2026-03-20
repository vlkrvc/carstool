import { useAuth } from "../context/AuthContext";
import { Car, Search, LogOut } from "lucide-react";
import Logo from "./Logo";

export default function Navbar({ page, onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-900/60">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Logo onClick={() => onNavigate("home")} />

        {/* Nav + user */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("home")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              page === "home"
                ? "text-neutral-100 bg-neutral-800/60"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Search size={14} />
            Browse
          </button>

          <button
            onClick={() => onNavigate("garage")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              page === "garage"
                ? "text-neutral-100 bg-neutral-800/60"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Car size={14} />
            Garage
          </button>

          <div className="w-px h-5 bg-neutral-800 mx-1" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400 hidden md:block">{user?.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-neutral-500 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Car, LogOut, Menu, X } from "lucide-react";
import Logo from "./Logo";

export default function Navbar({ page, onNavigate }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (p) => {
    onNavigate(p);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

        <Logo onClick={() => handleNav("home")} />

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => handleNav("garage")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              page === "garage"
                ? "text-neutral-100 bg-neutral-800/60"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Car size={14} />
            Garage
          </button>

          {user && (
            <>
              <div className="w-px h-5 bg-neutral-800 mx-1" />
              <span className="text-sm text-neutral-400 hidden md:block">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-neutral-500 hover:text-red-400 transition-colors"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>

        {/* Mobile nav */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-2 rounded-xl text-neutral-500 hover:text-neutral-200 transition-colors"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-neutral-900/60 bg-neutral-950/95 backdrop-blur-xl px-4 py-4 space-y-2">
          <button
            onClick={() => handleNav("garage")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
              page === "garage"
                ? "text-neutral-100 bg-neutral-800/60"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30"
            }`}
          >
            <Car size={16} />
            My Garage
          </button>

          {user && (
            <>
              <div className="h-px bg-neutral-800/60 my-2" />
              <div className="px-4 py-2 text-xs text-neutral-600 uppercase tracking-[0.16em]">
                Signed in as {user.name}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
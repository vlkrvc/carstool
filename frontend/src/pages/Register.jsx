// src/pages/Register.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRegister } from "../api/auth";
import Logo from "../components/Logo";

export default function Register({ onSwitchToLogin, onBack }) {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const data = await apiRegister(email, password, name);
      login(data.token, data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">

        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500 hover:text-amber-300 transition-colors font-medium"
          >
            ← Back to browse
          </button>
        )}

        <Logo onClick={onBack || null} />

        {/* Card */}
        <div className="rounded-3xl border border-neutral-800/60 bg-gradient-to-br from-neutral-900/40 to-neutral-900/60 p-8 backdrop-blur-sm shadow-xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-50 tracking-tight">Create account</h1>
            <p className="text-sm text-neutral-500 mt-1">Start tracking your vehicles</p>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.16em] text-neutral-500">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl bg-neutral-900/60 border border-neutral-800/60 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/60 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.16em] text-neutral-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl bg-neutral-900/60 border border-neutral-800/60 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/60 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.16em] text-neutral-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Min. 8 characters"
                className="w-full rounded-2xl bg-neutral-900/60 border border-neutral-800/60 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/60 transition-all"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </div>

          <p className="text-sm text-neutral-500 text-center">
            Already have an account?{" "}
            <button onClick={onSwitchToLogin} className="text-amber-400 hover:text-amber-300 transition-colors">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

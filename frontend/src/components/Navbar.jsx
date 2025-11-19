import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="
      sticky top-0 z-50 
      bg-neutral-950/80 
      backdrop-blur-xl 
      border-b border-neutral-900/60
    ">
      <div className="
        max-w-7xl mx-auto 
        px-6 py-4 
        flex items-center justify-between
      ">
        {}
        <Link to="/" className="flex items-center gap-4 group">
          <div className="
            relative h-10 w-10 
            rounded-2xl 
            bg-gradient-to-br from-amber-500 via-amber-400 to-amber-300
            shadow-xl shadow-amber-500/40
            transition-transform duration-300
            group-hover:scale-[1.04]
          ">
            <div className="
              absolute inset-[2px] 
              rounded-[14px] 
              bg-gradient-to-br from-amber-400 to-amber-500
            " />
          </div>

          <div className="leading-tight">
            <div className="text-[9px] uppercase tracking-[0.28em] text-neutral-500 font-medium">
              CARSTOOL
            </div>
            <div className="text-[13px] font-semibold text-neutral-100 tracking-tight">
              Service Intelligence
            </div>
          </div>
        </Link>

        {}
        <div className="hidden md:flex items-center gap-4">
          
        </div>
      </div>
    </header>
  );
}

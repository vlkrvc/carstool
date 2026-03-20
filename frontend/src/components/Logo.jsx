// src/components/Logo.jsx
export default function Logo({ onClick, size = 40 }) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick || undefined}
      className={`flex items-center gap-3 group outline-none ${onClick ? "cursor-pointer" : "cursor-default"}`}
      aria-label={onClick ? "Go to home" : undefined}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 104 104"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 group-hover:scale-105 flex-shrink-0"
      >
        <rect width="104" height="104" rx="24" fill="#F59E0B"/>
        <rect x="8" y="8" width="88" height="88" rx="18" fill="#1c1917"/>
        <circle cx="52" cy="56" r="36" stroke="#3a3530" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="170 56" strokeDashoffset="-28" fill="none"/>
        <circle cx="52" cy="56" r="36" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="100 126" strokeDashoffset="-28" fill="none"/>
        <circle cx="52" cy="56" r="26" stroke="#2a2520" strokeWidth="3" strokeLinecap="round" strokeDasharray="122 41" strokeDashoffset="-20" fill="none"/>
        <circle cx="52" cy="56" r="26" stroke="rgba(255,255,255,0.2)" strokeWidth="3" strokeLinecap="round" strokeDasharray="55 108" strokeDashoffset="-20" fill="none"/>
        <line x1="52" y1="56" x2="74" y2="26" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="52" cy="56" r="5" fill="#F59E0B"/>
        <circle cx="52" cy="56" r="2" fill="#1c1917"/>
      </svg>

      <div className="leading-tight">
        <div className="text-[9px] uppercase tracking-[0.28em] text-neutral-500 font-medium">
          CARSTOOL
        </div>
        <div className="text-[13px] font-semibold text-neutral-100 tracking-tight group-hover:text-amber-300 transition-colors">
          Service Intelligence
        </div>
      </div>
    </Wrapper>
  );
}

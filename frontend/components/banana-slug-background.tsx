export function BananaSlugBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
      {/* Top left slug */}
      <svg 
        className="absolute top-10 left-10 w-32 h-20 text-[#d4a574] rotate-[-20deg]"
        viewBox="0 0 120 60" 
        fill="currentColor"
      >
        <ellipse cx="60" cy="35" rx="55" ry="20" />
        <ellipse cx="15" cy="25" rx="8" ry="5" />
        <ellipse cx="25" cy="20" rx="8" ry="5" />
        <circle cx="10" cy="22" r="3" className="fill-[#2d4a5e]" />
        <circle cx="20" cy="17" r="3" className="fill-[#2d4a5e]" />
      </svg>
      
      {/* Top right slug */}
      <svg 
        className="absolute top-20 right-20 w-40 h-24 text-[#e8c89e] rotate-[15deg]"
        viewBox="0 0 120 60" 
        fill="currentColor"
      >
        <ellipse cx="60" cy="35" rx="55" ry="20" />
        <ellipse cx="15" cy="25" rx="8" ry="5" />
        <ellipse cx="25" cy="20" rx="8" ry="5" />
        <circle cx="10" cy="22" r="3" className="fill-[#2d4a5e]" />
        <circle cx="20" cy="17" r="3" className="fill-[#2d4a5e]" />
      </svg>
      
      {/* Middle left slug */}
      <svg 
        className="absolute top-1/3 left-5 w-28 h-16 text-[#d4a574] rotate-[30deg]"
        viewBox="0 0 120 60" 
        fill="currentColor"
      >
        <ellipse cx="60" cy="35" rx="55" ry="20" />
        <ellipse cx="15" cy="25" rx="8" ry="5" />
        <ellipse cx="25" cy="20" rx="8" ry="5" />
        <circle cx="10" cy="22" r="3" className="fill-[#2d4a5e]" />
        <circle cx="20" cy="17" r="3" className="fill-[#2d4a5e]" />
      </svg>
      
      {/* Center right slug */}
      <svg 
        className="absolute top-1/2 right-10 w-36 h-20 text-[#e8c89e] rotate-[-25deg]"
        viewBox="0 0 120 60" 
        fill="currentColor"
      >
        <ellipse cx="60" cy="35" rx="55" ry="20" />
        <ellipse cx="15" cy="25" rx="8" ry="5" />
        <ellipse cx="25" cy="20" rx="8" ry="5" />
        <circle cx="10" cy="22" r="3" className="fill-[#2d4a5e]" />
        <circle cx="20" cy="17" r="3" className="fill-[#2d4a5e]" />
      </svg>
      
      {/* Bottom left slug */}
      <svg 
        className="absolute bottom-20 left-20 w-44 h-28 text-[#d4a574] rotate-[10deg]"
        viewBox="0 0 120 60" 
        fill="currentColor"
      >
        <ellipse cx="60" cy="35" rx="55" ry="20" />
        <ellipse cx="15" cy="25" rx="8" ry="5" />
        <ellipse cx="25" cy="20" rx="8" ry="5" />
        <circle cx="10" cy="22" r="3" className="fill-[#2d4a5e]" />
        <circle cx="20" cy="17" r="3" className="fill-[#2d4a5e]" />
      </svg>
      
      {/* Bottom right slug */}
      <svg 
        className="absolute bottom-10 right-32 w-32 h-20 text-[#e8c89e] rotate-[-10deg]"
        viewBox="0 0 120 60" 
        fill="currentColor"
      >
        <ellipse cx="60" cy="35" rx="55" ry="20" />
        <ellipse cx="15" cy="25" rx="8" ry="5" />
        <ellipse cx="25" cy="20" rx="8" ry="5" />
        <circle cx="10" cy="22" r="3" className="fill-[#2d4a5e]" />
        <circle cx="20" cy="17" r="3" className="fill-[#2d4a5e]" />
      </svg>

      {/* Shell decorations */}
      <svg 
        className="absolute top-40 left-1/4 w-16 h-16 text-[#d4a574] rotate-[45deg]"
        viewBox="0 0 50 50" 
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M25 5 Q45 25 25 45 Q5 25 25 5" />
        <path d="M25 10 Q40 25 25 40" />
        <path d="M25 15 Q35 25 25 35" />
      </svg>
      
      <svg 
        className="absolute bottom-40 right-1/4 w-20 h-20 text-[#e8c89e] rotate-[-30deg]"
        viewBox="0 0 50 50" 
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M25 5 Q45 25 25 45 Q5 25 25 5" />
        <path d="M25 10 Q40 25 25 40" />
        <path d="M25 15 Q35 25 25 35" />
      </svg>
    </div>
  )
}

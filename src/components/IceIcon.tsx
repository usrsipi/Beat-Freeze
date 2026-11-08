import React from 'react';

interface IceIconProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const IceIcon: React.FC<IceIconProps> = ({
  className = '',
  size = 56,
  glow = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${glow ? 'drop-shadow-[0_0_16px_rgba(0,245,255,0.7)]' : ''} ${className}`}
      aria-label="Beat Freeze Ice Icon"
    >
      <defs>
        <linearGradient id="frostIceGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="35%" stopColor="#38bdf8" />
          <stop offset="70%" stopColor="#00f5ff" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="facetHighlight" x1="16" y1="12" x2="48" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="coreGlow" x1="32" y1="16" x2="32" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f5ff" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>

      {/* Outer Hexagonal Frost Matrix Crystal */}
      <polygon
        points="32,4 56,18 56,46 32,60 8,46 8,18"
        fill="#040c1a"
        stroke="url(#frostIceGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Internal Facet Triangular Shards */}
      {/* Top Center Shard */}
      <polygon points="32,4 32,32 8,18" fill="url(#facetHighlight)" />
      <polygon points="32,4 56,18 32,32" fill="#38bdf8" fillOpacity="0.3" />

      {/* Bottom Center Shard */}
      <polygon points="32,60 32,32 8,46" fill="#0284c7" fillOpacity="0.4" />
      <polygon points="32,60 56,46 32,32" fill="url(#coreGlow)" fillOpacity="0.25" />

      {/* Side Horizontal Crystal Wings */}
      <polygon points="8,18 32,32 8,46" fill="#0369a1" fillOpacity="0.5" />
      <polygon points="56,18 32,32 56,46" fill="url(#facetHighlight)" fillOpacity="0.6" />

      {/* Diamond Core Frost Prism */}
      <polygon
        points="32,16 46,32 32,48 18,32"
        fill="url(#coreGlow)"
        fillOpacity="0.75"
        stroke="#ffffff"
        strokeWidth="1.5"
      />

      {/* Sharp Accent Lines */}
      <line x1="32" y1="4" x2="32" y2="60" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="8" y1="18" x2="56" y2="46" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.4" />
      <line x1="8" y1="46" x2="56" y2="18" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.4" />

      {/* Central Spark */}
      <circle cx="32" cy="32" r="2.5" fill="#ffffff" />
    </svg>
  );
};

import React from "react";

interface FacultyLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export function FacultyLogo({ size = 32, className = "", ...props }: FacultyLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-label="FacultyOS logo"
      role="img"
      {...props}
    >
      <rect width="64" height="64" rx="16" fill="#18181B" stroke="#27272A" strokeWidth="1.5" />
      {/* Primary Left Monolith */}
      <rect x="16" y="16" width="9" height="32" rx="2" fill="#F4F4F5" />
      {/* Top Matrix Nodes */}
      <rect x="29" y="16" width="9" height="9" rx="2" fill="#8B5CF6" />
      <rect x="41" y="16" width="9" height="9" rx="2" fill="#A78BFA" />
      {/* Mid Matrix Node */}
      <rect x="29" y="28" width="9" height="9" rx="2" fill="#8B5CF6" />
      {/* Terminal Anchor */}
      <circle cx="33.5" cy="43.5" r="3.5" fill="#34D399" />
    </svg>
  );
}

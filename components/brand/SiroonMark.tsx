"use client";

import { useId } from "react";

export function SiroonMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const petal = `petal-${uid}`;
  const inner = `inner-${uid}`;
  const core = `core-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`shrink-0 rounded-[8px] ${className}`.trim()}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={petal}
          x1="18"
          y1="12"
          x2="46"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E8A0AA" />
          <stop offset="1" stopColor="#A34454" />
        </linearGradient>
        <linearGradient
          id={inner}
          x1="24"
          y1="22"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F0C4CA" />
          <stop offset="1" stopColor="#C45C6A" />
        </linearGradient>
        <radialGradient
          id={core}
          cx="32"
          cy="31"
          r="7"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F3EEE6" />
          <stop offset="0.55" stopColor="#C45C6A" />
          <stop offset="1" stopColor="#9A4554" />
        </radialGradient>
      </defs>

      <rect width="64" height="64" rx="14" fill="#FFFCF8" />
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="13"
        fill="none"
        stroke="#C45C6A"
        strokeOpacity="0.4"
      />

      <g fill={`url(#${petal})`}>
        <ellipse cx="32" cy="22" rx="9.2" ry="13.5" />
        <ellipse
          cx="32"
          cy="22"
          rx="9.2"
          ry="13.5"
          transform="rotate(45 32 32)"
        />
        <ellipse
          cx="32"
          cy="22"
          rx="9.2"
          ry="13.5"
          transform="rotate(90 32 32)"
        />
        <ellipse
          cx="32"
          cy="22"
          rx="9.2"
          ry="13.5"
          transform="rotate(135 32 32)"
        />
        <ellipse
          cx="32"
          cy="22"
          rx="9.2"
          ry="13.5"
          transform="rotate(180 32 32)"
        />
        <ellipse
          cx="32"
          cy="22"
          rx="9.2"
          ry="13.5"
          transform="rotate(225 32 32)"
        />
        <ellipse
          cx="32"
          cy="22"
          rx="9.2"
          ry="13.5"
          transform="rotate(270 32 32)"
        />
        <ellipse
          cx="32"
          cy="22"
          rx="9.2"
          ry="13.5"
          transform="rotate(315 32 32)"
        />
      </g>

      <g fill={`url(#${inner})`} opacity="0.95">
        <ellipse
          cx="32"
          cy="24.5"
          rx="6.8"
          ry="10.2"
          transform="rotate(22.5 32 32)"
        />
        <ellipse
          cx="32"
          cy="24.5"
          rx="6.8"
          ry="10.2"
          transform="rotate(67.5 32 32)"
        />
        <ellipse
          cx="32"
          cy="24.5"
          rx="6.8"
          ry="10.2"
          transform="rotate(112.5 32 32)"
        />
        <ellipse
          cx="32"
          cy="24.5"
          rx="6.8"
          ry="10.2"
          transform="rotate(157.5 32 32)"
        />
        <ellipse
          cx="32"
          cy="24.5"
          rx="6.8"
          ry="10.2"
          transform="rotate(202.5 32 32)"
        />
        <ellipse
          cx="32"
          cy="24.5"
          rx="6.8"
          ry="10.2"
          transform="rotate(247.5 32 32)"
        />
        <ellipse
          cx="32"
          cy="24.5"
          rx="6.8"
          ry="10.2"
          transform="rotate(292.5 32 32)"
        />
        <ellipse
          cx="32"
          cy="24.5"
          rx="6.8"
          ry="10.2"
          transform="rotate(337.5 32 32)"
        />
      </g>

      <circle cx="32" cy="32" r="9.2" fill="#FFFCF8" opacity="0.45" />
      <circle cx="32" cy="32" r="7" fill={`url(#${core})`} />
      <circle cx="30.2" cy="30.2" r="2.1" fill="#F3EEE6" opacity="0.55" />
    </svg>
  );
}

interface LogoEscudoProps {
  tamano?: number;
}

export default function LogoEscudo({ tamano = 64 }: LogoEscudoProps) {
  return (
    <svg
      width={tamano}
      height={Math.round(tamano * 1.125)}
      viewBox="0 0 64 72"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cs-escudo" x1="8" y1="4" x2="56" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 56 13v21c0 16-10 28-24 34C18 62 8 50 8 34V13z"
        fill="url(#cs-escudo)"
      />
      <path
        d="M32 12 49 18.5V34c0 12-7 21-17 26-10-5-17-14-17-26V18.5z"
        fill="#ffffff"
        fillOpacity="0.16"
      />
      <path
        d="m23 36 7 7 13-15"
        stroke="#ffffff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
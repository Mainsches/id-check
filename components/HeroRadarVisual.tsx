export default function HeroRadarVisual() {
  return (
    <div className="landing-radar-stage">
      <div className="landing-radar-ambient" aria-hidden="true" />
      <div className="landing-radar-glow" aria-hidden="true" />
      <svg
        className="landing-radar-svg"
        viewBox="0 0 320 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="landingRadarSweepGrad"
            x1="0"
            y1="0"
            x2="132"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="rgba(212,175,55,0)" offset="0" />
            <stop stopColor="rgba(212,175,55,0.14)" offset="0.12" />
            <stop stopColor="rgba(232,210,140,0.22)" offset="0.42" />
            <stop stopColor="rgba(212,175,55,0.1)" offset="0.78" />
            <stop stopColor="rgba(212,175,55,0)" offset="1" />
          </linearGradient>
          <linearGradient
            id="landingRadarSweepTrailGrad"
            x1="0"
            y1="0"
            x2="140"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="rgba(212,175,55,0)" offset="0" />
            <stop stopColor="rgba(212,175,55,0.06)" offset="0.35" />
            <stop stopColor="rgba(255,230,160,0.05)" offset="0.65" />
            <stop stopColor="rgba(212,175,55,0)" offset="1" />
          </linearGradient>
          <radialGradient id="landingRadarFace" cx="48%" cy="46%" r="54%">
            <stop offset="0%" stopColor="rgba(212,175,55,0.04)" />
            <stop offset="38%" stopColor="rgba(16,20,28,0.38)" />
            <stop offset="100%" stopColor="rgba(3,5,9,0.96)" />
          </radialGradient>
          <radialGradient id="landingRadarCoreBloom" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(212,175,55,0.14)" />
            <stop offset="55%" stopColor="rgba(212,175,55,0.03)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </radialGradient>
          <radialGradient id="landingRadarNodeHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(212,175,55,0.35)" />
            <stop offset="70%" stopColor="rgba(212,175,55,0.08)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </radialGradient>
        </defs>

        <circle cx="160" cy="160" r="148" fill="url(#landingRadarFace)" />

        <circle
          className="landing-radar-core-bloom"
          cx="160"
          cy="160"
          r="14"
          fill="url(#landingRadarCoreBloom)"
        />

        <circle
          cx="160"
          cy="160"
          r="140"
          stroke="rgba(255,255,255,0.065)"
          strokeWidth="1"
        />
        <circle
          cx="160"
          cy="160"
          r="112"
          stroke="rgba(255,255,255,0.048)"
          strokeWidth="1"
        />
        <circle
          cx="160"
          cy="160"
          r="78"
          stroke="rgba(255,255,255,0.038)"
          strokeWidth="1"
        />
        <circle
          cx="160"
          cy="160"
          r="44"
          stroke="rgba(255,255,255,0.032)"
          strokeWidth="1"
        />
        <circle
          cx="160"
          cy="160"
          r="22"
          stroke="rgba(212,175,55,0.075)"
          strokeWidth="1"
        />

        <line
          x1="160"
          y1="24"
          x2="160"
          y2="296"
          stroke="rgba(255,255,255,0.028)"
          strokeWidth="1"
        />
        <line
          x1="24"
          y1="160"
          x2="296"
          y2="160"
          stroke="rgba(255,255,255,0.028)"
          strokeWidth="1"
        />

        <g transform="translate(160 160)">
          <g className="landing-radar-sweep">
            <g
              className="landing-radar-sweep-trail"
              transform="rotate(-11)"
              opacity="0.85"
            >
              <path
                d="M0 0 L0 -126 A126 126 0 0 1 89.1 -89.1 Z"
                fill="url(#landingRadarSweepTrailGrad)"
              />
            </g>
            <path
              d="M0 0 L0 -124 A124 124 0 0 1 87.7 -87.7 Z"
              fill="url(#landingRadarSweepGrad)"
              opacity="0.88"
            />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-128"
              stroke="rgba(245,228,175,0.52)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
        </g>

        <g className="landing-radar-node landing-radar-node--a" transform="translate(226 120)">
          <circle r="10" fill="url(#landingRadarNodeHalo)" className="landing-radar-node-halo" />
          <circle r="3.4" fill="#d4bc6a" className="landing-radar-node-dot" />
        </g>
        <g className="landing-radar-node landing-radar-node--b" transform="translate(104 208)">
          <circle r="9" fill="url(#landingRadarNodeHalo)" className="landing-radar-node-halo" />
          <circle r="3" fill="#cbb87a" className="landing-radar-node-dot" />
        </g>
        <g className="landing-radar-node landing-radar-node--c" transform="translate(212 216)">
          <circle r="8" fill="url(#landingRadarNodeHalo)" className="landing-radar-node-halo" />
          <circle r="2.75" fill="#b89d4a" className="landing-radar-node-dot" />
        </g>
      </svg>

      <div className="landing-radar-chip">
        <span className="landing-radar-chip-dot" aria-hidden="true" />
        <span className="landing-radar-chip-label">Live-Signal</span>
      </div>
    </div>
  );
}

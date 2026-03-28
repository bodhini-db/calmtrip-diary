import { motion } from "framer-motion";

type CommonProps = { size?: number; nearEvolve?: boolean };

const breathTransition = { repeat: Infinity, repeatType: "reverse", duration: 3, ease: "easeInOut" };

export function FoxEgg({ size = 130, nearEvolve }: CommonProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      animate={{ scale: [1, 1.04, 1] }}
      transition={breathTransition}
      style={{ display: "block" }}
    >
      <motion.g animate={{ rotate: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
        <ellipse cx="100" cy="105" rx="52" ry="70" style={{ fill: "#FFF3E0", stroke: "#F97316", strokeWidth: 1.5 }} />
        <ellipse cx="100" cy="175" rx="45" ry="10" style={{ fill: "#000", opacity: 0.15 }} />
        <circle cx="78" cy="85" r="3" style={{ fill: "#F97316" }} />
        <circle cx="120" cy="92" r="3" style={{ fill: "#FB923C" }} />
        <circle cx="90" cy="120" r="3" style={{ fill: "#FDBA74" }} />
        <circle cx="110" cy="70" r="2.8" style={{ fill: "#F97316" }} />
        <circle cx="95" cy="95" r="2.5" style={{ fill: "#FB923C" }} />
        <path d="M85 160 L95 150 M105 150 L115 160" style={{ stroke: "#F97316", strokeWidth: 1.2, fill: "none", strokeLinecap: "round" }} />
        {nearEvolve && (
          <motion.path
            d="M85 160 L95 150 M105 150 L115 160"
            style={{ stroke: "#F97316", strokeWidth: 2, fill: "none", strokeLinecap: "round", opacity: 0.6 }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        )}
      </motion.g>
    </motion.svg>
  );
}

export function FoxHatchling({ size = 130 }: CommonProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      animate={{ scale: [1, 1.04, 1] }}
      transition={breathTransition}
      style={{ display: "block" }}
    >
      <motion.g animate={{ y: [-5, 0, -5] }} transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}>
        <path d="M60 150 C100 170,140 170,160 150 L155 160 C130 180,90 182,65 170 Z" style={{ fill: "#FFF3E0", stroke: "#F97316", strokeWidth: 1.5 }} />
        <circle cx="110" cy="115" r="26" style={{ fill: "#F97316" }} />
        <path d="M95 100 L110 88 L125 100" style={{ fill: "#F97316" }} />
        <path d="M103 97 L110 92 L117 97" style={{ fill: "#FED7AA" }} />
        <circle cx="106" cy="116" r="7" style={{ fill: "#0B0B0B" }} />
        <circle cx="124" cy="116" r="7" style={{ fill: "#0B0B0B" }} />
        <motion.circle cx="106" cy="116" r="7" style={{ fill: "#0B0B0B" }} animate={{ scaleY: [1, 0.05, 1] }} transition={{ repeat: Infinity, duration: 0.2, repeatDelay: 2.8 }} />
        <motion.circle cx="124" cy="116" r="7" style={{ fill: "#0B0B0B" }} animate={{ scaleY: [1, 0.05, 1] }} transition={{ repeat: Infinity, duration: 0.2, repeatDelay: 3 }} />
        <circle cx="128" cy="112" r="2" style={{ fill: "#FFFFFF" }} />
        <circle cx="110" cy="112" r="2" style={{ fill: "#FFFFFF" }} />
        <ellipse cx="115" cy="128" rx="10" ry="6" style={{ fill: "#FED7AA" }} />
        <circle cx="115" cy="128" r="2.2" style={{ fill: "#0B0B0B" }} />
      </motion.g>
    </motion.svg>
  );
}

export function FoxPup({ size = 130 }: CommonProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      animate={{ scale: [1, 1.04, 1], y: [-6, 0, -6] }}
      transition={{ ...breathTransition, duration: 2 }}
      style={{ display: "block" }}
    >
      <ellipse cx="105" cy="120" rx="48" ry="34" style={{ fill: "#F97316" }} />
      <ellipse cx="105" cy="130" rx="40" ry="20" style={{ fill: "#FFFFFF" }} />
      <rect x="70" y="145" width="16" height="10" rx="3" style={{ fill: "#0B0B0B" }} />
      <rect x="124" y="145" width="16" height="10" rx="3" style={{ fill: "#0B0B0B" }} />
      <circle cx="92" cy="110" r="6" style={{ fill: "#FFFFFF" }} />
      <circle cx="118" cy="110" r="6" style={{ fill: "#FFFFFF" }} />
      <motion.g
        style={{ transformOrigin: "140px 130px" }}
        animate={{ rotate: [-12, 12, -12] }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
      >
        <path d="M130 130 C155 120,170 110,165 95 C150 105,138 115,132 125 Z" style={{ fill: "#F97316" }} />
        <path d="M160 104 C170 98,175 95,174 92 C168 98,164 101,160 104 Z" style={{ fill: "#FFFFFF" }} />
      </motion.g>
    </motion.svg>
  );
}

export function FoxCub({ size = 130 }: CommonProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      animate={{ scale: [1, 1.04, 1], y: [-8, 0, -8] }}
      transition={{ ...breathTransition, duration: 1.8 }}
      style={{ display: "block" }}
    >
      <ellipse cx="110" cy="130" rx="48" ry="28" style={{ fill: "#F97316" }} />
      <path d="M90 120 L110 105 L130 120" style={{ fill: "#F97316" }} />
      <ellipse cx="110" cy="140" rx="36" ry="16" style={{ fill: "#FFFFFF" }} />
      <path d="M120 132 C145 120,160 112,156 98 C140 110,128 118,122 128 Z" style={{ fill: "#F97316" }} />
      <path d="M150 108 C160 102,165 98,164 96 C158 102,154 104,150 108 Z" style={{ fill: "#FFFFFF" }} />
      <path d="M98 122 C104 118,116 118,122 122" style={{ stroke: "#0B0B0B", strokeWidth: 1.2 }} />
      <path d="M92 126 L104 124 M92 130 L104 129 M92 134 L104 133" style={{ stroke: "#0B0B0B", strokeWidth: 1, strokeLinecap: "round" }} />
      <motion.circle cx="60" cy="70" r="4" style={{ fill: "#FDE68A" }} animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0 }} />
      <motion.circle cx="170" cy="60" r="4" style={{ fill: "#FDE68A" }} animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.4 }} />
      <motion.circle cx="100" cy="40" r="4" style={{ fill: "#FDE68A" }} animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.8 }} />
    </motion.svg>
  );
}

export function FoxAdult({ size = 130 }: CommonProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      animate={{ scale: [1, 1.04, 1], y: [-6, 0, -6] }}
      transition={{ ...breathTransition, duration: 2 }}
      style={{ display: "block" }}
    >
      <path d="M90 150 C92 130,92 110,100 100 C108 110,108 130,110 150 Z" style={{ fill: "#F97316" }} />
      <ellipse cx="105" cy="120" rx="22" ry="18" style={{ fill: "#FFFFFF" }} />
      <path d="M80 100 L100 80 L120 100" style={{ fill: "#F97316" }} />
      <path d="M88 92 C92 90,98 90,102 92 C98 94,92 94,88 92 Z" style={{ fill: "#FED7AA" }} />
      <path d="M72 110 C78 118,84 122,86 126 C80 124,74 120,70 114 Z" style={{ fill: "#F97316" }} />
      <path d="M128 110 C122 118,116 122,114 126 C120 124,126 120,130 114 Z" style={{ fill: "#F97316" }} />
      <motion.g
        style={{ transformOrigin: "150px 120px", filter: "drop-shadow(0 0 8px #FED7AA)" }}
        animate={{ rotate: [-10, 10, -10] }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
      >
        <path d="M140 120 C165 110,178 100,174 88 C160 98,148 106,142 115 Z" style={{ fill: "#F97316" }} />
        <motion.path d="M170 96 C178 92,182 90,182 88 C176 94,172 96,170 98 Z" style={{ fill: "#FED7AA" }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} />
      </motion.g>
      {[0, 0.3, 0.6, 0.9, 1.2].map((d, i) => (
        <motion.circle key={i} cx={70 + i * 22} cy={160} r="2.5" style={{ fill: "#F59E0B" }} animate={{ y: [0, -20], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut", delay: d }} />
      ))}
    </motion.svg>
  );
}

export function FoxElder({ size = 130 }: CommonProps) {
  const ringCirc = 2 * Math.PI * 70;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      animate={{ scale: [1, 1.04, 1] }}
      transition={breathTransition}
      style={{ display: "block" }}
    >
      <motion.circle
        cx="100"
        cy="100"
        r="70"
        style={{ fill: "none", stroke: "#FCD34D", strokeWidth: 3, strokeDasharray: ringCirc }}
        animate={{ strokeDashoffset: [0, ringCirc] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      />
      <g style={{ filter: "drop-shadow(0 0 14px #FCD34D)" }}>
        <path d="M90 150 C92 120,92 100,100 90 C108 100,108 120,110 150 Z" style={{ fill: "#DC2626" }} />
        <ellipse cx="105" cy="120" rx="22" ry="16" style={{ fill: "#FCD34D" }} />
        <path d="M80 92 L100 78 L120 92" style={{ fill: "#DC2626" }} />
        <path d="M92 70 L100 60 L108 70" style={{ fill: "#FCD34D" }} />
        <path d="M90 62 L100 50 L110 62 L100 66 Z" style={{ fill: "#FCD34D" }} />
        <motion.g style={{ transformOrigin: "150px 120px" }} animate={{ rotate: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0 }}>
          <path d="M140 120 C165 108,178 98,174 86 C160 96,148 104,142 115 Z" style={{ fill: "#DC2626" }} />
          <path d="M170 96 C178 92,182 90,182 88 C176 94,172 96,170 98 Z" style={{ fill: "#FCD34D" }} />
        </motion.g>
        <motion.g style={{ transformOrigin: "135px 125px" }} animate={{ rotate: [-8, 8, -8] }} transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.3 }}>
          <path d="M128 124 C150 114,162 106,160 94 C148 104,136 112,130 120 Z" style={{ fill: "#DC2626" }} />
          <path d="M154 100 C164 96,168 94,168 92 C162 98,158 100,154 102 Z" style={{ fill: "#FCD34D" }} />
        </motion.g>
        <motion.g style={{ transformOrigin: "120px 130px" }} animate={{ rotate: [-6, 6, -6] }} transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.6 }}>
          <path d="M116 128 C134 120,144 114,142 104 C132 112,124 118,118 126 Z" style={{ fill: "#DC2626" }} />
          <path d="M138 110 C146 106,150 104,150 102 C146 106,142 108,138 110 Z" style={{ fill: "#FCD34D" }} />
        </motion.g>
      </g>
      {[0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5].map((d, i) => (
        <motion.circle key={i} cx={60 + i * 18} cy={165} r="2.5" style={{ fill: "#FCD34D" }} animate={{ y: [0, -24], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 2.8, ease: "easeOut", delay: d }} />
      ))}
    </motion.svg>
  );
}

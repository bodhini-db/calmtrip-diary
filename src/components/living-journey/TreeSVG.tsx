import { motion } from "framer-motion";

export function TreeSeed() {
  return (
    <motion.svg width="120" height="120" viewBox="0 0 120 120" animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}>
      <ellipse cx="60" cy="80" rx="10" ry="14" style={{ fill: "#8b5e3c" }} />
      <circle cx="60" cy="64" r="3" style={{ fill: "#16a34a" }} />
    </motion.svg>
  );
}

export function TreeSprout() {
  return (
    <motion.svg width="120" height="120" viewBox="0 0 120 120" animate={{ rotate: [0, 1, -1, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
      <rect x="58" y="72" width="4" height="24" style={{ fill: "#8b5e3c" }} />
      <path d="M62 86 C74 82,74 78,62 76 Z" style={{ fill: "#16a34a" }} />
      <path d="M58 80 C46 76,46 72,58 70 Z" style={{ fill: "#22c55e" }} />
    </motion.svg>
  );
}

export function TreeSapling() {
  return (
    <motion.svg width="120" height="120" viewBox="0 0 120 120">
      <rect x="58" y="64" width="4" height="32" style={{ fill: "#8b5e3c" }} />
      <path d="M62 78 C76 74,76 70,62 68 Z" style={{ fill: "#16a34a" }} />
      <path d="M58 72 C44 68,44 64,58 62 Z" style={{ fill: "#22c55e" }} />
      <circle cx="60" cy="56" r="3" style={{ fill: "#f43f5e" }} />
    </motion.svg>
  );
}

export function TreeYoung() {
  return (
    <motion.svg width="120" height="120" viewBox="0 0 120 120" animate={{ y: [0, -1.5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
      <rect x="54" y="60" width="12" height="36" style={{ fill: "#8b5e3c" }} />
      <ellipse cx="60" cy="52" rx="26" ry="16" style={{ fill: "#16a34a" }} />
      <circle cx="48" cy="46" r="2" style={{ fill: "#0ea5e9" }} />
      <circle cx="72" cy="48" r="2" style={{ fill: "#0ea5e9" }} />
    </motion.svg>
  );
}

export function TreeFull() {
  return (
    <motion.svg width="120" height="120" viewBox="0 0 120 120" animate={{ y: [0, -1.5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
      <rect x="52" y="56" width="16" height="40" style={{ fill: "#8b5e3c" }} />
      <ellipse cx="60" cy="44" rx="32" ry="22" style={{ fill: "#16a34a" }} />
      <circle cx="48" cy="40" r="3" style={{ fill: "#ef4444" }} />
      <circle cx="72" cy="42" r="3" style={{ fill: "#ef4444" }} />
      <motion.circle cx="64" cy="36" r="2" style={{ fill: "#f59e0b" }} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} />
    </motion.svg>
  );
}

export function TreeAncient() {
  return (
    <motion.svg width="120" height="120" viewBox="0 0 120 120" animate={{ y: [0, -1, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
      <path d="M40 96 C50 72,70 72,80 96 Z" style={{ fill: "#8b5e3c" }} />
      <ellipse cx="60" cy="48" rx="36" ry="24" style={{ fill: "#16a34a" }} />
      <path d="M36 102 C40 94,80 94,84 102 Z" style={{ fill: "#4b5563" }} />
      <circle cx="48" cy="40" r="3" style={{ fill: "gold" }} />
      <circle cx="72" cy="44" r="3" style={{ fill: "gold" }} />
      <motion.circle cx="60" cy="36" r="2" style={{ fill: "#f59e0b" }} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} />
    </motion.svg>
  );
}

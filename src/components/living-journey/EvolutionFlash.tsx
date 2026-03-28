import { motion, AnimatePresence } from "framer-motion";

interface EvolutionFlashProps {
  show: boolean;
  label: string;
}

export function EvolutionFlash({ show, label }: EvolutionFlashProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ background: "rgba(255,255,255,0.8)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="text-lg font-semibold"
            style={{ color: "#ef4444" }}
          >
            {label}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

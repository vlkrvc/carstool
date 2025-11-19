import { motion } from "framer-motion";

export default function Button({ children, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="bg-warm text-white px-4 py-2 rounded-xl shadow-md hover:bg-warm-dark transition"
    >
      {children}
    </motion.button>
  );
}

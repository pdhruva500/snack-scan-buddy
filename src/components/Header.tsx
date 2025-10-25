import { motion } from "framer-motion";

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-center justify-center py-6 bg-primary text-white shadow-lg"
    >
      <div className="flex items-center gap-3">
        <img
          src="/src/assets/eagle-logo.png"
          alt="Eastside Eats Logo"
          className="w-10 h-10"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Eastside Eats</h1>
          <p className="text-sm opacity-90">Powered by community flavor 🦅</p>
        </div>
      </div>
    </motion.header>
  );
};

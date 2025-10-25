import { motion } from "framer-motion";

export default function Dashboard() {
  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center bg-background text-white"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <h1 className="text-5xl font-bold mb-4">Welcome to Your Dashboard</h1>
      <p className="text-lg text-white/80">
        Track your snacks and see your progress here.
      </p>
    </motion.div>
  );
}
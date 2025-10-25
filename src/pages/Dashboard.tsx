import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-100 text-gray-800">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-center">
                Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-gray-600">
                Welcome to your dashboard. This page matches the style of your homepage — clean, bright, and minimal.
              </p>
              <p className="text-gray-500 text-sm">
                You can later add user stats, recent activity, or other features here.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-500 text-sm py-4">
        Created by Prasham Dhruva
      </p>
    </div>
  );
};

export default Dashboard;

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3, Utensils, Clock, Star } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-zinc-800 text-white">
      <div className="container mx-auto px-6 py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-bold mb-12 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent"
        >
          Snack Dashboard
        </motion.h1>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card className="bg-white/10 border-white/10 backdrop-blur-md hover:scale-105 transition-transform">
              <CardHeader>
                <BarChart3 className="w-10 h-10 text-primary mb-4 mx-auto" />
                <CardTitle className="text-xl font-semibold">Recent Stats</CardTitle>
              </CardHeader>
              <CardContent className="text-white/80">
                View snack trends and daily logging insights.
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card className="bg-white/10 border-white/10 backdrop-blur-md hover:scale-105 transition-transform">
              <CardHeader>
                <Utensils className="w-10 h-10 text-primary mb-4 mx-auto" />
                <CardTitle className="text-xl font-semibold">Snacks Logged</CardTitle>
              </CardHeader>
              <CardContent className="text-white/80">
                Track the number of snacks you’ve scanned and identified.
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card className="bg-white/10 border-white/10 backdrop-blur-md hover:scale-105 transition-transform">
              <CardHeader>
                <Clock className="w-10 h-10 text-primary mb-4 mx-auto" />
                <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="text-white/80">
                See your latest scan times and activity logs.
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30 backdrop-blur-md max-w-3xl mx-auto">
            <CardHeader>
              <Star className="w-10 h-10 text-primary mb-4 mx-auto" />
              <CardTitle className="text-2xl font-bold">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent className="text-white/80">
              Your snack habits are improving! Keep tracking to unlock new insights and progress goals.
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

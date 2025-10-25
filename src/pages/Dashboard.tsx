import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart3, TrendingUp, PieChart, Activity } from "lucide-react";
import { motion } from "framer-motion";
import cafeteriaHero from "@/assets/cafeteria-hero.jpg";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-gray-900">
      {/* HEADER */}
      <Header />

      {/* HERO SECTION */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[400px] bg-cover bg-center flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: `url(${cafeteriaHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative z-10 text-center text-white px-4"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-4">
            Dashboard
          </h1>
          <p className="text-lg md:text-xl text-white/80">
            Real-time analytics & cafeteria insights
          </p>
        </motion.div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Your Analytics Overview</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Visualize cafeteria data in real-time and make smarter decisions.
          </p>
        </motion.div>

        {/* DASHBOARD CARDS */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <Card className="hover:shadow-xl transition-all hover:-translate-y-1 h-full border-2 border-primary/50">
              <CardHeader>
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-center">Snack Logs</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                View total snack scans and most popular items.
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card className="hover:shadow-xl transition-all hover:-translate-y-1 h-full border-2 border-primary/50">
              <CardHeader>
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-center">Trends</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Identify weekly trends and consumption spikes.
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card className="hover:shadow-xl transition-all hover:-translate-y-1 h-full border-2 border-primary/50">
              <CardHeader>
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <PieChart className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-center">Nutrition Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Analyze nutritional data from scanned snacks.
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* FOOTER */}
        <p className="text-center text-white/80 text-sm mt-16">
          Created by Prasham Dhruva
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

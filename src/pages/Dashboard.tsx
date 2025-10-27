import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Clock, Lightbulb, Package } from "lucide-react";
import { motion } from "framer-motion";
import cafeteriaHero from "@/assets/cafeteria-hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SnackLog {
  id: string;
  student_name: string;
  snack_name: string;
  timestamp: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [recentLogs, setRecentLogs] = useState<SnackLog[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadRecentLogs();
      generateAIInsights();
    }
  }, [user]);

  const loadRecentLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("snack_logs")
        .select("id, student_name, snack_name, timestamp")
        .order("timestamp", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentLogs(data || []);
    } catch (error) {
      console.error("Error loading recent logs:", error);
    }
  };

  const generateAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const { data: allLogs, error } = await supabase
        .from("snack_logs")
        .select("snack_name, timestamp")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!allLogs || allLogs.length === 0) {
        setAiInsights([
          "Start logging snacks to see personalized insights",
          "Track your eating patterns over time",
          "Discover your favorite snacks"
        ]);
        setLoadingInsights(false);
        return;
      }

      // Calculate insights
      const insights: string[] = [];

      // Most popular snack
      const snackCounts = allLogs.reduce((acc, log) => {
        acc[log.snack_name] = (acc[log.snack_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topSnack = Object.entries(snackCounts).sort(([,a], [,b]) => b - a)[0];
      if (topSnack) {
        insights.push(`🏆 Most popular snack: ${topSnack[0]} (logged ${topSnack[1]} times)`);
      }

      // Today's activity
      const today = new Date().toDateString();
      const todayCount = allLogs.filter(log => 
        new Date(log.timestamp).toDateString() === today
      ).length;
      insights.push(`📊 ${todayCount} snack${todayCount !== 1 ? 's' : ''} logged today`);

      // Peak snacking time
      const hours = allLogs.map(log => new Date(log.timestamp).getHours());
      const hourCounts = hours.reduce((acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const peakHour = Object.entries(hourCounts).sort(([,a], [,b]) => b - a)[0];
      if (peakHour) {
        const hour = parseInt(peakHour[0]);
        const time = hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
        insights.push(`⏰ Peak snacking time: around ${time}`);
      }

      // Variety check
      const uniqueSnacks = Object.keys(snackCounts).length;
      if (uniqueSnacks > 10) {
        insights.push(`🌟 Great variety! ${uniqueSnacks} different snacks logged`);
      } else if (uniqueSnacks > 5) {
        insights.push(`👍 ${uniqueSnacks} different snacks logged - try exploring more!`);
      } else {
        insights.push(`💡 Only ${uniqueSnacks} different snacks logged - explore more options!`);
      }

      // Weekly trend
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const recentLogs = allLogs.filter(log => 
        new Date(log.timestamp) > lastWeek
      );
      const avgPerDay = (recentLogs.length / 7).toFixed(1);
      insights.push(`📈 Average: ${avgPerDay} snacks per day this week`);

      setAiInsights(insights);
    } catch (error) {
      console.error("Error generating insights:", error);
      setAiInsights(["Unable to generate insights at this time"]);
    } finally {
      setLoadingInsights(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* HERO SECTION */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[300px] md:h-[400px] bg-cover bg-center flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: `url(${cafeteriaHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative z-10 text-center text-white px-4"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Dashboard
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-white/80">
            Your personalized snack tracking insights
          </p>
        </motion.div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* RECENT SCANS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg md:text-xl">Recent Scans</CardTitle>
                    <CardDescription className="text-sm">Your latest snack logs</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No snacks logged yet. Start tracking!
                    </p>
                  ) : (
                    recentLogs.map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{log.snack_name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">{log.student_name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatTime(log.timestamp)}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI INSIGHTS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg md:text-xl">Smart Insights</CardTitle>
                    <CardDescription className="text-sm">AI-powered snack analytics</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingInsights ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiInsights.map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20"
                      >
                        <p className="text-sm md:text-base">{insight}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* QUICK STATS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 lg:mt-8"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg md:text-xl">Quick Stats</CardTitle>
                  <CardDescription className="text-sm">Your snacking summary</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl md:text-3xl font-bold">{recentLogs.length}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Recent Logs</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl md:text-3xl font-bold">
                    {new Set(recentLogs.map(log => log.snack_name)).size}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Unique Snacks</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl md:text-3xl font-bold">
                    {recentLogs.filter(log => 
                      new Date(log.timestamp).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Today</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Lightbulb className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl md:text-3xl font-bold">{aiInsights.length}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

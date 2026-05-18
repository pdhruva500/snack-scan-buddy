import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { buildCsv, downloadCsv, formatExportDateTime, padCsvHeaders } from "@/lib/csvExport";
import { toast } from "sonner";
import { Download, RefreshCw, Loader2, Search, LogOut, TrendingUp, Users, Package, Trash } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SnackLog {
  id: string;
  student_name: string;
  snack_name: string;
  timestamp: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<SnackLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SnackLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [chartData, setChartData] = useState<Array<{ date: string; count: number }>>([]);
  const [selectedLog, setSelectedLog] = useState<SnackLog | null>(null);
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showSimpleLogs, setShowSimpleLogs] = useState(false);
  const loadLogs = async () => {
    setLoading(true);
    try {
      
      const { data, error } = await supabase
        .from("snack_logs")
        .select("id, student_name, snack_name, timestamp")
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
      setFilteredLogs(data || []);
      generateChartData(data || []);
    } catch (error) {
      console.error("Error loading logs:", error);
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (logsData: SnackLog[]) => {
    const dateMap = new Map<string, number>();
    
    logsData.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    const chartArray = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days

    setChartData(chartArray);
  };

  useEffect(() => {
    loadLogs();

    // Set up real-time subscription
    const channel = supabase
      .channel('snack-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'snack_logs'
        },
        () => {
          loadLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const topSnacks = logs.reduce((acc, log) => {
    acc[log.snack_name] = (acc[log.snack_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topSnacksArray = Object.entries(topSnacks)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  const handleDeleteLog = async (logId: string) => {
    // Optimistic UI: remove the row immediately
    setSelectedLog(null);
    const prevLogs = logs;
    const prevFiltered = filteredLogs;
    setLogs((prev) => prev.filter((l) => l.id !== logId));
    setFilteredLogs((prev) => prev.filter((l) => l.id !== logId));

    try {
      // Ask Supabase to return deleted rows to verify it actually deleted
      const { data: deleted, error } = await supabase
        .from("snack_logs")
        .delete()
        .eq("id", logId)
        .select("id");

      if (error) throw error;

      if (!deleted || deleted.length === 0) {
        // Nothing was deleted on the server (policy or already removed). Revert UI and resync.
        setLogs(prevLogs);
        setFilteredLogs(prevFiltered);
        await loadLogs();
        toast.error("Could not delete log. It may already be removed or you may not have permission.");
        return;
      }

      toast.success("Log deleted successfully");

      // Optionally resync in background; if realtime is configured, this may be redundant
      loadLogs();
    } catch (error) {
      console.error("Error deleting log:", error);
      // Revert optimistic change on failure
      setLogs(prevLogs);
      setFilteredLogs(prevFiltered);
      toast.error("Failed to delete log");
    }
  };


  const handleDownloadCSV = () => {
    if (logs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const headers = ["Student Name", "Snack", "Date/Time"];
    const rows = logs.map((log) => [
      log.student_name,
      log.snack_name,
      formatExportDateTime(log.timestamp),
    ]);

    downloadCsv(buildCsv(padCsvHeaders(headers, [24, 42, 28]), rows));

    toast.success("Logs exported successfully");
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm md:text-base">Real-time snack tracking and analytics</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={loadLogs} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={handleDownloadCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              onClick={() => setShowClearConfirm(true)}
              variant="destructive"
              size="sm"
            >
              <Trash className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Clear Logs</span>
            </Button>
            <Button onClick={() => navigate("/")} variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(logs.map(log => log.student_name)).size}
              </div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Logs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter(log => {
                  const today = new Date().toDateString();
                  const logDate = new Date(log.timestamp).toDateString();
                  return today === logDate;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">Logged today</p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Snacks Logged (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Top 5 Snacks</CardTitle>
                <CardDescription>Most popular snacks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topSnacksArray.map((snack, index) => (
                  <div key={snack.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm md:text-base font-medium">{snack.name}</span>
                    </div>
                    <span className="text-sm md:text-base font-semibold text-primary">{snack.count}x</span>
                  </div>
                ))}
                {topSnacksArray.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No snacks logged yet</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg md:text-xl">All Snack Logs</CardTitle>
                  <CardDescription className="text-sm">Total logs: {logs.length}</CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search student or snack..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchTerm ? "No matching logs found." : "No snack logs yet."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Snack Name</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow 
                          key={log.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedLog(log)}
                        >
                          <TableCell className="font-medium">{log.student_name}</TableCell>
                          <TableCell>{log.snack_name}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(log.timestamp)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {selectedLog && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedLog(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-md shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Log Details</CardTitle>
                <CardDescription>View and manage this snack log</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Student Name</p>
                    <p className="font-semibold text-lg">{selectedLog.student_name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Snack Name</p>
                    <p className="font-semibold text-lg">{selectedLog.snack_name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Timestamp</p>
                    <p className="font-semibold">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteLog(selectedLog.id)}
                    className="flex-1"
                  >
                    Delete Log
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedLog(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      
      {showClearConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setShowClearConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-lg shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Clear All Snack Logs</CardTitle>
                <CardDescription>This will permanently delete all snack logs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to clear the entire snack log? This action cannot be undone.
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={async () => {
                      setClearing(true);
                      const prevLogs = logs;
                      const prevFiltered = filteredLogs;
                      setLogs([]);
                      setFilteredLogs([]);

                      try {
                        // Fetch all IDs first, then delete by id list - this makes errors clearer
                        const { data: allRows, error: fetchErr } = await supabase
                          .from("snack_logs")
                          .select("id");

                        if (fetchErr) throw fetchErr;

                        const ids = (allRows || []).map((r: any) => r.id);

                        if (ids.length === 0) {
                          toast.success("No logs to clear");
                          setShowClearConfirm(false);
                          setClearing(false);
                          return;
                        }

                        const { data: deleted, error } = await supabase
                          .from("snack_logs")
                          .delete()
                          .in("id", ids)
                          .select("id");

                        if (error) throw error;

                        if (!deleted || deleted.length === 0) {
                          // Revert and surface permission-like message
                          setLogs(prevLogs);
                          setFilteredLogs(prevFiltered);
                          await loadLogs();
                          toast.error("Could not clear logs. You may not have permission to delete these rows.");
                          setClearing(false);
                          setShowClearConfirm(false);
                          return;
                        }

                        toast.success("All logs cleared");
                        await loadLogs();
                        setClearing(false);
                        setShowClearConfirm(false);
                      } catch (err) {
                        console.error("Error clearing logs:", err);
                        setLogs(prevLogs);
                        setFilteredLogs(prevFiltered);
                        toast.error("Failed to clear logs. Check permissions or try again.");
                        setClearing(false);
                        setShowClearConfirm(false);
                      }
                    }}
                    disabled={clearing}
                  >
                    {clearing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      "Yes, clear all"
                    )}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowClearConfirm(false)} disabled={clearing}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Admin;

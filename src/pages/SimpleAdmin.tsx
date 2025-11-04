import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserCircle2, Trash2, ArrowLeft, Download, RefreshCw, Search, Package, Users, TrendingUp, Strikethrough } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface LogEntry {
  id: string;
  firstName: string;
  lastName: string;
  foodItem: string;
  timestamp: string;
  barcode?: string | null;
  crossedOut?: boolean;
}

const SimpleAdmin = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [chartData, setChartData] = useState<Array<{ date: string; count: number }>>([]);
  // (no permanent deletes — we toggle a crossedOut flag instead)

  // Load logs from localStorage (persist across refreshes)
  const loadLogs = () => {
    const storedLogs = JSON.parse(localStorage.getItem("simple_logs") || "[]");
    const ordered = (storedLogs || []).slice().reverse();
    setLogs(ordered);
    setFilteredLogs(ordered);
    generateChartData(ordered);
  };

  const generateChartData = (logsData: LogEntry[]) => {
    const dateMap = new Map<string, number>();

    logsData.forEach((log) => {
      const date = new Date(log.timestamp).toLocaleDateString();
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    const chartArray = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    setChartData(chartArray);
  };

  useEffect(() => {
    loadLogs();

    // Listen for new log entries
    const handleLogAdded = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("New log added:", customEvent.detail);
      loadLogs();
    };

    const handleLogRemoved = () => {
      loadLogs();
    };

    const handleLogsCleared = () => {
      setLogs([]);
    };

    window.addEventListener("simple_log_added", handleLogAdded);
    window.addEventListener("simple_log_removed", handleLogRemoved);
    window.addEventListener("simple_logs_cleared", handleLogsCleared);

    return () => {
      window.removeEventListener("simple_log_added", handleLogAdded);
      window.removeEventListener("simple_log_removed", handleLogRemoved);
      window.removeEventListener("simple_logs_cleared", handleLogsCleared);
    };
  }, []);

  useEffect(() => {
    // filter by search term
    if (!searchTerm.trim()) {
      setFilteredLogs(logs);
      return;
    }

    const term = searchTerm.toLowerCase();
    setFilteredLogs(
      logs.filter((l) =>
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(term) || l.foodItem.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, logs]);

  const handleToggleCrossOut = (id: string) => {
    const updatedLogs = logs.map((log) => (log.id === id ? { ...log, crossedOut: !log.crossedOut } : log));
    // save in storage in original order (oldest-first)
    localStorage.setItem("simple_logs", JSON.stringify(updatedLogs.slice().reverse()));
    setLogs(updatedLogs);
    setFilteredLogs((prev) => prev.map((l) => (l.id === id ? { ...l, crossedOut: !l.crossedOut } : l)));
    generateChartData(updatedLogs);
    window.dispatchEvent(new Event("simple_log_removed"));
    // No toasts for cross-out/undo — visual only
  };

  const handleClearAll = () => {
    localStorage.removeItem("simple_logs");
    setLogs([]);
    setShowClearDialog(false);
    window.dispatchEvent(new Event("simple_logs_cleared"));
    toast.success("All logs cleared");
  };

  const topSnacksArray = Object.entries(
    logs.reduce((acc, log) => {
      acc[log.foodItem] = (acc[log.foodItem] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const handleDownloadCSV = () => {
    if (logs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const headers = ["First Name", "Last Name", "Food Item", "Time"];
    const rows = logs.map((log) => [log.firstName + '', log.lastName + '', log.foodItem + '', new Date(log.timestamp).toLocaleString()]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eastside-eats-simple-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Logs exported successfully');
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm md:text-base">Local snack tracking and analytics</p>
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
            {logs.length > 0 && (
              <Button onClick={() => setShowClearDialog(true)} variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Clear Logs</span>
              </Button>
            )}
            <Link to="/simple">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
              <div className="text-2xl font-bold">{new Set(logs.map(l => `${l.firstName} ${l.lastName}`)).size}</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Logs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}</div>
              <p className="text-xs text-muted-foreground">Logged today</p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {chartData.length > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Snacks Logged (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8,8,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Top 5 Snacks</CardTitle>
                <CardDescription>Most popular snacks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topSnacksArray.map((snack, index) => (
                  <div key={snack.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">{index+1}</div>
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

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg md:text-xl">All Snack Logs</CardTitle>
                  <CardDescription className="text-sm">Total logs: {logs.length}</CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    placeholder="Search name or snack..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 input bg-background border"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No snack logs yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Food Item</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className={`font-medium ${log.crossedOut ? 'line-through text-muted-foreground opacity-70' : ''}`}>{log.firstName} {log.lastName}</TableCell>
                          <TableCell className={`${log.crossedOut ? 'line-through text-muted-foreground opacity-70' : ''}`}>{log.foodItem}{log.barcode && <span className="text-xs text-muted-foreground ml-2">(Scanned)</span>}</TableCell>
                          <TableCell className={`text-muted-foreground ${log.crossedOut ? 'line-through opacity-70' : ''}`}>{formatDate(log.timestamp)}</TableCell>
                          <TableCell className="text-right">
                            {!log.crossedOut ? (
                              <Button variant="ghost" size="sm" onClick={() => handleToggleCrossOut(log.id)}>
                                <Strikethrough className="h-4 w-4 text-destructive" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => handleToggleCrossOut(log.id)}>
                                <RefreshCw className="h-4 w-4 text-primary" />
                              </Button>
                            )}
                          </TableCell>
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

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all logs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {logs.length} log entries stored locally. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* single-delete confirmation removed — we use cross-out toggle instead */}

    </div>
  );
};

export default SimpleAdmin;

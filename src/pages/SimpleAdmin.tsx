import { useState, useEffect } from "react";
// back navigation removed to keep users on this page during testing
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
import { UserCircle2, Trash2, Download, RefreshCw, Search, Package, Users, TrendingUp, Strikethrough } from "lucide-react";
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
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [password, setPassword] = useState("");
  // Note: admin authorization is intentionally not persisted.
  // Users must enter the PIN every time they access the admin view.

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "kfw*kcg!bqe2JPN!maj") {
      setAuthorized(true);
      setPassword("");
      toast.success("Authorized");
    } else {
      toast.error("Incorrect PIN");
      setPassword("");
    }
  };
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [chartData, setChartData] = useState<Array<{ date: string; count: number }>>([]);
  const [dailyRemaining, setDailyRemaining] = useState<Array<{ date: string; remaining: number }>>([]);
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
    const remainingMap = new Map<string, number>();

    logsData.forEach((log) => {
      const date = new Date(log.timestamp).toLocaleDateString();
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
      if (!log.crossedOut) {
        remainingMap.set(date, (remainingMap.get(date) || 0) + 1);
      }
    });

    const chartArray = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    setChartData(chartArray);

    const remainingArray = Array.from(remainingMap.entries())
      .map(([date, remaining]) => ({ date, remaining }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    setDailyRemaining(remainingArray);
  };

  useEffect(() => {
    if (!authorized) return;

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
  }, [authorized]);

  // debounce search input to improve typing responsiveness
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 150);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    // filter by debounced search term
    if (!debouncedSearch.trim()) {
      setFilteredLogs(logs);
      return;
    }

    const term = debouncedSearch.toLowerCase();
    setFilteredLogs(
      logs.filter((l) =>
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(term) || l.foodItem.toLowerCase().includes(term)
      )
    );
  }, [debouncedSearch, logs]);

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

  const promptDeleteLog = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    const id = deleteTargetId;
    if (!id) return setShowDeleteDialog(false);

    const remainingStored = JSON.parse(localStorage.getItem('simple_logs') || '[]') as LogEntry[];
    const filteredStored = remainingStored.filter((l) => l.id !== id);
    localStorage.setItem('simple_logs', JSON.stringify(filteredStored));

    const ordered = filteredStored.slice().reverse();
    setLogs(ordered);
    setFilteredLogs(ordered);
    generateChartData(ordered);
    window.dispatchEvent(new Event('simple_log_removed'));
    setShowDeleteDialog(false);
    setDeleteTargetId(null);
    toast.success('Log deleted');
  };

  const handleClearAll = () => {
    localStorage.removeItem("simple_logs");
    setLogs([]);
    setDailyRemaining([]);
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
      {!authorized && (
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>Enter password to view snack logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <form onSubmit={handlePasswordSubmit} className="w-full space-y-4">
                    <div>
                      <input
                        type="password"
                        placeholder="PIN"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input w-full text-lg py-3"
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end items-center">
                      <Button type="submit">Unlock</Button>
                    </div>
                  </form>
                  
                </div>
              </CardContent>
            </Card>
          </div>
      )}
      {authorized && (
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
          </div>
        </motion.div>

        {/* Top: Logs + Remaining per day for quick cashier view */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
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
                                <div className="flex items-center justify-end gap-2">
                                  {!log.crossedOut ? (
                                    <Button variant="ghost" size="sm" onClick={() => handleToggleCrossOut(log.id)}>
                                      <Strikethrough className="h-4 w-4 text-destructive" />
                                    </Button>
                                  ) : (
                                    <Button variant="ghost" size="sm" onClick={() => handleToggleCrossOut(log.id)}>
                                      <RefreshCw className="h-4 w-4 text-primary" />
                                    </Button>
                                  )}

                                  <Button variant="ghost" size="sm" onClick={() => promptDeleteLog(log.id)} title="Delete">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Remaining Per Day</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {dailyRemaining.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data</p>
                  ) : (
                    <div className="space-y-2">
                      {dailyRemaining.map((d) => (
                        <div key={d.date} className="flex items-center justify-between">
                          <div className="text-sm">{d.date}</div>
                          <div className="text-sm font-bold">{d.remaining}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
      </div>
      )}

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

      {/* Single-log delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete log?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected log. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default SimpleAdmin;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCw, Loader2, Search, Home, Package, Trash } from "lucide-react";
import { motion } from "framer-motion";

interface SnackLog {
  id: string;
  student_name: string;
  snack_name: string;
  timestamp: string;
}

const SimpleAdmin = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<SnackLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SnackLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadLogs = () => {
    setLoading(true);
    try {
      // Load from sessionStorage (memory-only, no database)
      const storedLogs = JSON.parse(sessionStorage.getItem("simple_logs") || "[]");
      // Sort by timestamp descending (newest first)
      const sortedLogs = storedLogs.sort((a: SnackLog, b: SnackLog) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setLogs(sortedLogs);
      setFilteredLogs(sortedLogs);
    } catch (error) {
      console.error("Error loading logs:", error);
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();

    // Listen for custom event from SimpleSignOut when new logs are added
    const handleLogAdded = () => {
      loadLogs();
    };

    window.addEventListener("simple_log_added", handleLogAdded);

    // Also listen for removals/clears to refresh view
    window.addEventListener("simple_log_removed", handleLogAdded);
    window.addEventListener("simple_logs_cleared", handleLogAdded);

    return () => {
      window.removeEventListener("simple_log_added", handleLogAdded);
      window.removeEventListener("simple_log_removed", handleLogAdded);
      window.removeEventListener("simple_logs_cleared", handleLogAdded);
    };
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredLogs(logs);
    } else {
      const filtered = logs.filter(log =>
        log.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.snack_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLogs(filtered);
    }
  }, [searchTerm, logs]);

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
      <div className="container mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">Eastside Eats</h1>
              <img
                src="/eaglelogo.png"
                alt="Eastside Eats Eagle Logo"
                className="w-10 h-10 md:w-12 md:h-12"
              />
            </div>
            <p className="text-muted-foreground text-sm md:text-base">Simple Admin - View Snack Logs</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={loadLogs} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={() => navigate('/simple')} variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Simple</span>
            </Button>
            <Button
              onClick={() => {
                const ok = window.confirm('Clear all simple logs? This will remove all temporary entries.');
                if (!ok) return;
                sessionStorage.removeItem('simple_logs');
                setLogs([]);
                setFilteredLogs([]);
                toast.success('All simple logs cleared');
                window.dispatchEvent(new Event('simple_logs_cleared'));
              }}
              variant="destructive"
              size="sm"
            >
              <Trash className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Clear Logs</span>
            </Button>
          </div>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
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
                                <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.student_name}</TableCell>
                          <TableCell>{log.snack_name}</TableCell>
                                  <TableCell className="text-muted-foreground">{formatDate(log.timestamp)}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          const ok = window.confirm('Delete this log? This cannot be undone.');
                                          if (!ok) return;
                                          try {
                                            const stored = JSON.parse(sessionStorage.getItem('simple_logs') || '[]');
                                            const updated = (stored as any[]).filter((s) => s.id !== log.id);
                                            sessionStorage.setItem('simple_logs', JSON.stringify(updated));
                                            // update UI optimistically
                                            const newLogs = logs.filter((l) => l.id !== log.id);
                                            setLogs(newLogs);
                                            setFilteredLogs(prev => prev.filter(p => p.id !== log.id));
                                            toast.success('Log deleted');
                                            window.dispatchEvent(new Event('simple_log_removed'));
                                          } catch (e) {
                                            console.error('Failed to delete log', e);
                                            toast.error('Failed to delete log');
                                          }
                                        }}
                                      >
                                        <Trash className="h-4 w-4 text-destructive" />
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
        </motion.div>
      </div>
    </div>
  );
};

export default SimpleAdmin;

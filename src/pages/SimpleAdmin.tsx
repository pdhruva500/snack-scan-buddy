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
import { UserCircle2, Trash2, ArrowLeft } from "lucide-react";
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

interface LogEntry {
  id: string;
  firstName: string;
  lastName: string;
  foodItem: string;
  timestamp: string;
  barcode?: string | null;
}

const SimpleAdmin = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Load logs from sessionStorage
  const loadLogs = () => {
    const storedLogs = JSON.parse(sessionStorage.getItem("simple_logs") || "[]");
    setLogs(storedLogs.reverse()); // Show newest first
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

  const handleDeleteLog = (id: string) => {
    const updatedLogs = logs.filter((log) => log.id !== id);
    sessionStorage.setItem("simple_logs", JSON.stringify(updatedLogs.reverse()));
    setLogs(updatedLogs);
    window.dispatchEvent(new Event("simple_log_removed"));
    toast.success("Log entry deleted");
  };

  const handleClearAll = () => {
    sessionStorage.removeItem("simple_logs");
    setLogs([]);
    setShowClearDialog(false);
    window.dispatchEvent(new Event("simple_logs_cleared"));
    toast.success("All logs cleared");
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <Link to="/simple">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Simple Mode
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <UserCircle2 className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">Simple Admin</CardTitle>
                    <CardDescription>
                      View and manage snack logs from this session
                    </CardDescription>
                  </div>
                </div>
                {logs.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowClearDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserCircle2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">No logs yet</p>
                  <p className="text-sm">
                    Logs from the Simple Mode will appear here
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
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
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {log.firstName} {log.lastName}
                          </TableCell>
                          <TableCell>
                            {log.foodItem}
                            {log.barcode && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (Scanned)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(log.timestamp)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLog(log.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> These logs are stored in your browser's
                  session storage and will be lost when you close the tab or
                  browser. This is a simplified mode for quick logging.
                </p>
              </div>
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
              This will permanently delete all {logs.length} log entries from
              this session. This action cannot be undone.
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
    </div>
  );
};

export default SimpleAdmin;

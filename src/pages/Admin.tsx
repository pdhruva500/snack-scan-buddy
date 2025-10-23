import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getSnackLogs, clearSnackLogs, downloadCSV, type SnackLog } from "@/lib/storage";
import { toast } from "sonner";
import { Download, Trash2, RefreshCw, Scan } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Admin = () => {
  const [logs, setLogs] = useState<SnackLog[]>([]);

  const loadLogs = () => {
    const snackLogs = getSnackLogs();
    setLogs(snackLogs);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearLogs = () => {
    clearSnackLogs();
    setLogs([]);
    toast.success("All logs cleared successfully");
  };

  const handleDownloadCSV = () => {
    if (logs.length === 0) {
      toast.error("No logs to export");
      return;
    }
    
    downloadCSV();
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
      
      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-lg border-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-3xl font-bold">Admin Dashboard</CardTitle>
                <CardDescription className="text-base mt-1">
                  View and manage snack sign-out logs
                </CardDescription>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={loadLogs}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                
                <Button
                  variant="default"
                  size="default"
                  onClick={handleDownloadCSV}
                  disabled={logs.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="default"
                      disabled={logs.length === 0}
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {logs.length} snack logs. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearLogs} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete All Logs
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No snack logs yet</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Logs will appear here when students sign out snacks
                </p>
              </div>
            ) : (
              <div className="rounded-lg border-2 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Student Name</TableHead>
                      <TableHead className="font-bold">Snack</TableHead>
                      <TableHead className="font-bold">Time</TableHead>
                      <TableHead className="font-bold text-center">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{log.studentName}</TableCell>
                        <TableCell>{log.snackName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell className="text-center">
                          {log.scanType === 'barcode' ? (
                            <Badge variant="outline" className="gap-1">
                              <Scan className="w-3 h-3" />
                              Scanned
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Manual</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {logs.length > 0 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Total logs: {logs.length}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;

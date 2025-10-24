import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, RefreshCw, Lock, Loader2 } from "lucide-react";
import CryptoJS from "crypto-js";

interface SnackLog {
  id: string;
  student_name: string;
  snack_name: string;
  timestamp: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<SnackLog[]>([]);
  const [loading, setLoading] = useState(false);

  

  //DEV NOTE: Set to true to skip PIN entry during development
  const [authenticated, setAuthenticated] = useState(true);
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("snack_logs")
        .select("id, student_name, snack_name, timestamp")
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error loading logs:", error);
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadLogs();
    }
  }, [authenticated]);


  const verifyPin = async () => {
    if (!pin) {
      toast.error("Please enter a PIN");
      return;
    }

    setVerifying(true);
    try {
      const pinHash = CryptoJS.SHA256(pin).toString();
      const { data, error } = await supabase
        .from("admin_pins")
        .select("pin_hash")
        .eq("pin_hash", pinHash)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAuthenticated(true);
        toast.success("Access granted");
        loadLogs();
      } else {
        toast.error("Invalid PIN");
        setPin("");
      }
    } catch (error) {
      console.error("Error verifying PIN:", error);
      toast.error("Failed to verify PIN");
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadCSV = () => {
    if (logs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const headers = ["Student Name", "Snack", "Time"];
    const rows = logs.map((log) => [
      log.student_name,
      log.snack_name,
      new Date(log.timestamp).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `eastside-eats-logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

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

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-2">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Admin Access</CardTitle>
            <CardDescription>Enter PIN to view snack logs</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN Code</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifyPin()}
                maxLength={4}
                className="h-14 text-lg text-center border-2"
              />
              <p className="text-xs text-muted-foreground text-center">
                Default PIN: 1234
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="xl"
                onClick={() => navigate("/")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="success"
                size="xl"
                onClick={verifyPin}
                disabled={verifying}
                className="flex-1"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  Snack sign-out logs for cashier review
                </CardDescription>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="default" onClick={loadLogs} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
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

                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    setAuthenticated(false);
                    setPin("");
                    navigate("/");
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No snack logs yet</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Logs will appear here when students scan snacks
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{log.student_name}</TableCell>
                        <TableCell>{log.snack_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(log.timestamp)}
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

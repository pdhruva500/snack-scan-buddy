import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Home, Camera, Check, Trash, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { isLunchTime, getLunchTimeMessage } from "@/lib/timeRestrictions";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { motion, AnimatePresence } from "framer-motion";
import { fetchFoodProduct } from "@/services/foodService";

const SignOut = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [detectedSnack, setDetectedSnack] = useState<{ id: string; name: string; image?: string; brand?: string } | null>(null);
  const [lunchRestrictionMessage, setLunchRestrictionMessage] = useState<string | null>(null);
  const [manualSnackName, setManualSnackName] = useState("");
  const [localLogs, setLocalLogs] = useState<any[]>([]);
  const [showLocalModal, setShowLocalModal] = useState(false);
  const [selectedLocalDelete, setSelectedLocalDelete] = useState<any | null>(null);
  const [showLocalClearConfirm, setShowLocalClearConfirm] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localDeleting, setLocalDeleting] = useState(false);
  const [localClearing, setLocalClearing] = useState(false);

  // Navigate if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Update lunch restriction message every minute
  useEffect(() => {
    const updateLunchStatus = () => {
      setLunchRestrictionMessage(isLunchTime() ? getLunchTimeMessage() : null);
    };

    updateLunchStatus();
    const interval = setInterval(updateLunchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Ensure camera turns off when scanner closes or user leaves page
  useEffect(() => {
    return () => {
      const videoEl = document.querySelector("video");
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleBarcodeDetected = async (barcode: string) => {
    setShowScanner(false);
    try {
      // Use the same food API as the main page scanner
      const productData = await fetchFoodProduct(barcode);
      
      if (productData && productData.product) {
        // Successfully found product via food API - store image and brand too
        setDetectedSnack({ 
          id: barcode, // Use barcode as ID since it's not in our database
          name: productData.product.product_name,
          image: productData.product.image_url,
          brand: productData.product.brands
        });
        toast.success("Snack detected!", { description: productData.product.product_name });
      } else {
        // Product not found in food API, fallback to database lookup
        const { data, error } = await supabase
          .from("snacks")
          .select("id, name")
          .eq("barcode", barcode)
          .maybeSingle();

        if (error || !data) {
          toast.error("Barcode not recognized", {
            description: "Please enter manually or try a different barcode.",
          });
          return;
        }

        setDetectedSnack(data);
        toast.success("Snack detected!", { description: data.name });
      }
    } catch (err) {
      console.error("Error fetching snack:", err);
      toast.error("An error occurred while looking up the snack.");
    }
  };

  // Local/session storage helpers (same format as Simple Mode)
  const loadLocalLogs = () => {
    setLocalLoading(true);
    try {
      const stored = JSON.parse(sessionStorage.getItem('simple_logs') || '[]');
      const sorted = (stored as any[]).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLocalLogs(sorted);
    } catch (e) {
      console.error('Failed to load local logs', e);
      setLocalLogs([]);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleManualEntry = async () => {
    if (!manualSnackName.trim()) {
      toast.error("Please enter a snack name");
      return;
    }

    setIsSubmitting(true);
    try {
      const userInput = manualSnackName.trim();

      if (!user) {
        toast.error("User not authenticated");
        setIsSubmitting(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const authUser = userData.user;

      // Get user's profile for full name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", authUser.id)
        .maybeSingle();

      // Get any existing snack to use as placeholder ID (since snack_id is required)
      const { data: anySnack } = await supabase
        .from("snacks")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!anySnack) {
        toast.error("Database error. Please contact admin.");
        setIsSubmitting(false);
        return;
      }

      // Log directly using the typed name, no database checks
      const { error: logError } = await supabase.from("snack_logs").insert({
        user_id: authUser.id,
        snack_id: anySnack.id,
        snack_name: userInput,
        student_name: profile?.full_name || authUser.email || 'Unknown',
      });

      if (logError) {
        console.error("Error logging snack to DB:", logError);
        // Fallback: store locally in sessionStorage (same format as Simple Mode)
        try {
          const existing = JSON.parse(sessionStorage.getItem('simple_logs') || '[]');
          const newLog = {
            id: Date.now().toString(),
            student_name: profile?.full_name || authUser.email || 'Unknown',
            snack_name: userInput,
            timestamp: new Date().toISOString(),
          };
          existing.push(newLog);
          sessionStorage.setItem('simple_logs', JSON.stringify(existing));
          window.dispatchEvent(new Event('simple_log_added'));
          toast.success('Snack saved locally', { description: `"${userInput}" saved for ${newLog.student_name}` });
          setManualSnackName('');
          setTimeout(() => navigate('/'), 1200);
          return;
        } catch (err) {
          console.error('Local fallback failed:', err);
          throw logError; // rethrow original DB error
        }
      }

      toast.success("Snack logged!", { 
        description: `"${userInput}" has been logged successfully` 
      });

      setManualSnackName("");

      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error("Error adding snack:", err);
      toast.error("Failed to add snack. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !detectedSnack) return;
    setIsSubmitting(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const authUser = userData.user;

      const { error } = await supabase.from("snack_logs").insert({
        user_id: authUser.id,
        snack_id: detectedSnack.id,
        snack_name: detectedSnack.name,
        student_name: authUser.email || 'Unknown',
      });

      if (error) throw error;

      toast.success("Snack logged successfully!", {
        description: `${detectedSnack.name} signed out`,
      });

      setDetectedSnack(null);
      setShowScanner(false);

      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error("Error logging snack:", error);
      toast.error("Failed to log snack. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanClick = () => {
    // Allow opening the scanner even during restricted hours so users don't think it's broken.
    setShowScanner(true);
    setDetectedSnack(null);
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Sign Out a Snack</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Scan barcode or enter snack name manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lunchRestrictionMessage && (
                <Alert>
                  <AlertDescription>{lunchRestrictionMessage}</AlertDescription>
                </Alert>
              )}

              <AnimatePresence mode="wait">
                {!detectedSnack ? (
                  <motion.div
                    key="scan-options"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <Button
                      onClick={handleScanClick}
                      className="w-full"
                      size="lg"
                      title={lunchRestrictionMessage ?? undefined}
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Scan Barcode
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or enter manually
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {lunchRestrictionMessage ? (
                        <Input
                          value={lunchRestrictionMessage}
                          readOnly
                          className="h-12 text-base"
                        />
                      ) : (
                        <>
                          <Input
                            placeholder="Enter snack name..."
                            value={manualSnackName}
                            onChange={(e) => setManualSnackName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !isSubmitting && handleManualEntry()}
                            disabled={isSubmitting}
                            className="h-12 text-base"
                          />
                          <Button
                            onClick={handleManualEntry}
                            variant="outline"
                            className="w-full"
                            size="lg"
                            disabled={isSubmitting || !manualSnackName.trim()}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Add Manually"
                            )}
                          </Button>
                          <div className="flex justify-end mt-2">
                            <Button variant="ghost" size="sm" onClick={() => { loadLocalLogs(); setShowLocalModal(true); }}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Manage Local Logs
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="snack-detected"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 md:p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="flex items-center gap-3 mb-3"
                      >
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                        </div>
                        <span className="font-semibold text-base md:text-lg">Snack Detected!</span>
                      </motion.div>
                      
                      {/* Product image and details */}
                      <div className="flex items-start gap-4 mt-4">
                        {detectedSnack.image && (
                          <img
                            src={detectedSnack.image}
                            alt={detectedSnack.name}
                            className="w-16 h-16 md:w-20 md:h-20 object-cover rounded border-2 border-primary/30"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-xl md:text-2xl font-bold break-words">{detectedSnack.name}</p>
                          {detectedSnack.brand && (
                            <p className="text-sm text-muted-foreground mt-1">{detectedSnack.brand}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSubmit} disabled={isSubmitting || !!lunchRestrictionMessage} className="flex-1" size="lg" title={lunchRestrictionMessage ?? undefined}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging...
                          </>
                        ) : (
                          "Confirm & Log"
                        )}
                      </Button>
                      <Button
                        onClick={() => setDetectedSnack(null)}
                        variant="outline"
                        disabled={isSubmitting || !!lunchRestrictionMessage}
                        size="lg"
                        title={lunchRestrictionMessage ?? undefined}
                      >
                        Rescan
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button onClick={() => navigate("/")} variant="ghost" className="w-full mt-4">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
                </motion.div>

                {showLocalModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
                    onClick={() => setShowLocalModal(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Card className="w-full max-w-2xl shadow-2xl">
                        <CardHeader className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Local Session Logs</CardTitle>
                            <CardDescription className="text-sm">Temporary logs stored in this browser session</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => loadLocalLogs()}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refresh
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setShowLocalClearConfirm(true)}>
                              <Trash className="h-4 w-4 mr-2" />
                              Clear All
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {localLoading ? (
                            <div className="py-12 flex items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          ) : localLogs.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No local logs found.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Snack</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead className="w-24">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {localLogs.map((log) => (
                                    <TableRow key={log.id}>
                                      <TableCell className="font-medium">{log.student_name}</TableCell>
                                      <TableCell>{log.snack_name}</TableCell>
                                      <TableCell className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Button size="sm" variant="ghost" onClick={() => setSelectedLocalDelete(log)}>
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
                  </motion.div>
                )}

        <AnimatePresence>
          {showScanner && (
            <BarcodeScanner
              onDetected={handleBarcodeDetected}
              onClose={() => {
                // Stop camera stream when scanner closes
                const videoEl = document.querySelector("video");
                if (videoEl && videoEl.srcObject) {
                  const stream = videoEl.srcObject as MediaStream;
                  stream.getTracks().forEach((track) => track.stop());
                }
                setShowScanner(false);
              }}
              disabled={!!lunchRestrictionMessage}
            />
          )}
        </AnimatePresence>
        {selectedLocalDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={() => setSelectedLocalDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-full max-w-md shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-xl">Delete Local Log</CardTitle>
                  <CardDescription>Remove this temporary snack log from the session storage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Student Name</p>
                      <p className="font-semibold text-lg">{selectedLocalDelete.student_name}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Snack</p>
                      <p className="font-semibold text-lg">{selectedLocalDelete.snack_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setLocalDeleting(true);
                        try {
                          const stored = JSON.parse(sessionStorage.getItem('simple_logs') || '[]');
                          const updated = (stored as any[]).filter((s) => s.id !== selectedLocalDelete.id);
                          sessionStorage.setItem('simple_logs', JSON.stringify(updated));
                          loadLocalLogs();
                          window.dispatchEvent(new Event('simple_log_removed'));
                          toast.success('Local log deleted');
                          setSelectedLocalDelete(null);
                        } catch (e) {
                          console.error('Failed to delete local log', e);
                          toast.error('Failed to delete local log');
                        } finally {
                          setLocalDeleting(false);
                        }
                      }}
                      disabled={localDeleting}
                    >
                      {localDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setSelectedLocalDelete(null)} disabled={localDeleting}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
        {showLocalClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={() => setShowLocalClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-xl">Clear All Local Logs</CardTitle>
                  <CardDescription>This will permanently remove all temporary logs stored in this browser session.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Are you sure you want to clear all local logs? This action cannot be undone for this session.</p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setLocalClearing(true);
                        try {
                          sessionStorage.removeItem('simple_logs');
                          loadLocalLogs();
                          window.dispatchEvent(new Event('simple_logs_cleared'));
                          toast.success('All local logs cleared');
                          setShowLocalClearConfirm(false);
                        } catch (err) {
                          console.error('Error clearing local logs:', err);
                          toast.error('Failed to clear local logs');
                        } finally {
                          setLocalClearing(false);
                        }
                      }}
                      disabled={localClearing}
                    >
                      {localClearing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        'Yes, clear all'
                      )}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setShowLocalClearConfirm(false)} disabled={localClearing}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SignOut;

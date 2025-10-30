import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Home, Camera, Check, Trash } from "lucide-react";
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

  // Local/session storage is read directly where needed; local helper was removed to reduce unused state.

  const handleManualEntry = async () => {
    if (!manualSnackName.trim()) {
      toast.error("Please enter a snack name");
      return;
    }

    setIsSubmitting(true);
    try {
      const userInput = manualSnackName.trim();

      // Prefer to get user's full name if available, but do not write to DB
      let studentName = 'Unknown';
      try {
        const { data: userData } = await supabase.auth.getUser();
        const authUser = userData?.user;
        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', authUser.id)
            .maybeSingle();
          studentName = profile?.full_name || authUser.email || 'Unknown';
        }
      } catch (e) {
        // ignore profile lookup failures and continue with Unknown/email fallback
        console.warn('Failed to fetch profile for manual entry:', e);
      }

      // Save to sessionStorage (same format as Simple Mode)
      const existing = JSON.parse(sessionStorage.getItem('simple_logs') || '[]');
      const newLog = {
        id: Date.now().toString(),
        student_name: studentName,
        snack_name: userInput,
        timestamp: new Date().toISOString(),
      };
      existing.push(newLog);
      sessionStorage.setItem('simple_logs', JSON.stringify(existing));
      window.dispatchEvent(new Event('simple_log_added'));
      toast.success('Snack saved locally', { description: `"${userInput}" saved for ${newLog.student_name}` });
      setManualSnackName('');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      console.error('Error adding snack locally:', err);
      toast.error('Failed to add snack. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !detectedSnack) return;
    setIsSubmitting(true);

    try {
      // Instead of writing to the DB, save detected snack to sessionStorage (simple-mode behavior)
      let studentName = 'Unknown';
      try {
        const { data: userData } = await supabase.auth.getUser();
        const authUser = userData?.user;
        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', authUser.id)
            .maybeSingle();
          studentName = profile?.full_name || authUser.email || 'Unknown';
        }
      } catch (e) {
        console.warn('Failed to fetch profile for detected snack:', e);
      }

      try {
        const existing = JSON.parse(sessionStorage.getItem('simple_logs') || '[]');
        const newLog = {
          id: Date.now().toString(),
          student_name: studentName,
          snack_name: detectedSnack.name,
          timestamp: new Date().toISOString(),
        };
        existing.push(newLog);
        sessionStorage.setItem('simple_logs', JSON.stringify(existing));
        window.dispatchEvent(new Event('simple_log_added'));
        toast.success('Snack saved locally', { description: `${detectedSnack.name} for ${studentName}` });
        setDetectedSnack(null);
        setShowScanner(false);
        setTimeout(() => navigate('/'), 1200);
      } catch (err) {
        console.error('Failed to save detected snack locally:', err);
        toast.error('Failed to log snack. Please try again.');
      }
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

  // Load local/session logs and listen for changes (same behavior as Simple Mode)
  useEffect(() => {
    const load = () => {
      try {
        const stored = JSON.parse(sessionStorage.getItem('simple_logs') || '[]');
        const sorted = (stored as any[]).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLocalLogs(sorted);
      } catch (e) {
        setLocalLogs([]);
      }
    };

    load();
    const onAdded = () => load();
    const onRemoved = () => load();
    const onCleared = () => load();

    window.addEventListener('simple_log_added', onAdded);
    window.addEventListener('simple_log_removed', onRemoved);
    window.addEventListener('simple_logs_cleared', onCleared);

    return () => {
      window.removeEventListener('simple_log_added', onAdded);
      window.removeEventListener('simple_log_removed', onRemoved);
      window.removeEventListener('simple_logs_cleared', onCleared);
    };
  }, []);

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
                          {/* local logs managed below */}
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

                {/* Inline local logs card (simple list) */}
                <div className="mt-6">
                  <Card>
                    <CardHeader className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">Local Session Logs</CardTitle>
                        <CardDescription className="text-xs">Temporary logs stored in this browser session</CardDescription>
                      </div>
                      <div>
                        <Button variant="destructive" size="sm" onClick={() => {
                          sessionStorage.removeItem('simple_logs');
                          setLocalLogs([]);
                          window.dispatchEvent(new Event('simple_logs_cleared'));
                          toast.success('All local logs cleared');
                        }}>
                          <Trash className="mr-2 h-4 w-4" />
                          Clear All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {localLogs.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No local logs yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {localLogs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                              <div>
                                <div className="font-medium">{log.student_name}</div>
                                <div className="text-sm text-muted-foreground">{log.snack_name} • {new Date(log.timestamp).toLocaleString()}</div>
                              </div>
                              <div>
                                <Button size="sm" variant="ghost" onClick={() => {
                                  try {
                                    const stored = JSON.parse(sessionStorage.getItem('simple_logs') || '[]');
                                    const updated = (stored as any[]).filter((s) => s.id !== log.id);
                                    sessionStorage.setItem('simple_logs', JSON.stringify(updated));
                                    setLocalLogs(updated);
                                    window.dispatchEvent(new Event('simple_log_removed'));
                                    toast.success('Local log deleted');
                                  } catch (e) {
                                    console.error('Failed to delete local log', e);
                                    toast.error('Failed to delete local log');
                                  }
                                }}>
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

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
        {/* per-row delete modal removed; inline delete buttons provided */}
        {/* clear-confirm modal removed; Clear All performs immediately */}
      </div>
    </div>
  );
};

export default SignOut;

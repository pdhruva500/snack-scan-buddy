import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Scan, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isLunchTime, getLunchTimeMessage } from "@/lib/timeRestrictions";

const SignOut = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [detectedSnack, setDetectedSnack] = useState<{ id: string; name: string } | null>(null);
  const [lunchRestricted, setLunchRestricted] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    setLunchRestricted(isLunchTime());
    const interval = setInterval(() => {
      setLunchRestricted(isLunchTime());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleBarcodeInput = async (barcode: string) => {
    try {
      const { data: snack, error } = await supabase
        .from("snacks")
        .select("id, name")
        .eq("barcode", barcode)
        .maybeSingle();

      if (error) throw error;

      if (snack) {
        setDetectedSnack(snack);
        setScannedBarcode(barcode);
        toast.success("Snack detected!", {
          description: snack.name,
        });
      } else {
        toast.error("Barcode not recognized. Please try again.");
      }
    } catch (error) {
      console.error("Error looking up barcode:", error);
      toast.error("Failed to process barcode");
    }
  };

  const handleSubmit = async () => {
    if (!user || !detectedSnack) return;

    setIsSubmitting(true);

    try {
      // Get the latest user data including metadata
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const authUser = userData.user;
      if (!authUser?.user_metadata?.full_name) {
        toast.error("User profile is incomplete. Please contact an administrator.");
        return;
      }

      // Insert snack log with full name from metadata
      const { error } = await supabase.from("snack_logs").insert({
        user_id: authUser.id,
        snack_id: detectedSnack.id,
        snack_name: detectedSnack.name,
        student_name: authUser.user_metadata.full_name,
      });
    if (error) throw error;

    toast.success("Snack logged successfully!", {
      description: `${detectedSnack.name} signed out`,
      icon: <CheckCircle className="w-4 h-4" />,
    });

    setDetectedSnack(null);
    setScannedBarcode("");
    setShowScanner(false);

    setTimeout(() => {
      navigate("/");
    }, 1500);
  } catch (error) {
    console.error("Error logging snack:", error);
    toast.error("Failed to log snack. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

  const simulateBarcodeScanning = () => {
    // Simulate scanning by randomly selecting a barcode from sample data
    const barcodes = ["123456789", "234567890", "345678901", "456789012", "567890123"];
    const randomBarcode = barcodes[Math.floor(Math.random() * barcodes.length)];
    handleBarcodeInput(randomBarcode);
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
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-lg border-2">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">Scan Your Snack</CardTitle>
            <CardDescription className="text-base">
              Use the barcode scanner to log your snack
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {lunchRestricted && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{getLunchTimeMessage()}</AlertDescription>
              </Alert>
            )}

            {!lunchRestricted && (
              <>
                {!showScanner && !detectedSnack && (
                  <Button
                    variant="default"
                    size="xl"
                    onClick={() => setShowScanner(true)}
                    className="w-full h-32 text-xl"
                  >
                    <Scan className="w-12 h-12 mr-4" />
                    Start Barcode Scanner
                  </Button>
                )}

                {showScanner && !detectedSnack && (
                  <Card className="bg-muted border-2 border-dashed">
                    <CardContent className="pt-6 text-center space-y-4">
                      <Scan className="w-20 h-20 mx-auto text-primary animate-pulse" />
                      <p className="text-lg font-medium">
                        Position barcode in camera view
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Camera functionality coming soon. For now, use simulation:
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={simulateBarcodeScanning}
                          className="flex-1"
                        >
                          Simulate Scan
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setShowScanner(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {detectedSnack && (
                  <div className="space-y-4">
                    <Card className="bg-primary/5 border-2 border-primary">
                      <CardContent className="pt-6 text-center space-y-4">
                        <CheckCircle className="w-16 h-16 mx-auto text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Detected Snack:</p>
                          <p className="text-2xl font-bold text-primary">
                            {detectedSnack.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Barcode: {scannedBarcode}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        size="xl"
                        onClick={() => {
                          setDetectedSnack(null);
                          setScannedBarcode("");
                          setShowScanner(false);
                        }}
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>

                      <Button
                        variant="success"
                        size="xl"
                        onClick={handleSubmit}
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Logging..." : "Confirm & Log"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SignOut;

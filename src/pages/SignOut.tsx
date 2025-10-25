import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Home, Camera, Check, Scan } from "lucide-react";
import { toast } from "sonner";
import { isLunchTime, getLunchTimeMessage } from "@/lib/timeRestrictions";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { motion, AnimatePresence } from "framer-motion";

const SignOut = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [detectedSnack, setDetectedSnack] = useState<{ id: string; name: string } | null>(null);
  const [lunchRestrictionMessage, setLunchRestrictionMessage] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (isLunchTime()) {
      setLunchRestrictionMessage(getLunchTimeMessage());
    } else {
      setLunchRestrictionMessage(null);
    }
    
    const interval = setInterval(() => {
      if (isLunchTime()) {
        setLunchRestrictionMessage(getLunchTimeMessage());
      } else {
        setLunchRestrictionMessage(null);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleBarcodeDetected = async (barcode: string) => {
    setShowScanner(false);
    
    try {
      const { data, error } = await supabase
        .from("snacks")
        .select("id, name")
        .eq("barcode", barcode)
        .single();

      if (error || !data) {
        toast.error("Barcode not found", {
          description: "Using AI to identify snack..."
        });
        await captureAndIdentifySnack();
        return;
      }

      setDetectedSnack(data);
      toast.success("Snack detected!", {
        description: data.name,
      });
    } catch (err) {
      console.error("Error fetching snack:", err);
      toast.error("An error occurred while looking up the snack.");
    }
  };

  const captureAndIdentifySnack = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsIdentifying(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const { data, error } = await supabase.functions.invoke('identify-snack', {
        body: { imageData }
      });

      if (error) throw error;

      const snackName = data.snackName;
      
      // Try to find or create snack in database
      const { data: existingSnack } = await supabase
        .from("snacks")
        .select("id, name")
        .eq("name", snackName)
        .single();

      if (existingSnack) {
        setDetectedSnack(existingSnack);
      } else {
        // Create new snack entry
        const { data: newSnack, error: createError } = await supabase
          .from("snacks")
          .insert({ name: snackName, barcode: `AI-${Date.now()}` })
          .select("id, name")
          .single();

        if (createError) throw createError;
        setDetectedSnack(newSnack);
      }

      toast.success("Snack identified!", {
        description: snackName,
      });
    } catch (err) {
      console.error("Error identifying snack:", err);
      toast.error("Failed to identify snack. Please try again.");
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !detectedSnack) return;

    setIsSubmitting(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const authUser = userData.user;
      if (!authUser?.user_metadata?.full_name) {
        toast.error("User profile is incomplete. Please contact an administrator.");
        return;
      }

      const { error } = await supabase.from("snack_logs").insert({
        user_id: authUser.id,
        snack_id: detectedSnack.id,
        snack_name: detectedSnack.name,
        student_name: authUser.user_metadata.full_name,
      });
      
      if (error) throw error;

      toast.success("Snack logged successfully!", {
        description: `${detectedSnack.name} signed out`,
      });

      setDetectedSnack(null);
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

  const handleScanClick = () => {
    setShowScanner(true);
    setDetectedSnack(null);
  };

  const handleAIIdentify = async () => {
    setShowScanner(false);
    await captureAndIdentifySnack();
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
      <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-6 w-6" />
              Sign Out a Snack
            </CardTitle>
            <CardDescription>
              Scan barcode or use AI to identify your snack
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
                  className="space-y-3"
                >
                  <Button
                    onClick={handleScanClick}
                    className="w-full"
                    size="lg"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Scan Barcode
                  </Button>

                  <Button
                    onClick={handleAIIdentify}
                    variant="outline"
                    className="w-full"
                    size="lg"
                    disabled={isIdentifying}
                  >
                    {isIdentifying ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Identifying...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-5 w-5" />
                        Use AI Camera
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="snack-detected"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      className="flex items-center gap-3 mb-3"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <span className="font-semibold text-lg">Snack Detected!</span>
                    </motion.div>
                    <p className="text-2xl font-bold">{detectedSnack.name}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1"
                      size="lg"
                    >
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
                      disabled={isSubmitting}
                      size="lg"
                    >
                      Rescan
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              className="w-full mt-4"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {showScanner && (
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      {/* Hidden video and canvas for AI identification */}
      <div className="hidden">
        <video ref={videoRef} autoPlay playsInline />
        <canvas ref={canvasRef} />
      </div>
      </div>
    </div>
  );
};

export default SignOut;

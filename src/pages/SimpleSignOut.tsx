import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Camera, Check, Home, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { motion, AnimatePresence } from "framer-motion";
import { fetchFoodProduct } from "@/services/foodService";
import cafeteriaHero from "@/assets/cafeteria-hero.jpg";

const SimpleSignOut = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [detectedSnack, setDetectedSnack] = useState<{ id: string; name: string; image?: string; brand?: string } | null>(null);
  const [manualSnackName, setManualSnackName] = useState("");

  const handleBarcodeDetected = async (barcode: string) => {
    setShowScanner(false);
    try {
      const productData = await fetchFoodProduct(barcode);
      
      if (productData && productData.product) {
        setDetectedSnack({ 
          id: barcode,
          name: productData.product.product_name,
          image: productData.product.image_url,
          brand: productData.product.brands
        });
        toast.success("Snack detected!", { description: productData.product.product_name });
      } else {
        toast.error("Barcode not recognized", {
          description: "Please enter manually or try a different barcode.",
        });
      }
    } catch (err) {
      console.error("Error fetching snack:", err);
      toast.error("An error occurred while looking up the snack.");
    }
  };

  const handleManualEntry = async () => {
    if (!manualSnackName.trim()) {
      toast.error("Please enter a snack name");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your first and last name");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const userInput = manualSnackName.trim();

      // Store in sessionStorage (temporary, memory-only)
      const existingLogs = JSON.parse(sessionStorage.getItem("simple_logs") || "[]");
      const newLog = {
        id: Date.now().toString(),
        student_name: fullName,
        snack_name: userInput,
        timestamp: new Date().toISOString(),
      };
      existingLogs.push(newLog);
      sessionStorage.setItem("simple_logs", JSON.stringify(existingLogs));

      // Dispatch custom event so SimpleAdmin can listen for updates
      window.dispatchEvent(new Event("simple_log_added"));

      toast.success("Snack logged!", { 
        description: `"${userInput}" logged for ${fullName}` 
      });
      
      setManualSnackName("");
      setFirstName("");
      setLastName("");
      
    } catch (err) {
      console.error("Error adding snack:", err);
      toast.error("Failed to add snack. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDetected = async () => {
    if (!detectedSnack) return;

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your first and last name");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      // Store in sessionStorage (temporary, memory-only)
      const existingLogs = JSON.parse(sessionStorage.getItem("simple_logs") || "[]");
      const newLog = {
        id: Date.now().toString(),
        student_name: fullName,
        snack_name: detectedSnack.name,
        timestamp: new Date().toISOString(),
      };
      existingLogs.push(newLog);
      sessionStorage.setItem("simple_logs", JSON.stringify(existingLogs));

      // Dispatch custom event so SimpleAdmin can listen for updates
      window.dispatchEvent(new Event("simple_log_added"));

      toast.success("Snack logged successfully!", {
        description: `${detectedSnack.name} for ${fullName}`,
      });

      setDetectedSnack(null);
      setShowScanner(false);
      setFirstName("");
      setLastName("");
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

  return (
    <div className="min-h-screen bg-background">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-cover bg-center min-h-screen overflow-hidden flex items-center justify-center"
        style={{ backgroundImage: `url(${cafeteriaHero})` }}
      >
        {/* overlay to ensure text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

  <div className="relative z-10 text-center text-white px-4 max-w-7xl mx-auto py-20 md:py-28">
          {/* Title + Creator credit (styled exactly like homepage) */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-12"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Eastside Eats
                </h1>
                <img
                  src="/eaglelogo.png"
                  alt="Eastside Eats Eagle Logo"
                  className="w-16 h-16 md:w-20 md:h-20"
                />
              </div>

              <p className="text-xl md:text-2xl mb-2 font-light">
                Track your snacks in seconds
              </p>
              <p className="text-sm md:text-base text-white/80 max-w-2xl mx-auto mb-2">
                Scan barcodes or enter manually
              </p>
              <p className="text-xs md:text-sm text-white/60">
                Created by Prasham Dhruva
              </p>
            </motion.div>
          </motion.div>

          {/* Centered Card below the hero text */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex items-center justify-center mt-8 md:mt-12"
          >
            <div className="relative w-full max-w-lg">
              {/* Admin button: top-right above the dialog box */}
              <div className="absolute -top-4 right-0 md:-top-5 md:right-2 z-20">
                <Button onClick={() => navigate('/simple-admin')} variant="ghost" className="text-sm text-white/80">
                  Admin
                </Button>
              </div>

              <Card className="w-full shadow-2xl bg-white/95 dark:bg-black/70 backdrop-blur-md border border-white/30">
                <CardHeader className="flex items-start justify-between p-6">
                  <div>
                    <CardTitle className="text-2xl md:text-3xl">Log Your Snack</CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Enter your name, then scan or enter manually
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
              {/* Name Entry */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">First Name</label>
                    <Input
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-12 text-base"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Last Name</label>
                    <Input
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-12 text-base"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!detectedSnack ? (
                  <motion.div
                    key="scan-options"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <Button onClick={handleScanClick} className="w-full" size="lg">
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
                        disabled={isSubmitting || !manualSnackName.trim() || !firstName.trim() || !lastName.trim()}
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
                      <Button 
                        onClick={handleConfirmDetected} 
                        disabled={isSubmitting || !firstName.trim() || !lastName.trim()} 
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

              <Button onClick={() => navigate("/")} variant="ghost" className="w-full mt-4">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </CardContent>
            </Card>
          </div>
          </motion.div>
        </div>
      </motion.section>

      <AnimatePresence>
          {showScanner && (
            <BarcodeScanner
              onDetected={handleBarcodeDetected}
              onClose={() => {
                const videoEl = document.querySelector("video");
                if (videoEl && videoEl.srcObject) {
                  const stream = videoEl.srcObject as MediaStream;
                  stream.getTracks().forEach((track) => track.stop());
                }
                setShowScanner(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>
  );
};

export default SimpleSignOut;

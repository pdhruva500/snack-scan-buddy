import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Camera, UserCircle2, Scan, ArrowLeft, Wifi } from "lucide-react";
import cafeteriaHero from "@/assets/cafeteria-hero.jpg";
import { motion, AnimatePresence } from "framer-motion";
import { fetchFoodProduct } from "@/services/foodService";
import { toast } from "sonner";
import { isLunchTime, getLunchTimeMessage } from "@/lib/timeRestrictions";
import { usePhysicalBarcodeScanner } from "@/hooks/usePhysicalBarcodeScanner";

const SimpleSignOut = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [foodItem, setFoodItem] = useState("");
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<any>(null);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [lunchRestrictionMessage, setLunchRestrictionMessage] = useState<string | null>(null);
  const [lastPhysicalScan, setLastPhysicalScan] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  // Update lunch restriction message every minute
  useEffect(() => {
    const updateLunchStatus = () => {
      setLunchRestrictionMessage(isLunchTime() ? getLunchTimeMessage() : null);
    };

    updateLunchStatus();
    const interval = setInterval(updateLunchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle physical barcode scanner input
  const handlePhysicalBarcodeDetected = async (barcode: string) => {
    console.log("Physical scanner detected barcode:", barcode);
    setLastPhysicalScan(barcode);
    setScanCount(prev => prev + 1);
    setDetectedBarcode(barcode);
    
    try {
      const productData = await fetchFoodProduct(barcode);
      if (productData && productData.product && productData.product.product_name) {
        setDetectedProduct(productData.product);
        setFoodItem(productData.product.product_name);
        toast.success(`Detected: ${productData.product.product_name}`);
        // Show form after successful scan
        setShowForm(true);
      } else {
        toast.error("Product not found. Please enter manually.");
        setDetectedBarcode(null);
        setDetectedProduct(null);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to fetch product information.");
      setDetectedBarcode(null);
      setDetectedProduct(null);
    }
  };

  // Enable physical barcode scanner
  usePhysicalBarcodeScanner({
    onDetected: handlePhysicalBarcodeDetected,
    enabled: !lunchRestrictionMessage && !showForm,
    minLength: 5,
    timeout: 100,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !foodItem.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    // Store in localStorage instead of database so logs persist across refreshes
    const logEntry = {
      id: Date.now().toString(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      foodItem: foodItem.trim(),
      timestamp: new Date().toISOString(),
      barcode: detectedBarcode,
    };

    const existingLogs = JSON.parse(localStorage.getItem("simple_logs") || "[]");
    existingLogs.push(logEntry);
    localStorage.setItem("simple_logs", JSON.stringify(existingLogs));

    // Dispatch custom event so admin page can listen for updates
    window.dispatchEvent(new CustomEvent("simple_log_added", { detail: logEntry }));

  toast.success(`Logged snack for ${firstName} ${lastName}`);

  // show a more visible in-page confirmation
  setConfirmation(logEntry);
  // auto-hide after 3s
  setTimeout(() => setConfirmation(null), 3000);
    
    // Reset form
    setFirstName("");
    setLastName("");
    setFoodItem("");
    setDetectedBarcode(null);
    setDetectedProduct(null);
    
    // Go back to scanner view
    setTimeout(() => {
      setShowForm(false);
    }, 3000);
  };

  // Show scanner page when not in form mode
  if (!showForm) {
    return (
      <div className="min-h-screen bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative min-h-screen bg-cover bg-center flex items-center justify-center overflow-hidden"
          style={{ backgroundImage: `url(${cafeteriaHero})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          
          <div className="relative z-10 w-full max-w-2xl px-4 py-12">
            {/* Header */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center text-white mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Eastside Eats
                </h1>
                <Link to="/">
                  <img
                    src="/eaglelogo.png"
                    alt="Eastside Eats Eagle Logo"
                    className="w-12 h-12 md:w-16 md:h-16"
                  />
                </Link>
              </div>
              <p className="text-sm md:text-base text-white/60">
                Created by Prasham Dhruva
              </p>
            </motion.div>

            {/* Scanner Status Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-6"
            >
              <Card className="backdrop-blur-sm bg-background/95 border-2 border-primary/50">
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center"
                    >
                      <Wifi className="h-8 w-8 text-primary" />
                    </motion.div>
                  </div>
                  <CardTitle className="text-2xl flex items-center justify-center gap-3">
                    Physical Scanner Ready
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      Active
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Point your barcode scanner at a snack to begin
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="flex items-center justify-center gap-8 text-muted-foreground mb-4">
                    <div>
                      <p className="text-sm font-medium">Scans Today</p>
                      <p className="text-2xl font-bold text-foreground">{scanCount}</p>
                    </div>
                    {lastPhysicalScan && (
                      <div>
                        <p className="text-sm font-medium">Last Scan</p>
                        <p className="text-lg font-mono text-foreground">
                          {lastPhysicalScan.substring(0, 12)}...
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg text-left">
                    <div className="flex items-start gap-3">
                      <Scan className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium mb-2">How to use:</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Point scanner at barcode</li>
                          <li>Press scan button</li>
                          <li>Enter your name</li>
                          <li>Submit to log snack</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                  
                  {lunchRestrictionMessage && (
                    <Alert className="mt-4">
                      <AlertDescription>{lunchRestrictionMessage}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Waiting State */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="mb-4"
              >
                <Scan className="h-16 w-16 mx-auto text-primary/40" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                Waiting for scan...
              </h3>
              <p className="text-white/60">
                Scanner is ready. Point your device at any barcode.
              </p>
              
              <div className="mt-6 flex items-center justify-center gap-4">
                <Link to="/">
                  <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
                <Link to="/simple-scan">
                  <Button variant="default" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Scan className="mr-2 h-4 w-4" />
                    Scan Snack
                  </Button>
                </Link>
                <Link to="/simple-admin">
                  <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                    <UserCircle2 className="mr-2 h-4 w-4" />
                    Admin View
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show form after successful scan
  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative min-h-screen bg-cover bg-center flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: `url(${cafeteriaHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        
  <div className="relative z-10 w-full max-w-md px-4 py-12">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center text-white mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent whitespace-nowrap">
                Eastside Eats
              </h1>
              <Link to="/">
                <img
                  src="/eaglelogo.png"
                  alt="Eastside Eats Eagle Logo"
                  className="w-16 h-16 md:w-20 md:h-20"
                />
              </Link>
            </div>
            <p className="text-lg md:text-xl mb-2 font-light">
              Quick snack logging for tablets
            </p>
            <p className="text-xs md:text-sm text-white/60">
              Created by Prasham Dhruva
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {/* Visible confirmation banner */}
            {confirmation && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3 rounded-lg bg-emerald-600/90 text-white flex items-center justify-between shadow-lg"
              >
                <div>
                  <div className="font-semibold">Logged: {confirmation.firstName} {confirmation.lastName}</div>
                  <div className="text-sm">{confirmation.foodItem}</div>
                </div>
                <div className="text-xs opacity-90">Saved</div>
              </motion.div>
            )}
            <Card className="backdrop-blur-sm bg-background/95 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">Sign Out a Snack</CardTitle>
                <CardDescription>
                  Enter your name and the snack you're taking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lunchRestrictionMessage && (
                  <Alert className="mb-4">
                    <AlertDescription>{lunchRestrictionMessage}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="foodItem">Food Item</Label>
                    <Input
                      id="foodItem"
                      placeholder="Scan barcode or enter food name"
                      value={foodItem}
                      onChange={(e) => setFoodItem(e.target.value)}
                      required
                    />
                    {detectedProduct && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Wifi className="h-3 w-3 text-primary" />
                        <span>Scanned: {detectedProduct.product_name}</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={!!lunchRestrictionMessage}
                    title={lunchRestrictionMessage ?? undefined}
                  >
                    Submit
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t text-center">
                  <div className="flex items-center justify-center gap-8">
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Link>
                    <Link 
                      to="/simple-admin" 
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <UserCircle2 className="h-4 w-4" />
                      Admin View
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default SimpleSignOut;

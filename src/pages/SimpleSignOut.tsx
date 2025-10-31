import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, UserCircle2, Scan } from "lucide-react";
import cafeteriaHero from "@/assets/cafeteria-hero.jpg";
import { motion, AnimatePresence } from "framer-motion";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { fetchFoodProduct } from "@/services/foodService";
import { toast } from "sonner";

const SimpleSignOut = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [foodItem, setFoodItem] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<any>(null);
  const [confirmation, setConfirmation] = useState<any>(null);

  const handleBarcodeDetected = async (barcode: string) => {
    setShowScanner(false);
    setDetectedBarcode(barcode);
    
    try {
      const productData = await fetchFoodProduct(barcode);
      if (productData && productData.product && productData.product.product_name) {
        setDetectedProduct(productData.product);
        setFoodItem(productData.product.product_name);
        toast.success(`Detected: ${productData.product.product_name}`);
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
  };

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
              <img
                src="/eaglelogo.png"
                alt="Eastside Eats Eagle Logo"
                className="w-16 h-16 md:w-20 md:h-20"
              />
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
                    <div className="flex gap-2">
                      <Input
                        id="foodItem"
                        placeholder="Enter food name or scan barcode"
                        value={foodItem}
                        onChange={(e) => setFoodItem(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowScanner(true)}
                        title="Scan Barcode"
                      >
                        <Scan className="h-4 w-4" />
                      </Button>
                    </div>
                    {detectedProduct && (
                      <p className="text-xs text-muted-foreground">
                        Scanned: {detectedProduct.product_name}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    Submit
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t text-center">
                  <Link 
                    to="/simple-admin" 
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <UserCircle2 className="h-4 w-4" />
                    Admin View
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Barcode Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimpleSignOut;

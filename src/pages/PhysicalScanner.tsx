import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, ArrowLeft, Wifi, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FoodItemDisplay, FoodItemSkeleton } from "@/components/FoodItemDisplay";
import { fetchFoodProduct } from "@/services/foodService";
import { usePhysicalBarcodeScanner } from "@/hooks/usePhysicalBarcodeScanner";

const PhysicalScanner = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handlePhysicalBarcodeDetected = async (barcode: string) => {
    console.log("Physical scanner detected barcode:", barcode);
    setLastScan(barcode);
    setScanCount(prev => prev + 1);
    setIsLoadingProduct(true);
    
    try {
      const productData = await fetchFoodProduct(barcode);
      if (productData && productData.product) {
        setScannedProduct(productData.product);
      } else {
        alert("Product not found. Please try another barcode.");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      alert("Failed to fetch product information.");
    } finally {
      setIsLoadingProduct(false);
    }
  };

  // Enable physical barcode scanner
  usePhysicalBarcodeScanner({
    onDetected: handlePhysicalBarcodeDetected,
    enabled: !!user && !loading,
    minLength: 5,
    timeout: 100,
  });

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
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        {/* Scanner Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <Wifi className="h-10 w-10 text-primary" />
                </motion.div>
              </div>
              <CardTitle className="text-3xl flex items-center justify-center gap-3">
                Physical Scanner Active
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Ready
                </Badge>
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Point your barcode scanner at a snack and press scan
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center gap-8 text-muted-foreground">
                <div>
                  <p className="text-sm font-medium">Scans Today</p>
                  <p className="text-2xl font-bold text-foreground">{scanCount}</p>
                </div>
                {lastScan && (
                  <div>
                    <p className="text-sm font-medium">Last Scan</p>
                    <p className="text-lg font-mono text-foreground">
                      {lastScan.substring(0, 12)}...
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-3 text-left">
                  <Scan className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">How to use:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Ensure your scanner is connected and powered on</li>
                      <li>Point the scanner at a barcode on your snack</li>
                      <li>Press the scan button on your device</li>
                      <li>Product information will appear below automatically</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Scanned Product Display */}
        <AnimatePresence mode="wait">
          {isLoadingProduct && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <FoodItemSkeleton />
            </motion.div>
          )}
          
          {!isLoadingProduct && scannedProduct && (
            <motion.div
              key="product"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <FoodItemDisplay product={scannedProduct} />
              
              <div className="text-center mt-6">
                <Button
                  onClick={() => setScannedProduct(null)}
                  variant="outline"
                  size="lg"
                >
                  <Scan className="mr-2 h-5 w-5" />
                  Scan Another Snack
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waiting State - Show when no product is loaded */}
        {!isLoadingProduct && !scannedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto text-center py-12"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="mb-6"
            >
              <Scan className="h-24 w-24 mx-auto text-primary/40" />
            </motion.div>
            <h3 className="text-2xl font-semibold mb-2 text-muted-foreground">
              Waiting for scan...
            </h3>
            <p className="text-muted-foreground">
              Scanner is ready. Point your device at any barcode to begin.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PhysicalScanner;

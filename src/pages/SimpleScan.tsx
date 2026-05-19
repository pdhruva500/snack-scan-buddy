import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wifi, Scan } from "lucide-react";
import { motion } from "framer-motion";
import { fetchFoodProduct } from "@/services/foodService";
import { toast } from "sonner";
import { usePhysicalBarcodeScanner } from "@/hooks/usePhysicalBarcodeScanner";
import { FoodItemDisplay, FoodItemSkeleton } from "@/components/FoodItemDisplay";

const SimpleScan = () => {
  const navigate = useNavigate();
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");
  const [scanCount, setScanCount] = useState(0);
  const [unmatchedBarcode, setUnmatchedBarcode] = useState<string | null>(null);

  const stripBarcodeFromName = (name: string, barcode?: string | null) => {
    if (!barcode) return name;
    const escaped = barcode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return name.replace(new RegExp(escaped, "g"), "").replace(/\s{2,}/g, " ").trim();
  };

  const handlePhysicalBarcodeDetected = async (barcode: string) => {
    console.log("Physical scanner detected barcode:", barcode);
    setLastScan(barcode);
    setScanCount(prev => prev + 1);
    setIsLoadingProduct(true);
    
    try {
      const productData = await fetchFoodProduct(barcode);
      if (productData && productData.product) {
        setScannedProduct(productData.product);
        const displayName = stripBarcodeFromName(productData.product.product_name, barcode);
        toast.success(`Scanned: ${displayName}`);
        try {
          const { normalizeProductName } = ((window as any).require?.("@/lib/nameMap") ?? (() => { throw new Error("no require"); })());
          // replace displayed name in product for the scanner preview
          const normalized = normalizeProductName(productData.product.product_name, productData.product.brands);
          productData.product.product_name = stripBarcodeFromName(normalized, barcode);
        } catch {}
        setUnmatchedBarcode(null);
      } else {
        setUnmatchedBarcode(barcode);
        toast("Barcode not recognized yet", {
          description: "You can still log it by entering a quick snack name.",
        });
        setScannedProduct(null);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast("Could not reach the product catalog", {
        description: "You can still log it by entering a quick snack name.",
      });
      setScannedProduct(null);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  // Enable physical barcode scanner
  usePhysicalBarcodeScanner({
    onDetected: handlePhysicalBarcodeDetected,
    enabled: true,
    minLength: 5,
    timeout: 100,
  });


  const DRAFT_KEY = 'simple_signout_draft';

  const appendToDraft = (product: any, barcode?: string) => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      const draft = raw ? JSON.parse(raw) : {};
      
      // Use new scannedItems structure
      draft.scannedItems = draft.scannedItems || [];
      
      try {
        const { normalizeProductName } = ((window as any).require?.("@/lib/nameMap") ?? (() => { throw new Error("no require"); })());
        const normalizedName = normalizeProductName(product.product_name, product.brands);
        
        draft.scannedItems.push({
          id: `scan-${Date.now()}-${Math.random()}`,
          product: product,
          barcode: barcode || '',
          name: normalizedName
        });
      } catch {
        draft.scannedItems.push({
          id: `scan-${Date.now()}-${Math.random()}`,
          product: product,
          barcode: barcode || '',
          name: product.product_name
        });
      }
      
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      // notify signout page
      window.dispatchEvent(new Event('simple_log_draft_updated'));
    } catch (e) {
      console.error('Failed to update draft:', e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/simple")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
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
                Scanner Ready
                <Badge variant="default" className="ml-2">
                  Active
                </Badge>
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Place your snack under the scanner to detect the barcode
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Scan className="h-5 w-5" />
                <span>Scanner is listening for barcodes...</span>
              </div>
              {/* Camera scanner option removed for testing */}
              
              {scanCount > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Scans detected: <span className="font-bold text-primary">{scanCount}</span>
                  </p>
                  {lastScan && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last barcode: {lastScan}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading State */}
        {isLoadingProduct && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FoodItemSkeleton />
          </motion.div>
        )}

        {/* Scanned Product Display */}
        {!isLoadingProduct && scannedProduct && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FoodItemDisplay product={scannedProduct} />
                <div className="max-w-2xl mx-auto mt-4 text-center flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // add to draft and allow scanning another
                      appendToDraft(scannedProduct, lastScan);
                      setScannedProduct(null);
                      setLastScan("");
                    }}
                  >
                    Add & Scan Another
                  </Button>

                  <Button
                    onClick={() => {
                      // add to draft and return to sign-out page
                      appendToDraft(scannedProduct, lastScan);
                      navigate('/simple');
                    }}
                  >
                    Log Snack
                  </Button>
                </div>
          </motion.div>
        )}

        {!isLoadingProduct && !scannedProduct && unmatchedBarcode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mt-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>We could not match that barcode</CardTitle>
                <CardDescription>
                  You can still log the snack by entering a quick name on the next screen.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => {
                    try {
                      const raw = sessionStorage.getItem(DRAFT_KEY);
                      const draft = raw ? JSON.parse(raw) : {};
                      draft.unmatchedBarcode = unmatchedBarcode;
                      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
                    } catch {}
                    navigate("/simple");
                  }}
                >
                  Enter Manually
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setUnmatchedBarcode(null)}
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Instructions */}
        {!isLoadingProduct && !scannedProduct && scanCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  How to Scan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Make sure the scanner is connected and active</li>
                  <li>Hold your snack's barcode under the scanner</li>
                  <li>Wait for the beep sound</li>
                  <li>The product information will appear automatically</li>
                </ol>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      {/* Camera scanner removed for testing */}
    </div>
  );
};

export default SimpleScan;

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Camera, UserCircle2, Scan, ArrowLeft, X } from "lucide-react";
import cafeteriaHero from "@/assets/cafeteria-hero.jpg";
import { motion, AnimatePresence } from "framer-motion";
import { usePhysicalBarcodeScanner } from "@/hooks/usePhysicalBarcodeScanner";
import { fetchFoodProduct } from "@/services/foodService";
import { toast } from "sonner";
import { isLunchTime, getLunchTimeMessage } from "@/lib/timeRestrictions";

const SimpleSignOut = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [manualFoodItem, setManualFoodItem] = useState("");
  const [scannedItems, setScannedItems] = useState<Array<{id: string, product: any, barcode: string, name: string}>>([]);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [lunchRestrictionMessage, setLunchRestrictionMessage] = useState<string | null>(null);
  const [totalScans, setTotalScans] = useState<number>(0);

  const DRAFT_KEY = "simple_signout_draft";
  const draftRef = useRef<any>({});

  // keep ref updated with latest values so cleanup can save current draft
  useEffect(() => {
    draftRef.current = { firstName, lastName, manualFoodItem, scannedItems };
  }, [firstName, lastName, manualFoodItem, scannedItems]);

  // Restore draft from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.firstName) setFirstName(draft.firstName);
        if (draft.lastName) setLastName(draft.lastName);
        if (draft.manualFoodItem) setManualFoodItem(draft.manualFoodItem);
        if (draft.scannedItems && Array.isArray(draft.scannedItems)) {
          setScannedItems(draft.scannedItems);
        }
        // Also check for legacy detectedProducts from scanner page
        if (draft.detectedProducts && Array.isArray(draft.detectedProducts)) {
          const items = draft.detectedProducts.map((item: any, idx: number) => ({
            id: `legacy-${idx}-${Date.now()}`,
            product: item.product,
            barcode: item.barcode || '',
            name: item.product?.product_name || 'Unknown'
          }));
          setScannedItems(prev => [...prev, ...items]);
        }
      }
    } catch (e) {
      console.error("Failed to restore draft:", e);
    }

    // Listen for updates from scanner page
    const handleDraftUpdate = () => {
      try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          if (draft.detectedProducts && Array.isArray(draft.detectedProducts)) {
            const newItems = draft.detectedProducts.map((item: any, idx: number) => ({
              id: `scan-${idx}-${Date.now()}`,
              product: item.product,
              barcode: item.barcode || '',
              name: item.product?.product_name || 'Unknown'
            }));
            setScannedItems(newItems);
            // Clear the legacy format
            delete draft.detectedProducts;
            delete draft.detectedProduct;
            delete draft.detectedBarcode;
            draft.scannedItems = newItems;
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
          }
        }
      } catch (e) {
        console.error("Failed to handle draft update:", e);
      }
    };

    window.addEventListener('simple_log_draft_updated', handleDraftUpdate);

    return () => {
      window.removeEventListener('simple_log_draft_updated', handleDraftUpdate);
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draftRef.current || {}));
      } catch (e) {
        console.error("Failed to save draft on unmount:", e);
      }
    };
  }, []);

  // Persist the draft whenever key parts change
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draftRef.current || {}));
    } catch (e) {
      console.error('Failed to persist draft on change:', e);
    }
  }, [firstName, lastName, manualFoodItem, scannedItems]);

  // Update lunch restriction message every minute
  useEffect(() => {
    const updateLunchStatus = () => {
      setLunchRestrictionMessage(isLunchTime() ? getLunchTimeMessage() : null);
    };

    updateLunchStatus();
    const interval = setInterval(updateLunchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleBarcodeDetected = async (barcode: string) => {
    console.log("Barcode detected:", barcode);
    
    try {
      const productData = await fetchFoodProduct(barcode);
      if (productData && productData.product && productData.product.product_name) {
        try {
          const { normalizeProductName } = require("@/lib/nameMap");
          const normalizedName = normalizeProductName(productData.product.product_name, productData.product.brands);
          
          const newItem = {
            id: `scan-${Date.now()}-${Math.random()}`,
            product: productData.product,
            barcode: barcode,
            name: normalizedName
          };
          
          setScannedItems(prev => [...prev, newItem]);
          toast.success(`Scanned: ${normalizedName}`);
        } catch {
          const newItem = {
            id: `scan-${Date.now()}-${Math.random()}`,
            product: productData.product,
            barcode: barcode,
            name: productData.product.product_name
          };
          setScannedItems(prev => [...prev, newItem]);
          toast.success(`Scanned: ${productData.product.product_name}`);
        }
      } else {
        toast.error("Product not found. Please enter manually.");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to fetch product information.");
    }
  };

  const removeScannedItem = (id: string) => {
    setScannedItems(prev => prev.filter(item => item.id !== id));
    toast.info("Item removed");
  };

  const addManualItem = () => {
    const val = manualFoodItem.trim();
    if (!val) {
      toast.error('Please enter a food name to add');
      return;
    }
    const newItem = {
      id: `manual-${Date.now()}-${Math.random()}`,
      product: null,
      barcode: null,
      name: val,
    };
    setScannedItems(prev => [...prev, newItem]);
    setManualFoodItem("");
    toast.success('Added manual item');
  };

  usePhysicalBarcodeScanner({
    onDetected: handleBarcodeDetected,
    enabled: !lunchRestrictionMessage,
    minLength: 5,
    timeout: 100,
    allowOnInputs: true,
  });

  // Total scans counter (updates when logs change)
  useEffect(() => {
    const refresh = () => {
      // read persistent total counter; fall back to current logs length if missing
      const total = Number(localStorage.getItem('simple_total_scans'));
      if (!isNaN(total) && total > 0) {
        setTotalScans(total);
        return;
      }
      const stored = JSON.parse(localStorage.getItem('simple_logs') || '[]');
      setTotalScans((stored || []).length);
    };

    refresh();
    // only listen for additions — deletes/clears should NOT decrement this counter
    window.addEventListener('simple_log_added', refresh as EventListener);
    return () => {
      window.removeEventListener('simple_log_added', refresh as EventListener);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    // Need at least one item (scanned or manual)
    const hasScannedItems = scannedItems.length > 0;
    const hasManualItem = manualFoodItem.trim().length > 0;

    if (!hasScannedItems && !hasManualItem) {
      toast.error("Please scan or enter a food item");
      return;
    }

    // Create log entries for all items
    const itemsToLog = [];
    
    if (hasManualItem) {
      itemsToLog.push({
        id: Date.now().toString(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        foodItem: manualFoodItem.trim(),
        timestamp: new Date().toISOString(),
        barcode: null,
      });
    }

    scannedItems.forEach((item, idx) => {
      itemsToLog.push({
        id: `${Date.now()}-${idx}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        foodItem: item.name,
        timestamp: new Date().toISOString(),
        barcode: item.barcode,
      });
    });

    // Store all entries in localStorage
    const existingLogs = JSON.parse(localStorage.getItem("simple_logs") || "[]");
    existingLogs.push(...itemsToLog);
    localStorage.setItem("simple_logs", JSON.stringify(existingLogs));

    // Update persistent total scans counter
    try {
      const prev = Number(localStorage.getItem('simple_total_scans') || 0);
      localStorage.setItem('simple_total_scans', String(prev + itemsToLog.length));
    } catch (e) {}

    // Dispatch events for each log entry
    itemsToLog.forEach(entry => {
      window.dispatchEvent(new CustomEvent("simple_log_added", { detail: entry }));
    });

    toast.success(`Logged ${itemsToLog.length} item(s) for ${firstName} ${lastName}`);

    // Show confirmation
    setConfirmation({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      count: itemsToLog.length,
      items: itemsToLog.map(i => i.foodItem)
    });
    setTimeout(() => setConfirmation(null), 3000);
    
    // Reset form
    setFirstName("");
    setLastName("");
    setManualFoodItem("");
    setScannedItems([]);
    try { 
      sessionStorage.removeItem(DRAFT_KEY); 
    } catch {}
  };

  // Keep the form-based UI below; scanner modal controlled by `showScanner`.
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
            <div className="flex items-center justify-center gap-3 mb-4 flex-nowrap">
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent whitespace-nowrap">Eastside Eats</h1>
              <img src="/eaglelogo.png" alt="Eastside Eats Eagle Logo" className="w-16 h-16 md:w-20 md:h-20" />
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
                className="mb-4 p-3 rounded-lg bg-emerald-600/90 text-white shadow-lg"
              >
                <div className="font-semibold">
                  Logged {confirmation.count} item(s) for {confirmation.firstName} {confirmation.lastName}
                </div>
                <div className="text-sm mt-1">
                  {confirmation.items.join(", ")}
                </div>
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
                    <div className="flex gap-2">
                      <Input
                        id="foodItem"
                        placeholder="Type food name or use scanner"
                        value={manualFoodItem}
                        onChange={(e) => setManualFoodItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            addManualItem();
                          }
                        }}
                      />
                      <Button type="button" size="sm" onClick={addManualItem} disabled={!!lunchRestrictionMessage}>
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigate("/simple-scan");
                        }}
                        disabled={!!lunchRestrictionMessage}
                        title={lunchRestrictionMessage ?? "Open Scanner"}
                      >
                        <Scan className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Scanned Items Display */}
                  {scannedItems.length > 0 && (
                    <div className="space-y-2">
                      <Label>Scanned Items ({scannedItems.length})</Label>
                      <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                          {scannedItems.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Badge
                                variant="secondary"
                                className="px-3 py-1.5 text-sm flex items-center gap-2 cursor-pointer hover:bg-destructive/20"
                              >
                                <span>{item.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeScannedItem(item.id)}
                                  className="hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click X to remove an item. All items will be logged when you submit.
                      </p>
                    </div>
                  )}

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

      {/* Camera scanner moved to /simple-scan; physical scanner fills form directly. */}
        {/* Small total scans counter */}
        <div className="fixed right-4 bottom-4 bg-white/95 text-sm text-muted-foreground px-3 py-1 rounded-full shadow-lg flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Total scans</span>
          <span className="font-semibold text-sm">{totalScans}</span>
        </div>
      </div>
  );
};

export default SimpleSignOut;

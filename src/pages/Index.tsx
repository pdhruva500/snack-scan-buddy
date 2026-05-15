import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Shield, Zap, Loader2, Scan, BarChart3 } from "lucide-react";
import cafeteriaHero from "@/assets/cafeteria-hero.jpg";
import { motion, AnimatePresence } from "framer-motion";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { FoodItemDisplay, FoodItemSkeleton } from "@/components/FoodItemDisplay";
import { fetchFoodProduct } from "@/services/foodService";
import { isLunchTime, getLunchTimeMessage } from "@/lib/timeRestrictions";
import { loadLogs } from "@/services/simpleLogService";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [totalScans, setTotalScans] = useState<number>(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    
    const refresh = async () => {
      try {
        const logs = await loadLogs();
        setTotalScans(logs.length);
      } catch {
        const stored = JSON.parse(localStorage.getItem('simple_logs') || '[]');
        setTotalScans((stored || []).length);
      }
    };

    refresh();
    window.addEventListener('simple_log_added', refresh as EventListener);
    window.addEventListener('simple_log_removed', refresh as EventListener);
    window.addEventListener('simple_logs_cleared', refresh as EventListener);
    return () => {
      window.removeEventListener('simple_log_added', refresh as EventListener);
      window.removeEventListener('simple_log_removed', refresh as EventListener);
      window.removeEventListener('simple_logs_cleared', refresh as EventListener);
    };
  }, [user, loading, navigate]);

  const handleBarcodeDetected = async (barcode: string) => {
    setShowScanner(false);
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[600px] bg-cover bg-center flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: `url(${cafeteriaHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative z-10 text-center text-white px-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-6"
          >

            <div className="flex flex-col items-center justify-center gap-4 mb-4">
              <img
                src="/eaglelogo.png"
                alt="Eastside Eats Eagle Logo"
                className="w-24 h-24 md:w-32 md:h-32"
              />
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Eastside Eats
              </h1>
            </div>

            <p className="text-xl md:text-2xl mb-2 font-light">
              Track your snacks in seconds
            </p>
            <p className="text-sm md:text-base text-white/80 max-w-2xl mx-auto mb-2">
              Scan barcodes or enter manually
            </p>
            
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            {isLunchTime() ? (
              <div title={getLunchTimeMessage()}>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 text-white border-white hover:bg-white/20 hover:scale-105 transition-transform backdrop-blur-sm"
                  disabled
                >
                  <Scan className="mr-2 h-5 w-5" />
                  Scan a Snack
                </Button>
              </div>
            ) : (
              <Link to="/sign-out">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-white/10 text-white border-white hover:bg-white/20 hover:scale-105 transition-transform backdrop-blur-sm"
                >
                  <Scan className="mr-2 h-5 w-5" />
                  Scan a Snack
                </Button>
              </Link>
            )}

            <Link to="/dashboard">
              <Button size="lg" variant="outline"className="bg-white/10 text-white border-white hover:bg-white/20 hover:scale-105 transition-transform backdrop-blur-sm">
              <BarChart3 className="mr-2 h-5 w-5" />
              Dashboard
              </Button>
            </Link>

          </motion.div>
        </motion.div>
      </motion.div>

      {/* Barcode Scanner */}
      <AnimatePresence>
        {showScanner && (
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      {/* Scanned Product Display */}
      {(isLoadingProduct || scannedProduct) && (
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isLoadingProduct ? (
              <FoodItemSkeleton />
            ) : scannedProduct ? (
              <FoodItemDisplay product={scannedProduct} />
            ) : null}
          </motion.div>
        </div>
      )}

      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Lightning-fast snack logging with cutting-edge technology
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <Card className="hover:shadow-xl transition-all hover:-translate-y-1 h-full border-2">
              <CardHeader>
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Scan className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Barcode Scanning</CardTitle>
                <CardDescription>
                  Instant snack recognition via barcode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Point your camera at any barcode and we'll instantly identify and log your snack. 
                  Fast, accurate, and seamless.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card className="hover:shadow-xl transition-all hover:-translate-y-1 h-full border-2 border-primary/50">
              <CardHeader>
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>AI Recognition</CardTitle>
                <CardDescription>
                  Smart camera identifies snacks visually
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No barcode? No problem! Our AI-powered camera can identify snacks 
                  visually with remarkable accuracy.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card className="hover:shadow-xl transition-all hover:-translate-y-1 h-full border-2">
              <CardHeader>
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Real-Time Analytics</CardTitle>
                <CardDescription>
                  Live dashboard with insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track all activity in real-time with our admin dashboard. 
                  Search, filter, and analyze snack logs instantly.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center mb-16"
        >
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20 hover:shadow-xl transition-all cursor-pointer" onClick={() => window.location.href = '/simple'}>
            <CardHeader>
              <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 mx-auto">
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
              <CardTitle className="text-2xl">Simple Mode Available</CardTitle>
              <CardDescription className="text-base">
                Try our streamlined version for quick tablet-based logging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
                Perfect for cafeteria tablets! No login required - just enter your name and scan. 
                Ideal for testing or as a simplified alternative to the full app.
              </p>
              <Button size="lg" variant="outline" className="bg-background hover:bg-accent">
                Try Simple Mode
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 mx-auto">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Secure & Private</CardTitle>
              <CardDescription className="text-base">
                Your data is protected with enterprise-grade security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                PIN-protected admin access, encrypted data storage, and role-based permissions 
                ensure your cafeteria tracking system stays secure and compliant.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>

  );
};

export default Index;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addSnackLog } from "@/lib/storage";
import { toast } from "sonner";
import { Scan, CheckCircle } from "lucide-react";

const SNACK_OPTIONS = [
  "Fairlife Milk",
  "Granola Mini Packet",
  "Chips",
  "Cookies",
  "Apple",
  "Banana",
  "Protein Bar",
  "Trail Mix",
  "String Cheese",
  "Yogurt",
];

const SignOut = () => {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState("");
  const [selectedSnack, setSelectedSnack] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const handleSubmit = async (e: React.FormEvent, scanType: 'manual' | 'barcode' = 'manual') => {
    e.preventDefault();
    
    if (!studentName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    
    if (!selectedSnack) {
      toast.error("Please select a snack");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      addSnackLog({
        studentName: studentName.trim(),
        snackName: selectedSnack,
        scanType,
      });
      
      toast.success("Snack signed out successfully!", {
        description: `${studentName} took ${selectedSnack}`,
        icon: <CheckCircle className="w-4 h-4" />,
      });
      
      // Reset form
      setStudentName("");
      setSelectedSnack("");
      setShowBarcodeScanner(false);
      
      // Navigate back to home after a short delay
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      toast.error("Failed to sign out snack. Please try again.");
      console.error('Error signing out snack:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBarcodeSimulation = () => {
    // Simulate barcode scan by selecting a random snack
    const randomSnack = SNACK_OPTIONS[Math.floor(Math.random() * SNACK_OPTIONS.length)];
    setSelectedSnack(randomSnack);
    setShowBarcodeScanner(false);
    toast.success("Barcode scanned!", {
      description: `Detected: ${randomSnack}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-lg border-2">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">Sign Out a Snack</CardTitle>
            <CardDescription className="text-base">
              Enter your name and select your snack
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e, 'manual')} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="studentName" className="text-lg">
                  Your Name
                </Label>
                <Input
                  id="studentName"
                  type="text"
                  placeholder="Enter your full name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="h-14 text-lg border-2"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="snack" className="text-lg">
                  Select Your Snack
                </Label>
                
                <div className="flex gap-2">
                  <Select value={selectedSnack} onValueChange={setSelectedSnack} required>
                    <SelectTrigger className="h-14 text-lg border-2 flex-1">
                      <SelectValue placeholder="Choose a snack..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SNACK_OPTIONS.map((snack) => (
                        <SelectItem key={snack} value={snack} className="text-lg py-3">
                          {snack}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="xl"
                    onClick={() => setShowBarcodeScanner(!showBarcodeScanner)}
                  >
                    <Scan className="w-6 h-6" />
                  </Button>
                </div>
              </div>
              
              {showBarcodeScanner && (
                <Card className="bg-muted border-2 border-dashed">
                  <CardContent className="pt-6 text-center space-y-4">
                    <Scan className="w-16 h-16 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Barcode scanner simulation
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleBarcodeSimulation}
                    >
                      Simulate Barcode Scan
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  onClick={() => navigate("/")}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  variant="success"
                  size="xl"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing Out..." : "Sign Out Snack"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SignOut;

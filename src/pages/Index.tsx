import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, UserCircle, Camera, Sparkles } from "lucide-react";
import heroImage from "@/assets/cafeteria-hero.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-6">
          <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-xl mb-8">
            <img 
              src={heroImage} 
              alt="Cafeteria snacks" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent flex items-end justify-center pb-8">
              <div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
                  Eastside Eats
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground">
                  Barcode-Powered Snack Tracking
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            No more messy handwriting for cashiers to decipher. Scan your snack's barcode and we'll handle the rest.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button asChild variant="default" size="xl" className="w-full sm:w-auto min-w-64">
              <Link to="/sign-out">
                <ClipboardList className="w-5 h-5" />
                Sign Out a Snack
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="xl" className="w-full sm:w-auto min-w-64">
              <Link to="/admin">
                <UserCircle className="w-5 h-5" />
                View Admin Dashboard
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-16">
          <Card className="text-center shadow-md hover:shadow-lg transition-shadow border-2">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Barcode Scanner</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Scan your snack's barcode for instant logging. AI-powered recognition automatically identifies items.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="text-center shadow-md hover:shadow-lg transition-shadow border-2">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <UserCircle className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Admin Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Cashiers receive clean, digital logs with no handwriting to decode. Export to CSV anytime.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
        
        {/* Coming Soon Section */}
        <Card className="max-w-3xl mx-auto mt-16 border-2 border-dashed border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
              Coming Soon: AI Camera Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base text-center">
              In the future, simply hold up your snack to the camera and our AI will automatically identify it for you. 
              No typing required!
            </CardDescription>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;

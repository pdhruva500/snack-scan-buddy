import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

interface FoodItemDisplayProps {
  product: {
    product_name: string;
    brands: string;
    image_url: string;
    nutriments: {
      energy_100g?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
    };
    ingredients_text?: string;
  };
  onLogSuccess?: () => void;
}

export const FoodItemDisplay = ({ product, onLogSuccess }: FoodItemDisplayProps) => {
  const [isLogging, setIsLogging] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const handleLogSnack = async () => {
    setIsLogging(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const authUser = userData.user;
      if (!authUser) {
        toast.error("You must be signed in to log snacks");
        return;
      }

      // Get user's profile for full name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", authUser.id)
        .maybeSingle();

      // Get or create a snack entry (placeholder ID approach)
      const { data: anySnack } = await supabase
        .from("snacks")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!anySnack) {
        toast.error("Database error. Please contact admin.");
        return;
      }

      // Log the snack
      const { error: logError } = await supabase.from("snack_logs").insert({
        user_id: authUser.id,
        snack_id: anySnack.id,
        snack_name: product.product_name,
        student_name: profile?.full_name || authUser.email || 'Unknown',
      });

      if (logError) throw logError;

      setIsLogged(true);
      toast.success("Snack logged successfully!", {
        description: `${product.product_name} has been added to your log`,
      });

      if (onLogSuccess) {
        setTimeout(() => onLogSuccess(), 1500);
      }
    } catch (error) {
      console.error("Error logging snack:", error);
      toast.error("Failed to log snack. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.product_name}
              className="w-16 h-16 object-cover rounded"
            />
          )}
          <div>
            <h2 className="text-xl font-bold">{product.product_name}</h2>
            <p className="text-sm text-muted-foreground">{product.brands}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleLogSnack} 
          disabled={isLogging || isLogged}
          className="w-full"
          size="lg"
          variant={isLogged ? "outline" : "default"}
        >
          {isLogging ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging...
            </>
          ) : isLogged ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Logged Successfully
            </>
          ) : (
            "Log This Snack"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export const FoodItemSkeleton = () => (
  <Card className="w-full max-w-2xl mx-auto">
    <CardHeader>
      <CardTitle className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded" />
        <div className="flex-1">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div>
          <Skeleton className="h-5 w-24 mb-4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
}

export const FoodItemDisplay = ({ product }: FoodItemDisplayProps) => {
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
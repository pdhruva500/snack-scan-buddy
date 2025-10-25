interface FoodProduct {
  code: string;
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
  status: number;
}

export async function fetchFoodProduct(barcode: string): Promise<FoodProduct | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await response.json();
    
    if (data.status === 1) {
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching food product:", error);
    return null;
  }
}
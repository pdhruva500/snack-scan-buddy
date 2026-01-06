export const normalizeProductName = (productName?: string, brands?: string) => {
  if (!productName && !brands) return "";
  const combined = `${productName || ""} ${brands || ""}`.toLowerCase();

  // Popular cafeteria mappings (add more over time)
  if (combined.includes("fairlife")) return "Fairlife";

  // fallback: return original product name (prefer shorter if available)
  return productName || brands || "";
};

export default normalizeProductName;

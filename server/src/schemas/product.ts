import { z } from "zod";

export const MAX_PRICE = 1_000_000;
export const MAX_QUANTITY = 1_000_000;

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().positive("Price must be positive").max(MAX_PRICE, "Price exceeds maximum allowed value"),
  quantity: z.number().int().min(0, "Quantity must be non-negative").max(MAX_QUANTITY, "Quantity exceeds maximum allowed value"),
});

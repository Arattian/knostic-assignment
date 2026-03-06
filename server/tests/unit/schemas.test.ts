import { describe, it, expect } from "vitest";
import { productSchema } from "../../src/schemas/product";

describe("productSchema", () => {
  it("accepts valid product data", () => {
    const result = productSchema.safeParse({
      name: "Widget",
      category: "Gadgets",
      price: 9.99,
      quantity: 50,
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      name: "Widget",
      category: "Gadgets",
      price: 9.99,
      quantity: 50,
    });
  });

  it("accepts zero quantity", () => {
    const result = productSchema.safeParse({
      name: "Widget",
      category: "Gadgets",
      price: 1,
      quantity: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = productSchema.safeParse({
      name: "",
      category: "Gadgets",
      price: 9.99,
      quantity: 50,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Name is required");
  });

  it("rejects empty category", () => {
    const result = productSchema.safeParse({
      name: "Widget",
      category: "",
      price: 9.99,
      quantity: 50,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Category is required");
  });

  it("rejects zero price", () => {
    const result = productSchema.safeParse({
      name: "Widget",
      category: "Gadgets",
      price: 0,
      quantity: 50,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Price must be positive");
  });

  it("rejects negative price", () => {
    const result = productSchema.safeParse({
      name: "Widget",
      category: "Gadgets",
      price: -10,
      quantity: 50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = productSchema.safeParse({
      name: "Widget",
      category: "Gadgets",
      price: 9.99,
      quantity: -1,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Quantity must be non-negative");
  });

  it("rejects non-integer quantity", () => {
    const result = productSchema.safeParse({
      name: "Widget",
      category: "Gadgets",
      price: 9.99,
      quantity: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = productSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(4);
  });

  it("rejects wrong types", () => {
    const result = productSchema.safeParse({
      name: 123,
      category: true,
      price: "ten",
      quantity: "five",
    });
    expect(result.success).toBe(false);
  });

  it("strips unknown fields", () => {
    const result = productSchema.safeParse({
      name: "Widget",
      category: "Gadgets",
      price: 9.99,
      quantity: 50,
      extra: "should be stripped",
    });
    expect(result.success).toBe(true);
    expect((result.data as Record<string, unknown>).extra).toBeUndefined();
  });
});

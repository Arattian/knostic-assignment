import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { prisma } from "../../src/db";
import { app } from "../../src/index";

let storeId: string;

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();

  const store = await request(app)
    .post("/api/stores")
    .send({ name: "Product Test Store", address: "789 Test Ave" });
  storeId = store.body.id;
});

describe("Product CRUD", () => {
  it("POST /api/stores/:id/products creates a product", async () => {
    const res = await request(app)
      .post(`/api/stores/${storeId}/products`)
      .send({ name: "Widget", category: "Gadgets", price: 9.99, quantity: 50 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Widget");
    expect(res.body.storeId).toBe(storeId);
  });

  it("POST /api/stores/:id/products validates input", async () => {
    const res = await request(app)
      .post(`/api/stores/${storeId}/products`)
      .send({ name: "", category: "Gadgets", price: -5, quantity: 50 });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThanOrEqual(2);
  });

  it("GET /api/products/:id returns a product with its store", async () => {
    const created = await request(app)
      .post(`/api/stores/${storeId}/products`)
      .send({ name: "Widget", category: "Gadgets", price: 9.99, quantity: 50 });

    const res = await request(app).get(`/api/products/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Widget");
    expect(res.body.store).toBeDefined();
    expect(res.body.store.id).toBe(storeId);
  });

  it("GET /api/products/:id returns 404 for non-existent product", async () => {
    const res = await request(app).get(
      "/api/products/00000000-0000-0000-0000-000000000000"
    );
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Product not found");
  });

  it("PUT /api/products/:id updates a product", async () => {
    const created = await request(app)
      .post(`/api/stores/${storeId}/products`)
      .send({ name: "Old Widget", category: "Gadgets", price: 9.99, quantity: 50 });

    const res = await request(app)
      .put(`/api/products/${created.body.id}`)
      .send({ name: "New Widget", category: "Gadgets", price: 19.99, quantity: 25 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Widget");
    expect(Number(res.body.price)).toBeCloseTo(19.99);
    expect(res.body.quantity).toBe(25);
  });

  it("PUT /api/products/:id returns 404 for non-existent product", async () => {
    const res = await request(app)
      .put("/api/products/00000000-0000-0000-0000-000000000000")
      .send({ name: "X", category: "Y", price: 1, quantity: 1 });
    expect(res.status).toBe(404);
  });

  it("PUT /api/products/:id validates input", async () => {
    const created = await request(app)
      .post(`/api/stores/${storeId}/products`)
      .send({ name: "Widget", category: "Gadgets", price: 9.99, quantity: 50 });

    const res = await request(app)
      .put(`/api/products/${created.body.id}`)
      .send({ name: "", category: "", price: 0, quantity: -1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("DELETE /api/products/:id deletes a product", async () => {
    const created = await request(app)
      .post(`/api/stores/${storeId}/products`)
      .send({ name: "Doomed", category: "Gadgets", price: 5.0, quantity: 1 });

    const res = await request(app).delete(`/api/products/${created.body.id}`);
    expect(res.status).toBe(204);

    const check = await request(app).get(`/api/products/${created.body.id}`);
    expect(check.status).toBe(404);
  });

  it("DELETE /api/products/:id returns 404 for non-existent product", async () => {
    const res = await request(app).delete(
      "/api/products/00000000-0000-0000-0000-000000000000"
    );
    expect(res.status).toBe(404);
  });
});

describe("Product filtering & pagination", () => {
  beforeEach(async () => {
    const products = [
      { name: "Laptop", category: "Electronics", price: 999.99, quantity: 5 },
      { name: "Mouse", category: "Electronics", price: 29.99, quantity: 20 },
      { name: "T-Shirt", category: "Clothing", price: 19.99, quantity: 10 },
      { name: "Jacket", category: "Clothing", price: 89.99, quantity: 0 },
      { name: "Coffee", category: "Food", price: 12.99, quantity: 30 },
    ];
    for (const p of products) {
      await request(app).post(`/api/stores/${storeId}/products`).send(p);
    }
  });

  it("filters by category", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?category=Electronics`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((p: any) => p.category === "Electronics")).toBe(true);
  });

  it("filters by category — returns empty for non-existent category", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?category=NonExistent`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it("filters by price range", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?minPrice=20&maxPrice=100`
    );
    expect(res.status).toBe(200);
    for (const p of res.body.data) {
      const price = Number(p.price);
      expect(price).toBeGreaterThanOrEqual(20);
      expect(price).toBeLessThanOrEqual(100);
    }
  });

  it("filters by minPrice only", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?minPrice=100`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Laptop");
  });

  it("filters by maxPrice only", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?maxPrice=20`
    );
    expect(res.status).toBe(200);
    for (const p of res.body.data) {
      expect(Number(p.price)).toBeLessThanOrEqual(20);
    }
  });

  it("filters by inStock", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?inStock=true`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.every((p: any) => p.quantity > 0)).toBe(true);
    expect(res.body.data).toHaveLength(4);
  });

  it("combines multiple filters", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?category=Clothing&inStock=true`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("T-Shirt");
  });

  it("combines category + price range filters", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?category=Electronics&maxPrice=50`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Mouse");
  });

  it("paginates results", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?page=1&limit=2`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.totalPages).toBe(3);
  });

  it("paginates — second page", async () => {
    const page1 = await request(app).get(
      `/api/stores/${storeId}/products?page=1&limit=2`
    );
    const page2 = await request(app).get(
      `/api/stores/${storeId}/products?page=2&limit=2`
    );
    expect(page2.body.data).toHaveLength(2);
    expect(page2.body.pagination.page).toBe(2);

    const page1Ids = page1.body.data.map((p: any) => p.id);
    const page2Ids = page2.body.data.map((p: any) => p.id);
    expect(page1Ids).not.toEqual(page2Ids);
  });

  it("paginates — last page has remaining items", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?page=3&limit=2`
    );
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.page).toBe(3);
  });

  it("paginates — page beyond range returns empty data", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?page=100&limit=2`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(5);
  });

  it("paginates — defaults to page 1, limit 20", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products`
    );
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(20);
    expect(res.body.data).toHaveLength(5);
  });

  it("paginates — clamps limit to max 100", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?limit=500`
    );
    expect(res.body.pagination.limit).toBe(100);
  });

  it("paginates — limit=0 falls back to default 20", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?limit=0`
    );
    // parseInt("0") || 20 = 20, since 0 is falsy
    expect(res.body.pagination.limit).toBe(20);
  });

  it("paginates — clamps negative limit to min 1", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?limit=-5`
    );
    expect(res.body.pagination.limit).toBe(1);
  });

  it("paginates — clamps page to min 1", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?page=-1`
    );
    expect(res.body.pagination.page).toBe(1);
  });

  it("sorts by price ascending", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?sortBy=price&order=asc`
    );
    expect(res.status).toBe(200);
    const prices = res.body.data.map((p: any) => Number(p.price));
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it("sorts by price descending", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?sortBy=price&order=desc`
    );
    expect(res.status).toBe(200);
    const prices = res.body.data.map((p: any) => Number(p.price));
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  it("sorts by name ascending", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?sortBy=name&order=asc`
    );
    expect(res.status).toBe(200);
    const names = res.body.data.map((p: any) => p.name);
    for (let i = 1; i < names.length; i++) {
      expect(names[i].localeCompare(names[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });

  it("sorts by quantity descending", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?sortBy=quantity&order=desc`
    );
    expect(res.status).toBe(200);
    const quantities = res.body.data.map((p: any) => p.quantity);
    for (let i = 1; i < quantities.length; i++) {
      expect(quantities[i]).toBeLessThanOrEqual(quantities[i - 1]);
    }
  });

  it("falls back to createdAt for invalid sortBy field", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?sortBy=invalid`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
  });

  it("defaults order to desc when not specified", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?sortBy=price`
    );
    const prices = res.body.data.map((p: any) => Number(p.price));
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  it("returns correct pagination with filters applied", async () => {
    const res = await request(app).get(
      `/api/stores/${storeId}/products?category=Electronics&page=1&limit=1`
    );
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.pagination.totalPages).toBe(2);
  });

  it("returns only products for the requested store", async () => {
    const otherStore = await request(app)
      .post("/api/stores")
      .send({ name: "Other Store", address: "Other Addr" });

    await request(app)
      .post(`/api/stores/${otherStore.body.id}/products`)
      .send({ name: "Other Product", category: "Other", price: 1, quantity: 1 });

    const res = await request(app).get(
      `/api/stores/${storeId}/products`
    );
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.data.every((p: any) => p.storeId === storeId)).toBe(true);
  });
});

describe("GET /api/products — global product listing", () => {
  let otherStoreId: string;

  beforeEach(async () => {
    const products = [
      { name: "Laptop", category: "Electronics", price: 999.99, quantity: 5 },
      { name: "Mouse", category: "Electronics", price: 29.99, quantity: 20 },
      { name: "T-Shirt", category: "Clothing", price: 19.99, quantity: 10 },
    ];
    for (const p of products) {
      await request(app).post(`/api/stores/${storeId}/products`).send(p);
    }

    const otherStore = await request(app)
      .post("/api/stores")
      .send({ name: "Other Store", address: "456 Other St" });
    otherStoreId = otherStore.body.id;

    await request(app)
      .post(`/api/stores/${otherStoreId}/products`)
      .send({ name: "Jacket", category: "Clothing", price: 89.99, quantity: 3 });
  });

  it("returns products from all stores", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(4);
    const storeIds = new Set(res.body.data.map((p: any) => p.storeId));
    expect(storeIds.size).toBe(2);
  });

  it("includes store info on each product", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    for (const p of res.body.data) {
      expect(p.store).toBeDefined();
      expect(p.store.name).toBeDefined();
    }
  });

  it("filters by storeId", async () => {
    const res = await request(app).get(`/api/products?storeId=${otherStoreId}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Jacket");
  });

  it("filters by category across stores", async () => {
    const res = await request(app).get("/api/products?category=Clothing");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.data.every((p: any) => p.category === "Clothing")).toBe(true);
  });

  it("supports pagination", async () => {
    const res = await request(app).get("/api/products?page=1&limit=2");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(4);
    expect(res.body.pagination.totalPages).toBe(2);
  });

  it("supports sorting", async () => {
    const res = await request(app).get("/api/products?sortBy=price&order=asc");
    expect(res.status).toBe(200);
    const prices = res.body.data.map((p: any) => Number(p.price));
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { prisma } from "../../src/db";
import { app } from "../../src/index";

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
});

describe("Store CRUD", () => {
  it("GET /api/stores returns empty list", async () => {
    const res = await request(app).get("/api/stores");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("POST /api/stores creates a store", async () => {
    const res = await request(app)
      .post("/api/stores")
      .send({ name: "Test Store", address: "123 Test St" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test Store");
    expect(res.body.address).toBe("123 Test St");
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });

  it("POST /api/stores validates input — missing address", async () => {
    const res = await request(app).post("/api/stores").send({ name: "No Address" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details).toBeDefined();
  });

  it("POST /api/stores validates input — empty name", async () => {
    const res = await request(app)
      .post("/api/stores")
      .send({ name: "", address: "123 St" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("POST /api/stores validates input — empty body", async () => {
    const res = await request(app).post("/api/stores").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("GET /api/stores returns stores ordered by createdAt desc", async () => {
    await request(app)
      .post("/api/stores")
      .send({ name: "First", address: "1st St" });
    await request(app)
      .post("/api/stores")
      .send({ name: "Second", address: "2nd St" });

    const res = await request(app).get("/api/stores");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe("Second");
    expect(res.body[1].name).toBe("First");
  });

  it("GET /api/stores includes product count", async () => {
    const store = await request(app)
      .post("/api/stores")
      .send({ name: "Store", address: "Addr" });

    await request(app)
      .post(`/api/stores/${store.body.id}/products`)
      .send({ name: "P1", category: "Cat", price: 10, quantity: 1 });
    await request(app)
      .post(`/api/stores/${store.body.id}/products`)
      .send({ name: "P2", category: "Cat", price: 20, quantity: 2 });

    const res = await request(app).get("/api/stores");
    expect(res.body[0]._count.products).toBe(2);
  });

  it("GET /api/stores/:id returns a store with product count", async () => {
    const created = await request(app)
      .post("/api/stores")
      .send({ name: "Test Store", address: "123 Test St" });

    const res = await request(app).get(`/api/stores/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Test Store");
    expect(res.body._count.products).toBe(0);
  });

  it("GET /api/stores/:id returns 404 for non-existent store", async () => {
    const res = await request(app).get(
      "/api/stores/00000000-0000-0000-0000-000000000000"
    );
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Store not found");
  });

  it("PUT /api/stores/:id updates a store", async () => {
    const created = await request(app)
      .post("/api/stores")
      .send({ name: "Old Name", address: "Old Address" });

    const res = await request(app)
      .put(`/api/stores/${created.body.id}`)
      .send({ name: "New Name", address: "New Address" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Name");
    expect(res.body.address).toBe("New Address");
  });

  it("PUT /api/stores/:id returns 404 for non-existent store", async () => {
    const res = await request(app)
      .put("/api/stores/00000000-0000-0000-0000-000000000000")
      .send({ name: "X", address: "Y" });
    expect(res.status).toBe(404);
  });

  it("PUT /api/stores/:id validates input", async () => {
    const created = await request(app)
      .post("/api/stores")
      .send({ name: "Store", address: "Addr" });

    const res = await request(app)
      .put(`/api/stores/${created.body.id}`)
      .send({ name: "", address: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("DELETE /api/stores/:id deletes a store", async () => {
    const created = await request(app)
      .post("/api/stores")
      .send({ name: "To Delete", address: "Somewhere" });

    const res = await request(app).delete(`/api/stores/${created.body.id}`);
    expect(res.status).toBe(204);

    const check = await request(app).get(`/api/stores/${created.body.id}`);
    expect(check.status).toBe(404);
  });

  it("DELETE /api/stores/:id returns 404 for non-existent store", async () => {
    const res = await request(app).delete(
      "/api/stores/00000000-0000-0000-0000-000000000000"
    );
    expect(res.status).toBe(404);
  });

  it("DELETE /api/stores/:id cascades to products", async () => {
    const store = await request(app)
      .post("/api/stores")
      .send({ name: "Store", address: "Addr" });

    const product = await request(app)
      .post(`/api/stores/${store.body.id}/products`)
      .send({ name: "Widget", category: "Cat", price: 10, quantity: 5 });

    await request(app).delete(`/api/stores/${store.body.id}`);

    const check = await request(app).get(`/api/products/${product.body.id}`);
    expect(check.status).toBe(404);
  });
});

describe("Inventory aggregation", () => {
  it("GET /api/stores/:id/inventory returns category breakdown", async () => {
    const store = await request(app)
      .post("/api/stores")
      .send({ name: "Inv Store", address: "456 Inv St" });

    await request(app)
      .post(`/api/stores/${store.body.id}/products`)
      .send({ name: "Laptop", category: "Electronics", price: 999.99, quantity: 5 });

    await request(app)
      .post(`/api/stores/${store.body.id}/products`)
      .send({ name: "Mouse", category: "Electronics", price: 29.99, quantity: 20 });

    await request(app)
      .post(`/api/stores/${store.body.id}/products`)
      .send({ name: "T-Shirt", category: "Clothing", price: 19.99, quantity: 10 });

    const res = await request(app).get(
      `/api/stores/${store.body.id}/inventory`
    );
    expect(res.status).toBe(200);
    expect(res.body.storeId).toBe(store.body.id);
    expect(res.body.storeName).toBe("Inv Store");
    expect(res.body.totalProducts).toBe(3);
    expect(res.body.totalItems).toBe(35);
    expect(res.body.totalValue).toBeCloseTo(5799.65, 1);
    expect(res.body.byCategory).toHaveLength(2);

    const electronics = res.body.byCategory.find(
      (c: any) => c.category === "Electronics"
    );
    expect(electronics.productCount).toBe(2);
    expect(electronics.itemCount).toBe(25);
    expect(electronics.totalValue).toBeCloseTo(5599.75, 1);

    const clothing = res.body.byCategory.find(
      (c: any) => c.category === "Clothing"
    );
    expect(clothing.productCount).toBe(1);
    expect(clothing.itemCount).toBe(10);
    expect(clothing.totalValue).toBeCloseTo(199.9, 1);
  });

  it("GET /api/stores/:id/inventory returns zeros for empty store", async () => {
    const store = await request(app)
      .post("/api/stores")
      .send({ name: "Empty Store", address: "Nowhere" });

    const res = await request(app).get(
      `/api/stores/${store.body.id}/inventory`
    );
    expect(res.status).toBe(200);
    expect(res.body.totalProducts).toBe(0);
    expect(res.body.totalItems).toBe(0);
    expect(res.body.totalValue).toBe(0);
    expect(res.body.byCategory).toEqual([]);
  });

  it("GET /api/stores/:id/inventory returns 404 for missing store", async () => {
    const res = await request(app).get(
      "/api/stores/00000000-0000-0000-0000-000000000000/inventory"
    );
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Store not found");
  });

  it("GET /api/stores/:id/inventory handles zero-quantity products", async () => {
    const store = await request(app)
      .post("/api/stores")
      .send({ name: "Stock Store", address: "Addr" });

    await request(app)
      .post(`/api/stores/${store.body.id}/products`)
      .send({ name: "In Stock", category: "Cat", price: 50, quantity: 10 });
    await request(app)
      .post(`/api/stores/${store.body.id}/products`)
      .send({ name: "Out of Stock", category: "Cat", price: 100, quantity: 0 });

    const res = await request(app).get(
      `/api/stores/${store.body.id}/inventory`
    );
    expect(res.body.totalProducts).toBe(2);
    expect(res.body.totalItems).toBe(10);
    expect(res.body.totalValue).toBe(500);
  });
});

describe("Store products", () => {
  it("POST /api/stores/:id/products creates a product in a store", async () => {
    const store = await request(app)
      .post("/api/stores")
      .send({ name: "Store", address: "Addr" });

    const res = await request(app)
      .post(`/api/stores/${store.body.id}/products`)
      .send({ name: "Widget", category: "Gadgets", price: 9.99, quantity: 50 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Widget");
    expect(res.body.storeId).toBe(store.body.id);
  });

  it("POST /api/stores/:id/products returns 404 for non-existent store", async () => {
    const res = await request(app)
      .post("/api/stores/00000000-0000-0000-0000-000000000000/products")
      .send({ name: "Widget", category: "Gadgets", price: 9.99, quantity: 50 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Store not found");
  });

  it("POST /api/stores/:id/products validates input", async () => {
    const store = await request(app)
      .post("/api/stores")
      .send({ name: "Store", address: "Addr" });

    const res = await request(app)
      .post(`/api/stores/${store.body.id}/products`)
      .send({ name: "", category: "Gadgets", price: -5, quantity: 50 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("POST /api/stores/:id/products rejects negative quantity", async () => {
    const store = await request(app)
      .post("/api/stores")
      .send({ name: "Store", address: "Addr" });

    const res = await request(app)
      .post(`/api/stores/${store.body.id}/products`)
      .send({ name: "Widget", category: "Gadgets", price: 9.99, quantity: -1 });
    expect(res.status).toBe(400);
  });

  it("POST /api/stores/:id/products rejects non-integer quantity", async () => {
    const store = await request(app)
      .post("/api/stores")
      .send({ name: "Store", address: "Addr" });

    const res = await request(app)
      .post(`/api/stores/${store.body.id}/products`)
      .send({ name: "Widget", category: "Gadgets", price: 9.99, quantity: 1.5 });
    expect(res.status).toBe(400);
  });

  it("GET /api/stores/:id/products returns 404 for non-existent store", async () => {
    const res = await request(app).get(
      "/api/stores/00000000-0000-0000-0000-000000000000/products"
    );
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Store not found");
  });
});

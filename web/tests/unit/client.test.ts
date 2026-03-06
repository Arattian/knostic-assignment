import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
  getInventory,
  getAllProducts,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../src/api/client";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: true,
    status,
    json: () => Promise.resolve(data),
  });
}

function errorResponse(error: string, status = 400) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("API client — stores", () => {
  it("getStores fetches GET /api/stores", async () => {
    const stores = [{ id: "1", name: "Store" }];
    mockFetch.mockReturnValue(jsonResponse(stores));

    const result = await getStores();
    expect(result).toEqual(stores);
    expect(mockFetch).toHaveBeenCalledWith("/api/stores", {
      headers: { "Content-Type": "application/json" },
    });
  });

  it("getStore fetches GET /api/stores/:id", async () => {
    const store = { id: "1", name: "Store" };
    mockFetch.mockReturnValue(jsonResponse(store));

    const result = await getStore("1");
    expect(result).toEqual(store);
    expect(mockFetch).toHaveBeenCalledWith("/api/stores/1", {
      headers: { "Content-Type": "application/json" },
    });
  });

  it("createStore sends POST with body", async () => {
    const store = { id: "1", name: "New", address: "Addr" };
    mockFetch.mockReturnValue(jsonResponse(store, 201));

    const result = await createStore({ name: "New", address: "Addr" });
    expect(result).toEqual(store);
    expect(mockFetch).toHaveBeenCalledWith("/api/stores", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ name: "New", address: "Addr" }),
    });
  });

  it("updateStore sends PUT with body", async () => {
    const store = { id: "1", name: "Updated", address: "New Addr" };
    mockFetch.mockReturnValue(jsonResponse(store));

    await updateStore("1", { name: "Updated", address: "New Addr" });
    expect(mockFetch).toHaveBeenCalledWith("/api/stores/1", {
      headers: { "Content-Type": "application/json" },
      method: "PUT",
      body: JSON.stringify({ name: "Updated", address: "New Addr" }),
    });
  });

  it("deleteStore sends DELETE and handles 204", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve({}) })
    );

    const result = await deleteStore("1");
    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith("/api/stores/1", {
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    });
  });

  it("getInventory fetches GET /api/stores/:id/inventory", async () => {
    const inv = { storeId: "1", totalValue: 100 };
    mockFetch.mockReturnValue(jsonResponse(inv));

    const result = await getInventory("1");
    expect(result).toEqual(inv);
    expect(mockFetch).toHaveBeenCalledWith("/api/stores/1/inventory", {
      headers: { "Content-Type": "application/json" },
    });
  });
});

describe("API client — products", () => {
  it("getAllProducts fetches GET /api/products with query params", async () => {
    const data = { data: [], pagination: {} };
    mockFetch.mockReturnValue(jsonResponse(data));

    await getAllProducts({ category: "Electronics", page: "1" });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/products?");
    expect(url).toContain("category=Electronics");
    expect(url).toContain("page=1");
  });

  it("getAllProducts works without params", async () => {
    mockFetch.mockReturnValue(jsonResponse({ data: [], pagination: {} }));

    await getAllProducts();
    expect(mockFetch).toHaveBeenCalledWith("/api/products", {
      headers: { "Content-Type": "application/json" },
    });
  });

  it("getProducts fetches store-scoped products with params", async () => {
    mockFetch.mockReturnValue(jsonResponse({ data: [], pagination: {} }));

    await getProducts("s1", { page: "2", limit: "10" });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/stores/s1/products?");
    expect(url).toContain("page=2");
  });

  it("createProduct sends POST to store endpoint", async () => {
    const product = { id: "p1", name: "Widget" };
    mockFetch.mockReturnValue(jsonResponse(product, 201));

    await createProduct("s1", { name: "Widget", category: "Cat", price: 10, quantity: 5 });
    expect(mockFetch).toHaveBeenCalledWith("/api/stores/s1/products", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ name: "Widget", category: "Cat", price: 10, quantity: 5 }),
    });
  });

  it("updateProduct sends PUT to product endpoint", async () => {
    mockFetch.mockReturnValue(jsonResponse({ id: "p1" }));

    await updateProduct("p1", { name: "New", category: "Cat", price: 20, quantity: 3 });
    expect(mockFetch).toHaveBeenCalledWith("/api/products/p1", {
      headers: { "Content-Type": "application/json" },
      method: "PUT",
      body: JSON.stringify({ name: "New", category: "Cat", price: 20, quantity: 3 }),
    });
  });

  it("deleteProduct sends DELETE", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve({}) })
    );

    await deleteProduct("p1");
    expect(mockFetch).toHaveBeenCalledWith("/api/products/p1", {
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    });
  });
});

describe("API client — error handling", () => {
  it("throws with server error message", async () => {
    mockFetch.mockReturnValue(errorResponse("Store not found", 404));

    await expect(getStore("bad")).rejects.toThrow("Store not found");
  });

  it("throws generic message when response has no error field", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      })
    );

    await expect(getStores()).rejects.toThrow("Request failed: 500");
  });

  it("throws generic message when response body is not JSON", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error("not json")),
      })
    );

    await expect(getStores()).rejects.toThrow("Request failed: 502");
  });
});

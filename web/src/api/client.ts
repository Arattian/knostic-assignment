import type {
  Store,
  Product,
  PaginatedProducts,
  InventorySummary,
  StoreFormData,
  ProductFormData,
} from "../types";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const getStores = () => request<Store[]>("/stores");

export const getStore = (id: string) => request<Store>(`/stores/${id}`);

export const createStore = (data: StoreFormData) =>
  request<Store>("/stores", { method: "POST", body: JSON.stringify(data) });

export const updateStore = (id: string, data: StoreFormData) =>
  request<Store>(`/stores/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteStore = (id: string) =>
  request<void>(`/stores/${id}`, { method: "DELETE" });

export const getInventory = (id: string) =>
  request<InventorySummary>(`/stores/${id}/inventory`);

export const getAllProducts = (params?: Record<string, string>) => {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<PaginatedProducts>(`/products${query}`);
};

export const getProducts = (storeId: string, params?: Record<string, string>) => {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<PaginatedProducts>(`/stores/${storeId}/products${query}`);
};

export const createProduct = (storeId: string, data: ProductFormData) =>
  request<Product>(`/stores/${storeId}/products`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateProduct = (id: string, data: ProductFormData) =>
  request<Product>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteProduct = (id: string) =>
  request<void>(`/products/${id}`, { method: "DELETE" });

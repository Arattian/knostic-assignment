export const MAX_PRICE = 1_000_000;
export const MAX_QUANTITY = 1_000_000;

export interface Store {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  quantity: number;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProducts {
  data: Product[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CategoryBreakdown {
  category: string;
  productCount: number;
  totalValue: number;
  itemCount: number;
}

export interface InventorySummary {
  storeId: string;
  storeName: string;
  totalValue: number;
  totalProducts: number;
  totalItems: number;
  byCategory: CategoryBreakdown[];
}

export interface StoreFormData {
  name: string;
  address: string;
}

export interface ProductFormData {
  name: string;
  category: string;
  price: number;
  quantity: number;
}

export interface Filters {
  category: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sortBy: string;
  order: string;
  page: number;
}

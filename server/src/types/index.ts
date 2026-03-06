export interface IdParams {
  id: string;
  [key: string]: string;
}

export interface CategoryBreakdown {
  productCount: number;
  totalValue: number;
  itemCount: number;
}

export interface InventoryResponse {
  storeId: string;
  storeName: string;
  totalValue: number;
  totalProducts: number;
  totalItems: number;
  byCategory: (CategoryBreakdown & { category: string })[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

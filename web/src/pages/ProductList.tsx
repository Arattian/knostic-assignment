import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Product, PaginatedProducts, Store, Filters } from "../types";
import { getAllProducts, getStores, updateProduct, deleteProduct } from "../api/client";
import type { ProductFormData } from "../types";
import ProductForm from "../components/ProductForm";
import styles from "./ProductList.module.css";

const defaultFilters: Filters = {
  category: "",
  minPrice: "",
  maxPrice: "",
  inStock: false,
  sortBy: "createdAt",
  order: "desc",
  page: 1,
};

function buildParams(
  filters: Filters,
  storeId: string
): Record<string, string> {
  const params: Record<string, string> = {
    page: String(filters.page),
    limit: "20",
    sortBy: filters.sortBy,
    order: filters.order,
  };
  if (storeId) params.storeId = storeId;
  if (filters.category) params.category = filters.category;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.inStock) params.inStock = "true";
  return params;
}

export default function ProductList() {
  const [products, setProducts] = useState<PaginatedProducts | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [storeFilter, setStoreFilter] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setError("");
      const data = await getAllProducts(buildParams(filters, storeFilter));
      setProducts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    }
  }, [filters, storeFilter]);

  useEffect(() => {
    getStores()
      .then(setStores)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      await loadProducts();
      if (!cancelled) setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [loadProducts]);

  const handleUpdateProduct = async (data: ProductFormData) => {
    if (!editingProduct) return;
    await updateProduct(editingProduct.id, data);
    setEditingProduct(null);
    loadProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(productId);
      loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  const categories = products
    ? [...new Set(products.data.map((p) => p.category))].sort()
    : [];

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1>All Products</h1>
          <p className={styles.headerSub}>
            Browse products across all stores
          </p>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {/* Filters */}
      <div className={styles.filtersPanel}>
        <div className={styles.filters}>
          <div>
            <label>Store</label>
            <select
              value={storeFilter}
              onChange={(e) => {
                setStoreFilter(e.target.value);
                setFilters({ ...filters, page: 1 });
              }}
            >
              <option value="">All Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value, page: 1 })
              }
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Min Price</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) =>
                setFilters({ ...filters, minPrice: e.target.value, page: 1 })
              }
              style={{ width: 90 }}
            />
          </div>
          <div>
            <label>Max Price</label>
            <input
              type="number"
              placeholder="Any"
              value={filters.maxPrice}
              onChange={(e) =>
                setFilters({ ...filters, maxPrice: e.target.value, page: 1 })
              }
              style={{ width: 90 }}
            />
          </div>
          <div>
            <label>In Stock</label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    inStock: e.target.checked,
                    page: 1,
                  })
                }
              />
              Only in stock
            </label>
          </div>
          <div>
            <label>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters({ ...filters, sortBy: e.target.value })
              }
            >
              <option value="createdAt">Date</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="quantity">Quantity</option>
            </select>
          </div>
          <div>
            <label>Order</label>
            <select
              value={filters.order}
              onChange={(e) =>
                setFilters({ ...filters, order: e.target.value })
              }
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      </div>

      {editingProduct && (
        <div style={{ marginBottom: 20 }}>
          <ProductForm
            initial={{
              name: editingProduct.name,
              category: editingProduct.category,
              price: Number(editingProduct.price),
              quantity: editingProduct.quantity,
            }}
            onSubmit={handleUpdateProduct}
            onCancel={() => setEditingProduct(null)}
          />
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
        </div>
      ) : products && products.data.length > 0 ? (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Store</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.data.map((p: Product & { store?: { id: string; name: string } }) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.category}</td>
                  <td>
                    {p.store ? (
                      <Link to={`/stores/${p.store.id}`} className={styles.storeLink}>
                        {p.store.name}
                      </Link>
                    ) : (
                      <span className="text-secondary">—</span>
                    )}
                  </td>
                  <td>${Number(p.price).toFixed(2)}</td>
                  <td>
                    <span
                      className={
                        p.quantity > 0 ? "text-success" : "text-secondary"
                      }
                    >
                      {p.quantity}
                    </span>
                  </td>
                  <td>
                    <div className={styles.productActions}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingProduct(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteProduct(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={filters.page <= 1}
              onClick={() =>
                setFilters({ ...filters, page: filters.page - 1 })
              }
            >
              &larr; Previous
            </button>
            <span className={styles.paginationInfo}>
              Page {products.pagination.page} of{" "}
              {products.pagination.totalPages}
              {" "}({products.pagination.total} products)
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={filters.page >= products.pagination.totalPages}
              onClick={() =>
                setFilters({ ...filters, page: filters.page + 1 })
              }
            >
              Next &rarr;
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No products found.</p>
        </div>
      )}
    </div>
  );
}

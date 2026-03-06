import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import type {
  Store,
  Product,
  InventorySummary,
  PaginatedProducts,
  StoreFormData,
  ProductFormData,
  Filters,
} from "../types";
import {
  getStore,
  getInventory,
  getProducts,
  updateStore,
  deleteStore,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/client";
import StoreForm from "../components/StoreForm";
import ProductForm from "../components/ProductForm";
import styles from "./StoreDetail.module.css";

const defaultFilters: Filters = {
  category: "",
  minPrice: "",
  maxPrice: "",
  inStock: false,
  sortBy: "createdAt",
  order: "desc",
  page: 1,
};

function buildProductParams(filters: Filters): Record<string, string> {
  const params: Record<string, string> = {
    page: String(filters.page),
    limit: "10",
    sortBy: filters.sortBy,
    order: filters.order,
  };
  if (filters.category) params.category = filters.category;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.inStock) params.inStock = "true";
  return params;
}

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [store, setStore] = useState<Store | null>(null);
  const [inventory, setInventory] = useState<InventorySummary | null>(null);
  const [products, setProducts] = useState<PaginatedProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const loadStore = useCallback(async () => {
    if (!id) return;
    try {
      const [s, inv] = await Promise.all([getStore(id), getInventory(id)]);
      setStore(s);
      setInventory(inv);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load store");
    }
  }, [id]);

  const loadProducts = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getProducts(id, buildProductParams(filters));
      setProducts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    }
  }, [id, filters]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      await loadStore();
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [loadStore]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = id ? await getProducts(id, buildProductParams(filters)).catch(() => null) : null;
      if (!cancelled && data) setProducts(data);
    };
    load();
    return () => { cancelled = true; };
  }, [id, filters]);

  const handleUpdateStore = async (data: StoreFormData) => {
    if (!id) return;
    await updateStore(id, data);
    setEditing(false);
    loadStore();
  };

  const handleDeleteStore = async () => {
    if (!id || !confirm("Delete this store and all its products?")) return;
    await deleteStore(id);
    navigate("/");
  };

  const handleCreateProduct = async (data: ProductFormData) => {
    if (!id) return;
    await createProduct(id, data);
    setShowProductForm(false);
    loadProducts();
    loadStore();
  };

  const handleUpdateProduct = async (data: ProductFormData) => {
    if (!editingProduct) return;
    await updateProduct(editingProduct.id, data);
    setEditingProduct(null);
    loadProducts();
    loadStore();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(productId);
      loadProducts();
      loadStore();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  const categories = inventory?.byCategory.map((c) => c.category) ?? [];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!store) {
    return (
      <div>
        <Link to="/" className="btn btn-secondary">
          Back
        </Link>
        <p style={{ marginTop: 16 }}>Store not found.</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className={`btn btn-secondary ${styles.backLink}`}>
        &larr; Back to Stores
      </Link>

      {error && <div className="error-banner">{error}</div>}

      {/* Store header */}
      {editing ? (
        <div className={styles.editWrap}>
          <StoreForm
            initial={{ name: store.name, address: store.address }}
            onSubmit={handleUpdateStore}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <div className={styles.storeHeader}>
          <div>
            <h1>{store.name}</h1>
            <p className={styles.storeAddress}>{store.address}</p>
          </div>
          <div className={styles.actions}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDeleteStore}>
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Inventory summary */}
      {inventory && (
        <div className={styles.inventoryPanel}>
          <h2>Inventory Summary</h2>
          <div className={styles.summaryGrid}>
            <div className={`${styles.summaryItem} ${styles.summaryItemValue}`}>
              <span className={styles.summaryValue}>
                ${inventory.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className={styles.summaryLabel}>Total Value</span>
            </div>
            <div className={`${styles.summaryItem} ${styles.summaryItemProducts}`}>
              <span className={styles.summaryValue}>{inventory.totalProducts}</span>
              <span className={styles.summaryLabel}>Products</span>
            </div>
            <div className={`${styles.summaryItem} ${styles.summaryItemStock}`}>
              <span className={styles.summaryValue}>{inventory.totalItems}</span>
              <span className={styles.summaryLabel}>Total Items</span>
            </div>
          </div>
          {inventory.byCategory.length > 0 && (
            <table className={styles.categoryTable}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Products</th>
                  <th>Items</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {inventory.byCategory.map((cat) => (
                  <tr key={cat.category}>
                    <td>{cat.category}</td>
                    <td>{cat.productCount}</td>
                    <td>{cat.itemCount}</td>
                    <td>${cat.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Products section */}
      <div className={styles.productsSection}>
        <div className={styles.productsSectionHeader}>
          <h2>Products</h2>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setShowProductForm(!showProductForm);
              setEditingProduct(null);
            }}
          >
            {showProductForm ? "Cancel" : "+ Add Product"}
          </button>
        </div>

        {(showProductForm || editingProduct) && (
          <div style={{ marginBottom: 20 }}>
            <ProductForm
              initial={
                editingProduct
                  ? {
                      name: editingProduct.name,
                      category: editingProduct.category,
                      price: Number(editingProduct.price),
                      quantity: editingProduct.quantity,
                    }
                  : undefined
              }
              onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
              onCancel={() => {
                setShowProductForm(false);
                setEditingProduct(null);
              }}
            />
          </div>
        )}

        {/* Filters */}
        <div className={styles.filters}>
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
                  setFilters({ ...filters, inStock: e.target.checked, page: 1 })
                }
              />
              Only in stock
            </label>
          </div>
          <div>
            <label>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
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
              onChange={(e) => setFilters({ ...filters, order: e.target.value })}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        {/* Product table */}
        {products && products.data.length > 0 ? (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.data.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td>{p.category}</td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>
                      <span className={p.quantity > 0 ? "text-success" : "text-secondary"}>
                        {p.quantity}
                      </span>
                    </td>
                    <td>
                      <div className={styles.productActions}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setEditingProduct(p);
                            setShowProductForm(false);
                          }}
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
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                &larr; Previous
              </button>
              <span className={styles.paginationInfo}>
                Page {products.pagination.page} of {products.pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={filters.page >= products.pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                Next &rarr;
              </button>
            </div>
          </>
        ) : (
          <p className={styles.emptyProducts}>
            No products found.
          </p>
        )}
      </div>
    </div>
  );
}

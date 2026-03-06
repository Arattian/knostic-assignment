import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Store } from "../types";
import { getStores, createStore, deleteStore } from "../api/client";
import StoreForm from "../components/StoreForm";
import type { StoreFormData } from "../types";
import styles from "./StoreList.module.css";

export default function StoreList() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getStores();
      setStores(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (data: StoreFormData) => {
    await createStore(data);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this store and all its products?")) return;
    try {
      await deleteStore(id);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete store");
    }
  };

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1>Stores</h1>
          <p className={styles.headerSub}>Manage your inventory locations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Store"}
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className={styles.formWrap}>
          <StoreForm onSubmit={handleCreate} />
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
        </div>
      ) : stores.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>+</div>
          <p className={styles.emptyTitle}>No stores yet</p>
          <p className={styles.emptyText}>
            Create your first store to start tracking inventory.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {stores.map((store) => (
            <div key={store.id} className={`card ${styles.storeCard}`}>
              <Link to={`/stores/${store.id}`} className={styles.cardLink}>
                <h2 className={styles.storeName}>{store.name}</h2>
                <p className={styles.storeAddress}>{store.address}</p>
                <div className={styles.meta}>
                  <span className={styles.badge}>
                    {store._count?.products ?? 0} products
                  </span>
                </div>
              </Link>
              <div className={styles.cardFooter}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(store.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

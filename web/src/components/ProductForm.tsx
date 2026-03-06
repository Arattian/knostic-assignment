import { useState } from "react";
import { MAX_PRICE, MAX_QUANTITY } from "../types";
import type { ProductFormData } from "../types";
import styles from "./Form.module.css";

interface Props {
  initial?: ProductFormData;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel?: () => void;
}

export default function ProductForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() ?? "0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(price);
    const q = parseInt(quantity);
    if (!name.trim() || !category.trim() || isNaN(p) || p <= 0 || isNaN(q) || q < 0) {
      setError("Please fill in all fields with valid values");
      return;
    }
    if (p > MAX_PRICE) {
      setError(`Price cannot exceed $${MAX_PRICE.toLocaleString()}`);
      return;
    }
    if (q > MAX_QUANTITY) {
      setError(`Quantity cannot exceed ${MAX_QUANTITY.toLocaleString()}`);
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await onSubmit({ name: name.trim(), category: category.trim(), price: p, quantity: q });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={`card ${styles.form}`} onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}
      <div className={styles.row}>
        <div className={styles.field}>
          <label>Product Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wireless Mouse"
          />
        </div>
        <div className={styles.field}>
          <label>Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Electronics"
          />
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label>Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="MAX_PRICE"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className={styles.field}>
          <label>Quantity</label>
          <input
            type="number"
            min="0"
            max="MAX_QUANTITY"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
      <div className={styles.buttons}>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : initial ? "Update Product" : "Add Product"}
        </button>
        {onCancel && (
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

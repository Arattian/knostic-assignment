import { useState } from "react";
import type { StoreFormData } from "../types";
import styles from "./Form.module.css";

interface Props {
  initial?: StoreFormData;
  onSubmit: (data: StoreFormData) => Promise<void>;
  onCancel?: () => void;
}

export default function StoreForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      setError("Name and address are required");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await onSubmit({ name: name.trim(), address: address.trim() });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save store");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={`card ${styles.form}`} onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}
      <div className={styles.field}>
        <label>Store Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Downtown Electronics"
        />
      </div>
      <div className={styles.field}>
        <label>Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123 Main St"
        />
      </div>
      <div className={styles.buttons}>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : initial ? "Update Store" : "Create Store"}
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

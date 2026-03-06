import { Routes, Route, Link } from "react-router-dom";
import StoreList from "./pages/StoreList";
import StoreDetail from "./pages/StoreDetail";
import ProductList from "./pages/ProductList";

export default function App() {
  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="app-logo">
            <div className="app-logo-icon">TI</div>
            <span className="app-logo-text">Tiny Inventory</span>
          </Link>
          <nav className="app-nav">
            <Link to="/" className="app-nav-link">Stores</Link>
            <Link to="/products" className="app-nav-link">Products</Link>
          </nav>
          <span className="app-logo-badge">v1.0</span>
        </div>
      </header>
      <div className="app">
        <Routes>
          <Route path="/" element={<StoreList />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/stores/:id" element={<StoreDetail />} />
        </Routes>
      </div>
    </>
  );
}

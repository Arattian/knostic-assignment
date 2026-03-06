import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../../src/App";

// Mock pages so we don't need to deal with their async data fetching
vi.mock("../../src/pages/StoreList", () => ({
  default: () => <div data-testid="store-list">StoreList</div>,
}));
vi.mock("../../src/pages/StoreDetail", () => ({
  default: () => <div data-testid="store-detail">StoreDetail</div>,
}));
vi.mock("../../src/pages/ProductList", () => ({
  default: () => <div data-testid="product-list">ProductList</div>,
}));

describe("App routing", () => {
  it("renders header with logo and navigation", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText("Tiny Inventory")).toBeInTheDocument();
    expect(screen.getByText("Stores")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
  });

  it("renders StoreList on /", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId("store-list")).toBeInTheDocument();
  });

  it("renders ProductList on /products", () => {
    render(
      <MemoryRouter initialEntries={["/products"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId("product-list")).toBeInTheDocument();
  });

  it("renders StoreDetail on /stores/:id", () => {
    render(
      <MemoryRouter initialEntries={["/stores/some-id"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId("store-detail")).toBeInTheDocument();
  });
});

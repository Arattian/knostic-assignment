import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import StoreDetail from "../../src/pages/StoreDetail";
import type { Store, InventorySummary, PaginatedProducts } from "../../src/types";

const mockStore: Store = {
  id: "s1",
  name: "Best Buy",
  address: "123 Main St",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  _count: { products: 2 },
};

const mockInventory: InventorySummary = {
  storeId: "s1",
  storeName: "Best Buy",
  totalValue: 1050,
  totalProducts: 2,
  totalItems: 15,
  byCategory: [
    { category: "Electronics", productCount: 1, totalValue: 1000, itemCount: 5 },
    { category: "Accessories", productCount: 1, totalValue: 50, itemCount: 10 },
  ],
};

const mockProducts: PaginatedProducts = {
  data: [
    {
      id: "p1",
      name: "Laptop",
      category: "Electronics",
      price: "999.99",
      quantity: 5,
      storeId: "s1",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "p2",
      name: "Mouse",
      category: "Accessories",
      price: "29.99",
      quantity: 10,
      storeId: "s1",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  ],
  pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

vi.mock("../../src/api/client", () => ({
  getStore: vi.fn(),
  getInventory: vi.fn(),
  getProducts: vi.fn(),
  updateStore: vi.fn(),
  deleteStore: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

import {
  getStore,
  getInventory,
  getProducts,
  deleteStore,
  createProduct,
  deleteProduct,
} from "../../src/api/client";

const mockedGetStore = vi.mocked(getStore);
const mockedGetInventory = vi.mocked(getInventory);
const mockedGetProducts = vi.mocked(getProducts);
const mockedDeleteStore = vi.mocked(deleteStore);
const mockedCreateProduct = vi.mocked(createProduct);
const mockedDeleteProduct = vi.mocked(deleteProduct);

function renderStoreDetail() {
  return render(
    <MemoryRouter initialEntries={["/stores/s1"]}>
      <Routes>
        <Route path="/stores/:id" element={<StoreDetail />} />
        <Route path="/" element={<div data-testid="home">Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetStore.mockResolvedValue(mockStore);
  mockedGetInventory.mockResolvedValue(mockInventory);
  mockedGetProducts.mockResolvedValue(mockProducts);
});

describe("StoreDetail", () => {
  it("shows loading spinner initially", () => {
    mockedGetStore.mockReturnValue(new Promise(() => {}));
    mockedGetInventory.mockReturnValue(new Promise(() => {}));
    mockedGetProducts.mockReturnValue(new Promise(() => {}));
    renderStoreDetail();

    expect(document.querySelector(".spinner")).toBeInTheDocument();
  });

  it("renders store name and address", async () => {
    renderStoreDetail();

    expect(await screen.findByRole("heading", { name: "Best Buy" })).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
  });

  it("renders inventory summary totals", async () => {
    renderStoreDetail();

    await screen.findByText("Inventory Summary");
    expect(screen.getByText("2")).toBeInTheDocument(); // totalProducts
    expect(screen.getByText("15")).toBeInTheDocument(); // totalItems
  });

  it("renders inventory category breakdown table", async () => {
    renderStoreDetail();

    // Wait for full render by looking for the table heading
    await screen.findByText("Inventory Summary");

    // Find the category table specifically
    const tables = document.querySelectorAll("table");
    // The first table with thead containing "Category" is the inventory table
    const inventoryTable = Array.from(tables).find((t) =>
      t.querySelector("th")?.textContent === "Category"
    );
    expect(inventoryTable).toBeDefined();

    const tableEl = inventoryTable!;
    const rows = tableEl.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(2);
    expect(within(rows[0] as HTMLElement).getByText("Electronics")).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText("Accessories")).toBeInTheDocument();
  });

  it("renders product table", async () => {
    renderStoreDetail();

    expect(await screen.findByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("Mouse")).toBeInTheDocument();
    expect(screen.getByText("$999.99")).toBeInTheDocument();
    expect(screen.getByText("$29.99")).toBeInTheDocument();
  });

  it("shows 'Store not found' when store doesn't exist", async () => {
    mockedGetStore.mockRejectedValue(new Error("Store not found"));
    mockedGetInventory.mockRejectedValue(new Error("Store not found"));
    mockedGetProducts.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
    renderStoreDetail();

    expect(await screen.findByText("Store not found.")).toBeInTheDocument();
  });

  it("toggles edit store form", async () => {
    const user = userEvent.setup();
    renderStoreDetail();

    await screen.findByRole("heading", { name: "Best Buy" });

    // The store header has the Edit button — find it in the actions area
    const storeHeader = screen.getByText("Best Buy").closest("div")!.parentElement!;
    const editBtn = within(storeHeader).getAllByRole("button", { name: "Edit" })[0];
    await user.click(editBtn);

    expect(screen.getByDisplayValue("Best Buy")).toBeInTheDocument();
    expect(screen.getByDisplayValue("123 Main St")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByDisplayValue("Best Buy")).not.toBeInTheDocument();
  });

  it("toggles add product form", async () => {
    const user = userEvent.setup();
    renderStoreDetail();

    await screen.findByText("Laptop");
    await user.click(screen.getByRole("button", { name: "+ Add Product" }));

    // Product form has a "Product Name" label
    const productForm = screen.getByPlaceholderText("e.g. Wireless Mouse").closest("form")!;
    expect(productForm).toBeInTheDocument();

    // Cancel via the button inside the product form
    await user.click(within(productForm).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByPlaceholderText("e.g. Wireless Mouse")).not.toBeInTheDocument();
  });

  it("deletes store and navigates home", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedDeleteStore.mockResolvedValue(undefined);
    renderStoreDetail();

    await screen.findByRole("heading", { name: "Best Buy" });

    // Find the store-level Delete button (not in a <td>)
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    const storeDeleteBtn = deleteButtons.find((btn) => !btn.closest("td"));
    await user.click(storeDeleteBtn!);

    await waitFor(() => {
      expect(mockedDeleteStore).toHaveBeenCalledWith("s1");
    });

    expect(await screen.findByTestId("home")).toBeInTheDocument();
  });

  it("creates a product and reloads", async () => {
    const user = userEvent.setup();
    mockedCreateProduct.mockResolvedValue({
      id: "p3",
      name: "Keyboard",
      category: "Accessories",
      price: "49.99",
      quantity: 20,
      storeId: "s1",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    });
    renderStoreDetail();

    await screen.findByText("Laptop");
    await user.click(screen.getByRole("button", { name: "+ Add Product" }));

    // Use the product form (it's inside a form element with specific placeholders)
    const form = screen.getByPlaceholderText("e.g. Wireless Mouse").closest("form")!;
    await user.type(within(form).getByPlaceholderText("e.g. Wireless Mouse"), "Keyboard");
    await user.type(within(form).getByPlaceholderText("e.g. Electronics"), "Accessories");

    const priceInput = within(form).getByPlaceholderText("0.00");
    await user.clear(priceInput);
    await user.type(priceInput, "49.99");

    // Quantity input — find by role within the form (step="1" distinguishes it from price)
    const numberInputs = within(form).getAllByRole("spinbutton");
    const qtyInput = numberInputs.find(
      (el) => el.getAttribute("step") === "1"
    )!;
    await user.clear(qtyInput);
    await user.type(qtyInput, "20");

    await user.click(within(form).getByRole("button", { name: "Add Product" }));

    await waitFor(() => {
      expect(mockedCreateProduct).toHaveBeenCalledWith("s1", {
        name: "Keyboard",
        category: "Accessories",
        price: 49.99,
        quantity: 20,
      });
    });
  });

  it("deletes a product after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedDeleteProduct.mockResolvedValue(undefined);
    renderStoreDetail();

    await screen.findByText("Laptop");
    // Product delete buttons are inside <td> elements
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    const productDeleteBtn = deleteButtons.find((btn) => btn.closest("td") !== null);
    await user.click(productDeleteBtn!);

    await waitFor(() => {
      expect(mockedDeleteProduct).toHaveBeenCalled();
    });
  });

  it("shows empty products message when none exist", async () => {
    mockedGetProducts.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
    renderStoreDetail();

    expect(await screen.findByText("No products found.")).toBeInTheDocument();
  });

  it("renders back link to stores", async () => {
    renderStoreDetail();

    await screen.findByRole("heading", { name: "Best Buy" });
    const backLink = screen.getByText(/Back to Stores/);
    expect(backLink.closest("a")).toHaveAttribute("href", "/");
  });
});

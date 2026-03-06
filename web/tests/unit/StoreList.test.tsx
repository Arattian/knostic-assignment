import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import StoreList from "../../src/pages/StoreList";
import type { Store } from "../../src/types";

const mockStores: Store[] = [
  {
    id: "1",
    name: "Best Buy",
    address: "123 Main St",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    _count: { products: 5 },
  },
  {
    id: "2",
    name: "Nike Store",
    address: "456 Oak Ave",
    createdAt: "2024-01-02",
    updatedAt: "2024-01-02",
    _count: { products: 10 },
  },
];

vi.mock("../../src/api/client", () => ({
  getStores: vi.fn(),
  createStore: vi.fn(),
  deleteStore: vi.fn(),
}));

import { getStores, createStore, deleteStore } from "../../src/api/client";

const mockedGetStores = vi.mocked(getStores);
const mockedCreateStore = vi.mocked(createStore);
const mockedDeleteStore = vi.mocked(deleteStore);

function renderStoreList() {
  return render(
    <MemoryRouter>
      <StoreList />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("StoreList", () => {
  it("shows loading spinner initially", () => {
    mockedGetStores.mockReturnValue(new Promise(() => {})); // never resolves
    renderStoreList();

    expect(document.querySelector(".spinner")).toBeInTheDocument();
  });

  it("renders store cards after loading", async () => {
    mockedGetStores.mockResolvedValue(mockStores);
    renderStoreList();

    expect(await screen.findByText("Best Buy")).toBeInTheDocument();
    expect(screen.getByText("Nike Store")).toBeInTheDocument();
    expect(screen.getByText("5 products")).toBeInTheDocument();
    expect(screen.getByText("10 products")).toBeInTheDocument();
  });

  it("shows empty state when no stores", async () => {
    mockedGetStores.mockResolvedValue([]);
    renderStoreList();

    expect(await screen.findByText("No stores yet")).toBeInTheDocument();
    expect(screen.getByText(/Create your first store/)).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    mockedGetStores.mockRejectedValue(new Error("Network error"));
    renderStoreList();

    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });

  it("toggles add store form", async () => {
    const user = userEvent.setup();
    mockedGetStores.mockResolvedValue([]);
    renderStoreList();

    await screen.findByText("No stores yet");

    await user.click(screen.getByRole("button", { name: "+ Add Store" }));
    expect(screen.getByPlaceholderText("e.g. Downtown Electronics")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByPlaceholderText("e.g. Downtown Electronics")).not.toBeInTheDocument();
  });

  it("creates a store and reloads list", async () => {
    const user = userEvent.setup();
    mockedGetStores.mockResolvedValueOnce([]);
    mockedCreateStore.mockResolvedValue({ ...mockStores[0] });
    mockedGetStores.mockResolvedValueOnce([mockStores[0]]);
    renderStoreList();

    await screen.findByText("No stores yet");
    await user.click(screen.getByRole("button", { name: "+ Add Store" }));

    await user.type(screen.getByPlaceholderText("e.g. Downtown Electronics"), "Best Buy");
    await user.type(screen.getByPlaceholderText("e.g. 123 Main St"), "123 Main St");
    await user.click(screen.getByRole("button", { name: "Create Store" }));

    await waitFor(() => {
      expect(mockedCreateStore).toHaveBeenCalledWith({
        name: "Best Buy",
        address: "123 Main St",
      });
    });
  });

  it("deletes a store after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedGetStores.mockResolvedValueOnce(mockStores);
    mockedDeleteStore.mockResolvedValue(undefined);
    mockedGetStores.mockResolvedValueOnce([mockStores[1]]);
    renderStoreList();

    await screen.findByText("Best Buy");
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockedDeleteStore).toHaveBeenCalledWith("1");
    });
  });

  it("does not delete when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    mockedGetStores.mockResolvedValue(mockStores);
    renderStoreList();

    await screen.findByText("Best Buy");
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);

    expect(mockedDeleteStore).not.toHaveBeenCalled();
  });

  it("renders store links pointing to detail page", async () => {
    mockedGetStores.mockResolvedValue(mockStores);
    renderStoreList();

    await screen.findByText("Best Buy");
    const link = screen.getByText("Best Buy").closest("a");
    expect(link).toHaveAttribute("href", "/stores/1");
  });
});

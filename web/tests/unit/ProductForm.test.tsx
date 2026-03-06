import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductForm from "../../src/components/ProductForm";

describe("ProductForm", () => {
  it("renders empty form for creation", () => {
    render(<ProductForm onSubmit={vi.fn()} />);

    expect(screen.getByPlaceholderText("e.g. Wireless Mouse")).toHaveValue("");
    expect(screen.getByPlaceholderText("e.g. Electronics")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Add Product" })).toBeInTheDocument();
  });

  it("renders pre-filled form for editing", () => {
    render(
      <ProductForm
        initial={{ name: "Widget", category: "Gadgets", price: 9.99, quantity: 50 }}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText("e.g. Wireless Mouse")).toHaveValue("Widget");
    expect(screen.getByPlaceholderText("e.g. Electronics")).toHaveValue("Gadgets");
    expect(screen.getByRole("button", { name: "Update Product" })).toBeInTheDocument();
  });

  it("shows validation error for empty fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProductForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Add Product" }));

    expect(screen.getByText("Please fill in all fields with valid values")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error when name is missing but numbers are valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProductForm onSubmit={onSubmit} />);

    // Fill only price and quantity, leave name and category empty
    await user.clear(screen.getByPlaceholderText("0.00"));
    await user.type(screen.getByPlaceholderText("0.00"), "10");
    await user.click(screen.getByRole("button", { name: "Add Product" }));

    expect(screen.getByText("Please fill in all fields with valid values")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with parsed numeric values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ProductForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("e.g. Wireless Mouse"), " Widget ");
    await user.type(screen.getByPlaceholderText("e.g. Electronics"), " Gadgets ");
    await user.clear(screen.getByPlaceholderText("0.00"));
    await user.type(screen.getByPlaceholderText("0.00"), "9.99");
    await user.clear(screen.getByPlaceholderText("0"));
    await user.type(screen.getByPlaceholderText("0"), "50");
    await user.click(screen.getByRole("button", { name: "Add Product" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Widget",
      category: "Gadgets",
      price: 9.99,
      quantity: 50,
    });
  });

  it("shows error from failed onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Validation failed"));
    render(<ProductForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("e.g. Wireless Mouse"), "Widget");
    await user.type(screen.getByPlaceholderText("e.g. Electronics"), "Cat");
    await user.clear(screen.getByPlaceholderText("0.00"));
    await user.type(screen.getByPlaceholderText("0.00"), "10");
    await user.clear(screen.getByPlaceholderText("0"));
    await user.type(screen.getByPlaceholderText("0"), "5");
    await user.click(screen.getByRole("button", { name: "Add Product" }));

    expect(await screen.findByText("Validation failed")).toBeInTheDocument();
  });

  it("shows 'Saving...' while submitting", async () => {
    const user = userEvent.setup();
    let resolve: () => void;
    const onSubmit = vi.fn().mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    render(<ProductForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("e.g. Wireless Mouse"), "Widget");
    await user.type(screen.getByPlaceholderText("e.g. Electronics"), "Cat");
    await user.clear(screen.getByPlaceholderText("0.00"));
    await user.type(screen.getByPlaceholderText("0.00"), "10");
    await user.clear(screen.getByPlaceholderText("0"));
    await user.type(screen.getByPlaceholderText("0"), "5");
    await user.click(screen.getByRole("button", { name: "Add Product" }));

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    await act(async () => resolve!());
  });

  it("renders cancel button when onCancel is provided", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ProductForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

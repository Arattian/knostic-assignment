import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StoreForm from "../../src/components/StoreForm";

describe("StoreForm", () => {
  it("renders empty form for creation", () => {
    render(<StoreForm onSubmit={vi.fn()} />);

    expect(screen.getByPlaceholderText("e.g. Downtown Electronics")).toHaveValue("");
    expect(screen.getByPlaceholderText("e.g. 123 Main St")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Create Store" })).toBeInTheDocument();
  });

  it("renders pre-filled form for editing", () => {
    render(
      <StoreForm
        initial={{ name: "My Store", address: "123 St" }}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText("e.g. Downtown Electronics")).toHaveValue("My Store");
    expect(screen.getByPlaceholderText("e.g. 123 Main St")).toHaveValue("123 St");
    expect(screen.getByRole("button", { name: "Update Store" })).toBeInTheDocument();
  });

  it("shows validation error when fields are empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<StoreForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Create Store" }));

    expect(screen.getByText("Name and address are required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error when name is only whitespace", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<StoreForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("e.g. Downtown Electronics"), "   ");
    await user.type(screen.getByPlaceholderText("e.g. 123 Main St"), "   ");
    await user.click(screen.getByRole("button", { name: "Create Store" }));

    expect(screen.getByText("Name and address are required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with trimmed data on valid input", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<StoreForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("e.g. Downtown Electronics"), " My Store ");
    await user.type(screen.getByPlaceholderText("e.g. 123 Main St"), " 456 Oak Ave ");
    await user.click(screen.getByRole("button", { name: "Create Store" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "My Store",
      address: "456 Oak Ave",
    });
  });

  it("shows error from failed onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Server error"));
    render(<StoreForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("e.g. Downtown Electronics"), "Store");
    await user.type(screen.getByPlaceholderText("e.g. 123 Main St"), "Addr");
    await user.click(screen.getByRole("button", { name: "Create Store" }));

    expect(await screen.findByText("Server error")).toBeInTheDocument();
  });

  it("shows 'Saving...' while submitting", async () => {
    const user = userEvent.setup();
    let resolve: () => void;
    const onSubmit = vi.fn().mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    render(<StoreForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("e.g. Downtown Electronics"), "Store");
    await user.type(screen.getByPlaceholderText("e.g. 123 Main St"), "Addr");
    await user.click(screen.getByRole("button", { name: "Create Store" }));

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    await act(async () => resolve!());
  });

  it("renders cancel button when onCancel is provided", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<StoreForm onSubmit={vi.fn()} onCancel={onCancel} />);

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    expect(cancelBtn).toBeInTheDocument();
    await user.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("does not render cancel button when onCancel is not provided", () => {
    render(<StoreForm onSubmit={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });
});

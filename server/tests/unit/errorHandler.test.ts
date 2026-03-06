import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import {
  AppError,
  NotFoundError,
  asyncHandler,
  errorHandler,
} from "../../src/middleware/errorHandler";

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("AppError", () => {
  it("sets statusCode and message", () => {
    const err = new AppError(422, "Unprocessable");
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe("Unprocessable");
    expect(err.name).toBe("AppError");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("NotFoundError", () => {
  it("sets 404 and resource-specific message", () => {
    const err = new NotFoundError("Store");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Store not found");
    expect(err.name).toBe("NotFoundError");
    expect(err).toBeInstanceOf(AppError);
  });
});

describe("asyncHandler", () => {
  it("calls the async function with req, res, next", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    handler(req, res, next);
    await new Promise((r) => setTimeout(r, 0));

    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it("forwards rejected promises to next()", async () => {
    const error = new Error("async failure");
    const fn = vi.fn().mockRejectedValue(error);
    const handler = asyncHandler(fn);
    const next = vi.fn() as NextFunction;

    handler({} as Request, {} as Response, next);
    await new Promise((r) => setTimeout(r, 0));

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("errorHandler", () => {
  it("handles AppError with correct status and message", () => {
    const res = mockRes();
    const err = new AppError(409, "Conflict");

    errorHandler(err, {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "Conflict" });
  });

  it("handles NotFoundError", () => {
    const res = mockRes();
    const err = new NotFoundError("Product");

    errorHandler(err, {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Product not found" });
  });

  it("returns 500 for unknown errors", () => {
    const res = mockRes();
    const err = new Error("something broke");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(err, {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    consoleSpy.mockRestore();
  });
});

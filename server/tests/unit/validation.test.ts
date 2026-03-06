import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../../src/middleware/validation";

function mockReqResNext(body: unknown) {
  const req = { body } as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

const testSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().int().positive("Age must be positive"),
});

describe("validate middleware", () => {
  it("calls next() for valid input", () => {
    const { req, res, next } = mockReqResNext({ name: "Alice", age: 30 });
    validate(testSchema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("strips unknown fields from body", () => {
    const { req, res, next } = mockReqResNext({
      name: "Alice",
      age: 30,
      extra: "should be stripped",
    });
    validate(testSchema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: "Alice", age: 30 });
    expect(req.body.extra).toBeUndefined();
  });

  it("returns 400 with details for invalid input", () => {
    const { req, res, next } = mockReqResNext({ name: "", age: -1 });
    validate(testSchema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation failed",
        details: expect.arrayContaining([
          expect.objectContaining({ path: "name" }),
          expect.objectContaining({ path: "age" }),
        ]),
      })
    );
  });

  it("returns 400 for missing required fields", () => {
    const { req, res, next } = mockReqResNext({});
    validate(testSchema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation failed",
        details: expect.arrayContaining([
          expect.objectContaining({ path: "name" }),
          expect.objectContaining({ path: "age" }),
        ]),
      })
    );
  });

  it("returns 400 for wrong types", () => {
    const { req, res, next } = mockReqResNext({ name: 123, age: "not a number" });
    validate(testSchema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("forwards non-Zod errors to next()", () => {
    const badSchema = {
      parse: () => {
        throw new Error("unexpected");
      },
    } as unknown as z.ZodSchema;

    const { req, res, next } = mockReqResNext({});
    validate(badSchema)(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
  });
});

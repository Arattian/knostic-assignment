import { Router, Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { validate } from "../middleware/validation";
import { asyncHandler, NotFoundError } from "../middleware/errorHandler";
import { prisma } from "../db";
import { productSchema } from "../schemas/product";
import type { IdParams } from "../types";

export const productsRouter = Router();

productsRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 20)
    );
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (req.query.storeId) {
      where.storeId = req.query.storeId as string;
    }

    if (req.query.category) {
      where.category = req.query.category as string;
    }

    if (req.query.minPrice || req.query.maxPrice) {
      where.price = {};
      if (req.query.minPrice) {
        where.price.gte = parseFloat(req.query.minPrice as string);
      }
      if (req.query.maxPrice) {
        where.price.lte = parseFloat(req.query.maxPrice as string);
      }
    }

    if (req.query.inStock === "true") {
      where.quantity = { gt: 0 };
    }

    const sortBy = (req.query.sortBy as string) || "createdAt";
    const order = (req.query.order as string) === "asc" ? "asc" : "desc";
    const allowedSortFields = [
      "name",
      "category",
      "price",
      "quantity",
      "createdAt",
    ];
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (allowedSortFields.includes(sortBy)) {
      (orderBy as Record<string, string>)[sortBy] = order;
    } else {
      orderBy.createdAt = order;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { store: { select: { id: true, name: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

productsRouter.get(
  "/:id",
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { store: true },
    });
    if (!product) {
      throw new NotFoundError("Product");
    }
    res.json(product);
  })
);

productsRouter.put(
  "/:id",
  validate(productSchema),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(product);
  })
);

productsRouter.delete(
  "/:id",
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    await prisma.product.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  })
);

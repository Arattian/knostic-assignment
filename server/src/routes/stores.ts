import { Router, Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { z } from "zod";
import { validate } from "../middleware/validation";
import { asyncHandler, NotFoundError } from "../middleware/errorHandler";
import { prisma } from "../db";
import { productSchema } from "../schemas/product";
import type { IdParams } from "../types";

export const storesRouter = Router();

const storeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
});

storesRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const stores = await prisma.store.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(stores);
  })
);

storesRouter.post(
  "/",
  validate(storeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const store = await prisma.store.create({
      data: req.body,
    });
    res.status(201).json(store);
  })
);

storesRouter.get(
  "/:id",
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const store = await prisma.store.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { products: true } },
      },
    });
    if (!store) {
      throw new NotFoundError("Store");
    }
    res.json(store);
  })
);

storesRouter.put(
  "/:id",
  validate(storeSchema),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const store = await prisma.store.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(store);
  })
);

storesRouter.delete(
  "/:id",
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    await prisma.store.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  })
);

storesRouter.get(
  "/:id/inventory",
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const store = await prisma.store.findUnique({
      where: { id: req.params.id },
    });
    if (!store) {
      throw new NotFoundError("Store");
    }

    const rows = await prisma.$queryRaw<
      {
        category: string | null;
        product_count: bigint;
        item_count: bigint;
        total_value: number;
      }[]
    >`
      SELECT
        category,
        COUNT(*)                           AS product_count,
        COALESCE(SUM(quantity), 0)         AS item_count,
        COALESCE(SUM(price * quantity), 0) AS total_value
      FROM "Product"
      WHERE "storeId" = ${req.params.id}
      GROUP BY GROUPING SETS ((category), ())
      ORDER BY category NULLS FIRST
    `;

    // GROUPING SETS produces no rows when the WHERE clause matches nothing,
    // unlike a plain GROUP BY () which would still return a single row of NULLs.
    if (rows.length === 0) {
      res.json({
        storeId: store.id,
        storeName: store.name,
        totalValue: 0,
        totalProducts: 0,
        totalItems: 0,
        byCategory: [],
      });
      return;
    }

    // The empty () grouping set produces a totals row with category = null.
    // ORDER BY category NULLS FIRST guarantees it's always rows[0].
    const totals = rows[0];
    const categoryRows = rows.slice(1);

    res.json({
      storeId: store.id,
      storeName: store.name,
      totalValue: Math.round(Number(totals.total_value) * 100) / 100,
      totalProducts: Number(totals.product_count),
      totalItems: Number(totals.item_count),
      byCategory: categoryRows.map((row) => ({
        category: row.category!,
        productCount: Number(row.product_count),
        itemCount: Number(row.item_count),
        totalValue: Math.round(Number(row.total_value) * 100) / 100,
      })),
    });
  })
);

storesRouter.get(
  "/:id/products",
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const store = await prisma.store.findUnique({
      where: { id: req.params.id },
    });
    if (!store) {
      throw new NotFoundError("Store");
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 20)
    );
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { storeId: req.params.id };

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
      prisma.product.findMany({ where, skip, take: limit, orderBy }),
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

storesRouter.post(
  "/:id/products",
  validate(productSchema),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const store = await prisma.store.findUnique({
      where: { id: req.params.id },
    });
    if (!store) {
      throw new NotFoundError("Store");
    }

    const product = await prisma.product.create({
      data: {
        ...req.body,
        storeId: req.params.id,
      },
    });
    res.status(201).json(product);
  })
);

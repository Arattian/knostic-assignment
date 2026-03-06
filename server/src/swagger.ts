const storeProperties = {
  id: { type: "string", format: "uuid" },
  name: { type: "string" },
  address: { type: "string" },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" },
};

const productProperties = {
  id: { type: "string", format: "uuid" },
  name: { type: "string" },
  category: { type: "string" },
  price: { type: "number", format: "decimal" },
  quantity: { type: "integer", minimum: 0 },
  storeId: { type: "string", format: "uuid" },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" },
};

const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
});

const validationErrorResponse = {
  description: "Validation failed",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          error: { type: "string", example: "Validation failed" },
          details: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

const paginationParams = [
  { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 } },
];

const filterParams = [
  { name: "category", in: "query", schema: { type: "string" } },
  { name: "minPrice", in: "query", schema: { type: "number" } },
  { name: "maxPrice", in: "query", schema: { type: "number" } },
  { name: "inStock", in: "query", schema: { type: "string", enum: ["true", "false"] } },
  { name: "sortBy", in: "query", schema: { type: "string", enum: ["name", "category", "price", "quantity", "createdAt"], default: "createdAt" } },
  { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
];

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

const paginationSchema = {
  type: "object",
  properties: {
    page: { type: "integer" },
    limit: { type: "integer" },
    total: { type: "integer" },
    totalPages: { type: "integer" },
  },
};

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Tiny Inventory API",
    version: "1.0.0",
    description: "REST API for managing stores and their product inventories.",
  },
  servers: [{ url: "/api", description: "API base path" }],
  tags: [
    { name: "Stores", description: "Store management" },
    { name: "Products", description: "Product management" },
    { name: "Health", description: "Health check" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Server is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
    "/stores": {
      get: {
        tags: ["Stores"],
        summary: "List all stores",
        responses: {
          "200": {
            description: "Array of stores with product counts",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ...storeProperties,
                      _count: {
                        type: "object",
                        properties: { products: { type: "integer" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Stores"],
        summary: "Create a store",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "address"],
                properties: {
                  name: { type: "string", minLength: 1 },
                  address: { type: "string", minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Store created",
            content: {
              "application/json": {
                schema: { type: "object", properties: storeProperties },
              },
            },
          },
          "400": validationErrorResponse,
        },
      },
    },
    "/stores/{id}": {
      get: {
        tags: ["Stores"],
        summary: "Get a store by ID",
        parameters: [idParam],
        responses: {
          "200": {
            description: "Store with product count",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ...storeProperties,
                    _count: {
                      type: "object",
                      properties: { products: { type: "integer" } },
                    },
                  },
                },
              },
            },
          },
          "404": errorResponse("Store not found"),
        },
      },
      put: {
        tags: ["Stores"],
        summary: "Update a store",
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "address"],
                properties: {
                  name: { type: "string", minLength: 1 },
                  address: { type: "string", minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Store updated",
            content: {
              "application/json": {
                schema: { type: "object", properties: storeProperties },
              },
            },
          },
          "400": validationErrorResponse,
          "404": errorResponse("Store not found"),
        },
      },
      delete: {
        tags: ["Stores"],
        summary: "Delete a store (cascades to products)",
        parameters: [idParam],
        responses: {
          "204": { description: "Store deleted" },
          "404": errorResponse("Store not found"),
        },
      },
    },
    "/stores/{id}/inventory": {
      get: {
        tags: ["Stores"],
        summary: "Get aggregated inventory for a store",
        description: "Returns total value, product count, item count, and per-category breakdown computed at the database level.",
        parameters: [idParam],
        responses: {
          "200": {
            description: "Inventory summary",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    storeId: { type: "string", format: "uuid" },
                    storeName: { type: "string" },
                    totalValue: { type: "number" },
                    totalProducts: { type: "integer" },
                    totalItems: { type: "integer" },
                    byCategory: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          category: { type: "string" },
                          productCount: { type: "integer" },
                          itemCount: { type: "integer" },
                          totalValue: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "404": errorResponse("Store not found"),
        },
      },
    },
    "/stores/{id}/products": {
      get: {
        tags: ["Stores"],
        summary: "List products in a store (filtered & paginated)",
        parameters: [idParam, ...paginationParams, ...filterParams],
        responses: {
          "200": {
            description: "Paginated product list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { type: "object", properties: productProperties },
                    },
                    pagination: paginationSchema,
                  },
                },
              },
            },
          },
          "404": errorResponse("Store not found"),
        },
      },
      post: {
        tags: ["Stores"],
        summary: "Create a product in a store",
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "category", "price", "quantity"],
                properties: {
                  name: { type: "string", minLength: 1 },
                  category: { type: "string", minLength: 1 },
                  price: { type: "number", exclusiveMinimum: 0 },
                  quantity: { type: "integer", minimum: 0 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Product created",
            content: {
              "application/json": {
                schema: { type: "object", properties: productProperties },
              },
            },
          },
          "400": validationErrorResponse,
          "404": errorResponse("Store not found"),
        },
      },
    },
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List all products across all stores (filtered & paginated)",
        parameters: [
          { name: "storeId", in: "query", schema: { type: "string", format: "uuid" }, description: "Filter by store" },
          ...paginationParams,
          ...filterParams,
        ],
        responses: {
          "200": {
            description: "Paginated product list with store info",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          ...productProperties,
                          store: {
                            type: "object",
                            properties: {
                              id: { type: "string", format: "uuid" },
                              name: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                    pagination: paginationSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get a product by ID",
        parameters: [idParam],
        responses: {
          "200": {
            description: "Product with store details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ...productProperties,
                    store: { type: "object", properties: storeProperties },
                  },
                },
              },
            },
          },
          "404": errorResponse("Product not found"),
        },
      },
      put: {
        tags: ["Products"],
        summary: "Update a product",
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "category", "price", "quantity"],
                properties: {
                  name: { type: "string", minLength: 1 },
                  category: { type: "string", minLength: 1 },
                  price: { type: "number", exclusiveMinimum: 0 },
                  quantity: { type: "integer", minimum: 0 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Product updated",
            content: {
              "application/json": {
                schema: { type: "object", properties: productProperties },
              },
            },
          },
          "400": validationErrorResponse,
          "404": errorResponse("Product not found"),
        },
      },
      delete: {
        tags: ["Products"],
        summary: "Delete a product",
        parameters: [idParam],
        responses: {
          "204": { description: "Product deleted" },
          "404": errorResponse("Product not found"),
        },
      },
    },
  },
};

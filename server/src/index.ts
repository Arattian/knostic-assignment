import express from "express";
import cors from "cors";
import { storesRouter } from "./routes/stores";
import { productsRouter } from "./routes/products";
import { errorHandler } from "./middleware/errorHandler";
import { prisma } from "./db";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/stores", storesRouter);
app.use("/api/products", productsRouter);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "error", message: "Database unreachable" });
  }
});

// Must be registered after all routes — Express only invokes 4-arg middleware as error handlers
app.use(errorHandler);

if (require.main === module) {
  const port = process.env.PORT || 4000;
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  const SHUTDOWN_TIMEOUT_MS = 10_000;
  let isShuttingDown = false;

  async function shutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n${signal} received — shutting down gracefully…`);

    // Stop accepting new connections; let in-flight requests finish
    server.close(async () => {
      try {
        await prisma.$disconnect();
        console.log("Database disconnected.");
        process.exit(0);
      } catch (err) {
        console.error("Error during cleanup:", err);
        process.exit(1);
      }
    });

    // Force exit if drain takes too long (e.g. stuck connections)
    setTimeout(() => {
      console.error(
        `Could not close connections within ${SHUTDOWN_TIMEOUT_MS}ms — forcing exit`
      );
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

import { Router, type IRouter } from "express";
import { desc, eq, ilike, and, gt } from "drizzle-orm";
import { db, productsTable, ordersTable, categoriesTable } from "@workspace/db";
import {
  GetProductParams,
  ListProductsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Helper to format product from DB row
function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    price: parseFloat(p.price),
    originalPrice: p.originalPrice != null ? parseFloat(p.originalPrice) : null,
    description: p.description,
    imageUrl: p.imageUrl,
    images: p.images ?? [],
    category: p.category,
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
    stock: p.stock,
    rating: p.rating != null ? parseFloat(p.rating) : null,
    reviewCount: p.reviewCount,
    isNew: p.isNew,
    isSale: p.isSale,
    createdAt: p.createdAt,
  };
}

// GET /products
router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { category, cursor, limit = 10 } = parsed.data;

  const conditions = [];
  if (category) {
    conditions.push(eq(productsTable.category, category));
  }
  if (cursor) {
    conditions.push(gt(productsTable.id, cursor));
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(productsTable.id)
    .limit(limit + 1);

  const hasMore = products.length > limit;
  const items = hasMore ? products.slice(0, limit) : products;

  const [countRow] = await db
    .select({ count: db.$count(productsTable) })
    .from(productsTable);

  res.json({
    products: items.map(formatProduct),
    nextCursor: hasMore ? items[items.length - 1].id : null,
    total: Number(countRow?.count ?? 0),
  });
});

// GET /products/stats
router.get("/products/stats", async (_req, res): Promise<void> => {
  const [totalProducts] = await db
    .select({ count: db.$count(productsTable) })
    .from(productsTable);

  const [totalOrders] = await db
    .select({ count: db.$count(ordersTable) })
    .from(ordersTable);

  // Total revenue from confirmed orders
  const revenueRows = await db
    .select({ totalPrice: ordersTable.totalPrice, status: ordersTable.status })
    .from(ordersTable)
    .where(eq(ordersTable.paymentStatus, "paid"));

  const totalRevenue = revenueRows.reduce((sum, r) => sum + parseFloat(r.totalPrice), 0);

  // Category breakdown
  const allProducts = await db.select({ category: productsTable.category }).from(productsTable);
  const categoryMap = new Map<string, number>();
  for (const p of allProducts) {
    categoryMap.set(p.category, (categoryMap.get(p.category) ?? 0) + 1);
  }
  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }));

  // Recent activity - last 5 orders
  const recentOrders = await db
    .select({
      id: ordersTable.id,
      status: ordersTable.status,
      createdAt: ordersTable.createdAt,
      productId: ordersTable.productId,
    })
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(5);

  const recentActivity = await Promise.all(
    recentOrders.map(async (o) => {
      const [product] = await db.select({ name: productsTable.name }).from(productsTable).where(eq(productsTable.id, o.productId));
      return {
        orderId: o.id,
        productName: product?.name ?? "Unknown",
        action: o.status,
        timestamp: o.createdAt,
      };
    })
  );

  res.json({
    totalProducts: Number(totalProducts?.count ?? 0),
    totalOrders: Number(totalOrders?.count ?? 0),
    totalRevenue,
    categoryBreakdown,
    recentActivity,
  });
});

// GET /products/:id
router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(formatProduct(product));
});

export default router;

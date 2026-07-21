import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, ordersTable, productsTable } from "@workspace/db";
import {
  CreateOrderBody,
  GetOrderParams,
  ConfirmOrderParams,
  ConfirmOrderBody,
  CancelOrderParams,
  ListOrdersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Helper to format product
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

// Helper to format order with product
async function formatOrderWithProduct(order: typeof ordersTable.$inferSelect) {
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, order.productId));

  return {
    id: order.id,
    sessionId: order.sessionId,
    productId: order.productId,
    product: product ? formatProduct(product) : null,
    selectedSize: order.selectedSize,
    selectedColor: order.selectedColor,
    quantity: order.quantity,
    totalPrice: parseFloat(order.totalPrice),
    status: order.status,
    paymentMethod: order.paymentMethod ?? null,
    paymentStatus: order.paymentStatus,
    shippingAddress: order.shippingAddress ?? null,
    customerName: order.customerName ?? null,
    customerEmail: order.customerEmail ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

// GET /orders
router.get("/orders", async (req, res): Promise<void> => {
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { session_id } = parsed.data;
  const conditions = session_id ? [eq(ordersTable.sessionId, session_id)] : [];

  const orders = await db
    .select()
    .from(ordersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(ordersTable.createdAt);

  const result = await Promise.all(orders.map(formatOrderWithProduct));
  res.json(result);
});

// POST /orders
router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId, productId, selectedSize, selectedColor, quantity } = parsed.data;

  // Check product exists and has stock
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));

  if (!product) {
    res.status(400).json({ error: "Product not found" });
    return;
  }

  if (product.stock < quantity) {
    res.status(409).json({ error: "Insufficient stock" });
    return;
  }

  const totalPrice = (parseFloat(product.price) * quantity).toFixed(2);

  const [order] = await db
    .insert(ordersTable)
    .values({
      sessionId,
      productId,
      selectedSize,
      selectedColor,
      quantity,
      totalPrice,
      status: "pending",
      paymentStatus: "unpaid",
    })
    .returning();

  // Decrease stock
  await db
    .update(productsTable)
    .set({ stock: product.stock - quantity })
    .where(eq(productsTable.id, productId));

  const formatted = await formatOrderWithProduct(order);
  res.status(201).json(formatted);
});

// GET /orders/:id
router.get("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetOrderParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const formatted = await formatOrderWithProduct(order);
  res.json(formatted);
});

// PATCH /orders/:id/confirm
router.patch("/orders/:id/confirm", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ConfirmOrderParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ConfirmOrderBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const { paymentMethod, shippingAddress, customerName, customerEmail } = body.data;

  const [order] = await db
    .update(ordersTable)
    .set({
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod,
      shippingAddress,
      customerName,
      customerEmail,
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  const formatted = await formatOrderWithProduct(order);
  res.json(formatted);
});

// PATCH /orders/:id/cancel
router.patch("/orders/:id/cancel", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CancelOrderParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Restore stock if cancelling
  if (existing.status !== "cancelled") {
    await db
      .update(productsTable)
      .set({
        stock: db.sql`${productsTable.stock} + ${existing.quantity}`,
      })
      .where(eq(productsTable.id, existing.productId));
  }

  const [order] = await db
    .update(ordersTable)
    .set({
      status: "cancelled",
      paymentStatus: existing.paymentStatus === "paid" ? "refunded" : "unpaid",
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  const formatted = await formatOrderWithProduct(order);
  res.json(formatted);
});

export default router;

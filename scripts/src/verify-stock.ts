import { db, ordersTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const SESSION = "verify-stock-session";

async function main() {
  const [before] = await db.select().from(productsTable).where(eq(productsTable.id, 1));
  console.log("stok awal                :", before.stock);

  // Tiru createOrderAction
  const qty = 3;
  const total = (parseFloat(before.price) * qty).toFixed(2);
  const [order] = await db.insert(ordersTable).values({
    sessionId: SESSION, productId: 1, selectedSize: "M", selectedColor: "Burgundy",
    quantity: qty, totalPrice: total, status: "pending", paymentStatus: "unpaid",
  }).returning();
  await db.update(productsTable).set({ stock: before.stock - qty }).where(eq(productsTable.id, 1));

  const [afterOrder] = await db.select().from(productsTable).where(eq(productsTable.id, 1));
  console.log("stok setelah order qty=3 :", afterOrder.stock, afterOrder.stock === before.stock - qty ? "OK" : "SALAH");
  console.log("totalPrice tersimpan     :", order.totalPrice);

  // Tiru cancelOrderAction — ini baris yang dulu memakai db.sql dan error
  await db.update(productsTable)
    .set({ stock: sql`${productsTable.stock} + ${order.quantity}` })
    .where(eq(productsTable.id, 1));
  await db.update(ordersTable)
    .set({ status: "cancelled", paymentStatus: "unpaid", updatedAt: new Date() })
    .where(eq(ordersTable.id, order.id));

  const [afterCancel] = await db.select().from(productsTable).where(eq(productsTable.id, 1));
  console.log("stok setelah cancel      :", afterCancel.stock, afterCancel.stock === before.stock ? "OK - stok pulih" : "SALAH");

  // bersihkan
  await db.delete(ordersTable).where(eq(ordersTable.sessionId, SESSION));
  console.log("data uji dibersihkan");
  process.exit(0);
}
main().catch((e) => { console.error("GAGAL:", e.message); process.exit(1); });

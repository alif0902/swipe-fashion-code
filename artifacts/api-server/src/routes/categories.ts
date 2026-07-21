import { Router, type IRouter } from "express";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// GET /categories
router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);

  const result = await Promise.all(
    categories.map(async (cat) => {
      const [row] = await db
        .select({ count: db.$count(productsTable) })
        .from(productsTable)
        .where(eq(productsTable.category, cat.slug));
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        productCount: Number(row?.count ?? 0),
      };
    })
  );

  res.json(result);
});

export default router;

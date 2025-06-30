import { Router } from "express";
import { db } from "../db.js";           // your Drizzle DB client
import { merchants } from "../schema.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const list = await db
      .select({
        value: merchant.id,
        text: merchant.name      // assuming you have a `name` column
      })
      .from(merchant);
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
});

export default router;

// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    /* mandatory */
    dialect: 'postgresql',               // <- this is the only flag you need
    schema: './server/src/schema.ts',
    out:     './drizzle',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
  strict: true,
});

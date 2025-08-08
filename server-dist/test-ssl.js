// server/src/test-ssl.js
import 'dotenv/config';
import { Pool } from 'pg';
const pool = new Pool({
    host: 'couponbook-instance-1.ch2ctwanaaas.us-east-1.rds.amazonaws.com',
    port: 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false } // bypass cert check
});
(async () => {
    let client;
    try {
        client = await pool.connect();
        console.log('✅ connected without cert check');
    }
    catch (err) {
        console.error('❌ SSL ERROR:', err.code, err.message);
    }
    finally {
        if (client) {
            client.release(); // ← return the client to the pool
            console.log('🔄 client released');
        }
        await pool.end(); // ← now the pool can fully close
        console.log('👋 pool ended');
        process.exit(0); // ← ensure the script exits
    }
})();

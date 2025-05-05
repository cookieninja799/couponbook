// server/src/db.js
const prisma = require('./prisma');

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('🟢  Prisma connected');
  } catch (err) {
    console.error('🔴  Prisma connection error:', err);
    process.exit(1);
  }
}

module.exports = connectDB;

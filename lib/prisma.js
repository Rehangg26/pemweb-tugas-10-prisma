require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL belum diatur. Salin .env.example menjadi .env.');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
module.exports = new PrismaClient({ adapter });

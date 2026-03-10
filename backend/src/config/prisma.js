require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaNeonHttp } = require("@prisma/adapter-neon");

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL);

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
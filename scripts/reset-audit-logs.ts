import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.auditLog.count();

  // Limpa apenas os registros de auditoria para reiniciar a comunicacao operacional.
  await prisma.auditLog.deleteMany();

  const after = await prisma.auditLog.count();

  console.log(JSON.stringify({ before, after }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

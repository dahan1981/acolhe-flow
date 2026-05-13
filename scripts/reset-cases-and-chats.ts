import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const before = {
    cases: await prisma.caseRecord.count(),
    attendances: await prisma.attendance.count(),
    referrals: await prisma.referral.count(),
    supportRequests: await prisma.supportRequest.count(),
    chatTickets: await prisma.chatTicket.count(),
    chatMessages: await prisma.chatMessage.count(),
    users: await prisma.user.count(),
  };

  // Limpa apenas os dados operacionais do fluxo, preservando contas e cadastros base.
  await prisma.$transaction(async (tx) => {
    await tx.chatMessage.deleteMany();
    await tx.chatTicket.deleteMany();
    await tx.referral.deleteMany();
    await tx.attendance.deleteMany();
    await tx.supportRequest.deleteMany();
    await tx.caseRecord.deleteMany();
  });

  const after = {
    cases: await prisma.caseRecord.count(),
    attendances: await prisma.attendance.count(),
    referrals: await prisma.referral.count(),
    supportRequests: await prisma.supportRequest.count(),
    chatTickets: await prisma.chatTicket.count(),
    chatMessages: await prisma.chatMessage.count(),
    users: await prisma.user.count(),
  };

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

import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  CaseStatus,
  PrismaClient,
  Priority,
  ReferralStatus,
  RiskLevel,
  Role,
} from "@prisma/client";

const prisma = new PrismaClient();

function toDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatTicket.deleteMany();
  await prisma.supportRequest.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.caseRecord.deleteMany();
  await prisma.managerProfile.deleteMany();
  await prisma.professionalProfile.deleteMany();
  await prisma.womanProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const organizations = await Promise.all([
    prisma.organization.create({ data: { name: "Secretaria da Mulher", code: "sec-mulher", color: "hsl(224, 71%, 45%)" } }),
    prisma.organization.create({ data: { name: "CREAS", code: "creas", color: "hsl(162, 37%, 45%)" } }),
    prisma.organization.create({ data: { name: "CRAS", code: "cras", color: "hsl(199, 60%, 45%)" } }),
    prisma.organization.create({ data: { name: "Delegacia da Mulher", code: "delegacia", color: "hsl(260, 50%, 50%)" } }),
    prisma.organization.create({ data: { name: "UBS", code: "ubs", color: "hsl(340, 60%, 50%)" } }),
    prisma.organization.create({ data: { name: "Defensoria Publica", code: "defensoria", color: "hsl(30, 70%, 50%)" } }),
    prisma.organization.create({ data: { name: "Casa Abrigo", code: "abrigo", color: "hsl(0, 60%, 50%)" } }),
  ]);

  const orgByCode = Object.fromEntries(organizations.map((item) => [item.code, item]));
  const defaultPassword = await bcrypt.hash("Acolhe@123", 10);

  const womanUser = await prisma.user.create({
    data: {
      email: "ana@exemplo.com",
      passwordHash: defaultPassword,
      fullName: "Ana Beatriz Santos",
      role: Role.MULHER,
      organizationId: orgByCode["sec-mulher"].id,
      womanProfile: {
        create: {
          socialName: null,
          cpf: "12345678900",
          birthDate: toDate("1990-03-15"),
          phone: "11987654321",
          addressLine: "Rua das Flores, 234, Jd. Primavera",
          city: "Mangaratiba",
          state: "RJ",
        },
      },
    },
    include: { womanProfile: true },
  });

  const professionalUser = await prisma.user.create({
    data: {
      email: "carla@exemplo.com",
      passwordHash: defaultPassword,
      fullName: "Carla Mendes",
      role: Role.PROFISSIONAL,
      organizationId: orgByCode["sec-mulher"].id,
      professionalProfile: {
        create: {
          organizationId: orgByCode["sec-mulher"].id,
          title: "Assistente social",
          specialties: "Acolhimento inicial",
        },
      },
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: "fernanda@exemplo.com",
      passwordHash: defaultPassword,
      fullName: "Fernanda Oliveira",
      role: Role.GESTORA,
      organizationId: orgByCode["sec-mulher"].id,
      managerProfile: {
        create: {
          organizationId: orgByCode["sec-mulher"].id,
          scope: "municipal",
        },
      },
    },
  });

  const women = await Promise.all([
    prisma.user.create({
      data: {
        email: "maria@exemplo.com",
        passwordHash: defaultPassword,
        fullName: "Maria Luisa Ferreira",
        role: Role.MULHER,
        organizationId: orgByCode["delegacia"].id,
        womanProfile: {
          create: {
            socialName: "Malu",
            cpf: "98765432100",
            birthDate: toDate("1985-11-22"),
            phone: "11912345678",
            addressLine: "Av. Brasil, 1500, Centro",
            city: "Mangaratiba",
            state: "RJ",
          },
        },
      },
      include: { womanProfile: true },
    }),
    prisma.user.create({
      data: {
        email: "juliana@exemplo.com",
        passwordHash: defaultPassword,
        fullName: "Juliana Costa Ribeiro",
        role: Role.MULHER,
        organizationId: orgByCode["cras"].id,
        womanProfile: {
          create: {
            cpf: "45678912300",
            birthDate: toDate("1993-06-08"),
            phone: "11976543210",
            addressLine: "Rua Esperanca, 89, Vila Nova",
            city: "Mangaratiba",
            state: "RJ",
          },
        },
      },
      include: { womanProfile: true },
    }),
    prisma.user.create({
      data: {
        email: "patricia@exemplo.com",
        passwordHash: defaultPassword,
        fullName: "Patricia Alves de Souza",
        role: Role.MULHER,
        organizationId: orgByCode["ubs"].id,
        womanProfile: {
          create: {
            cpf: "32165498700",
            birthDate: toDate("1978-01-30"),
            phone: "11954321098",
            addressLine: "Rua Sao Jorge, 456, Pq. Industrial",
            city: "Mangaratiba",
            state: "RJ",
          },
        },
      },
      include: { womanProfile: true },
    }),
  ]);

  const allWomen = [womanUser, ...women];

  const cases = await Promise.all([
    prisma.caseRecord.create({
      data: {
        protocol: "2024-0812",
        womanProfileId: womanUser.womanProfile!.id,
        createdByUserId: professionalUser.id,
        assignedProfessionalId: professionalUser.id,
        entryOrganizationId: orgByCode["sec-mulher"].id,
        currentOrganizationId: orgByCode["creas"].id,
        intakeSummary: "Vitima de violencia domestica. Possui dois filhos menores e busca acolhimento imediato.",
        riskLevel: RiskLevel.ALTO,
        status: CaseStatus.EM_ANDAMENTO,
        createdAt: toDate("2024-07-10"),
      },
    }),
    prisma.caseRecord.create({
      data: {
        protocol: "2024-0945",
        womanProfileId: allWomen[1].womanProfile!.id,
        createdByUserId: professionalUser.id,
        entryOrganizationId: orgByCode["delegacia"].id,
        currentOrganizationId: orgByCode["abrigo"].id,
        intakeSummary: "Situacao de risco iminente com pedido de abrigo emergencial e medida protetiva.",
        riskLevel: RiskLevel.CRITICO,
        status: CaseStatus.ATIVO,
        createdAt: toDate("2024-08-02"),
      },
    }),
    prisma.caseRecord.create({
      data: {
        protocol: "2024-0723",
        womanProfileId: allWomen[2].womanProfile!.id,
        createdByUserId: professionalUser.id,
        entryOrganizationId: orgByCode["cras"].id,
        currentOrganizationId: orgByCode["defensoria"].id,
        intakeSummary: "Violencia psicologica e controle financeiro pelo companheiro.",
        riskLevel: RiskLevel.MEDIO,
        status: CaseStatus.ENCAMINHADO,
        createdAt: toDate("2024-06-15"),
      },
    }),
    prisma.caseRecord.create({
      data: {
        protocol: "2024-0601",
        womanProfileId: allWomen[3].womanProfile!.id,
        createdByUserId: professionalUser.id,
        entryOrganizationId: orgByCode["ubs"].id,
        currentOrganizationId: orgByCode["ubs"].id,
        intakeSummary: "Atendida na UBS com sinais de lesao e suspeita de violencia domestica.",
        riskLevel: RiskLevel.BAIXO,
        status: CaseStatus.RESOLVIDO,
        createdAt: toDate("2024-05-20"),
        closedAt: toDate("2024-06-11"),
      },
    }),
  ]);

  const firstAttendance = await prisma.attendance.create({
    data: {
      caseId: cases[0].id,
      professionalUserId: professionalUser.id,
      organizationId: orgByCode["sec-mulher"].id,
      attendanceType: "Acolhimento Inicial",
      summary: "Primeiro acolhimento com relato de agressoes fisicas e verbais frequentes.",
      riskLevel: RiskLevel.ALTO,
      needsReferral: true,
      nextSteps: "Registrar BO e solicitar medida protetiva.",
      occurredAt: toDate("2024-07-10"),
      createdAt: toDate("2024-07-10"),
    },
  });

  const secondAttendance = await prisma.attendance.create({
    data: {
      caseId: cases[0].id,
      professionalUserId: professionalUser.id,
      organizationId: orgByCode["creas"].id,
      attendanceType: "Acompanhamento Social",
      summary: "Mulher esta temporariamente com a mae e precisa de acompanhamento socioassistencial.",
      riskLevel: RiskLevel.MEDIO,
      needsReferral: false,
      nextSteps: "Reavaliar em 15 dias.",
      occurredAt: toDate("2024-07-22"),
      createdAt: toDate("2024-07-22"),
    },
  });

  const thirdAttendance = await prisma.attendance.create({
    data: {
      caseId: cases[1].id,
      professionalUserId: professionalUser.id,
      organizationId: orgByCode["delegacia"].id,
      attendanceType: "Registro de Ocorrencia",
      summary: "Solicitada medida protetiva e encaminhamento para abrigo.",
      riskLevel: RiskLevel.CRITICO,
      needsReferral: true,
      nextSteps: "Encaminhamento imediato ao abrigo.",
      occurredAt: toDate("2024-08-02"),
      createdAt: toDate("2024-08-02"),
    },
  });

  await prisma.referral.createMany({
    data: [
      {
        caseId: cases[0].id,
        attendanceId: firstAttendance.id,
        createdByUserId: professionalUser.id,
        sourceOrganizationId: orgByCode["sec-mulher"].id,
        targetOrganizationId: orgByCode["delegacia"].id,
        reason: "Registro de BO e solicitacao de medida protetiva",
        priority: Priority.ALTA,
        status: ReferralStatus.CONCLUIDO,
        createdAt: toDate("2024-07-10"),
        updatedAt: toDate("2024-07-10"),
      },
      {
        caseId: cases[0].id,
        attendanceId: secondAttendance.id,
        createdByUserId: professionalUser.id,
        sourceOrganizationId: orgByCode["creas"].id,
        targetOrganizationId: orgByCode["defensoria"].id,
        reason: "Orientacao juridica e acompanhamento social",
        priority: Priority.MEDIA,
        status: ReferralStatus.EM_ATENDIMENTO,
        createdAt: toDate("2024-07-22"),
        updatedAt: toDate("2024-07-22"),
      },
      {
        caseId: cases[1].id,
        attendanceId: thirdAttendance.id,
        createdByUserId: professionalUser.id,
        sourceOrganizationId: orgByCode["delegacia"].id,
        targetOrganizationId: orgByCode["abrigo"].id,
        reason: "Acolhimento emergencial por risco iminente",
        priority: Priority.URGENTE,
        status: ReferralStatus.CONCLUIDO,
        createdAt: toDate("2024-08-02"),
        updatedAt: toDate("2024-08-02"),
      },
    ],
  });

  await prisma.supportRequest.create({
    data: {
      caseId: cases[0].id,
      womanUserId: womanUser.id,
      kind: "apoio_juridico",
      message: "Preciso de apoio juridico para acompanhar a medida protetiva.",
      createdAt: toDate("2024-07-25"),
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: managerUser.id,
        action: "seed.manager.created",
        entityType: "user",
        entityId: managerUser.id,
      },
      {
        actorUserId: professionalUser.id,
        action: "seed.professional.created",
        entityType: "user",
        entityId: professionalUser.id,
      },
    ],
  });

  console.log("Seed concluido.");
  console.log("Gestora:", managerUser.email, "senha: Acolhe@123");
  console.log("Profissional:", professionalUser.email, "senha: Acolhe@123");
  console.log("Mulher:", womanUser.email, "senha: Acolhe@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

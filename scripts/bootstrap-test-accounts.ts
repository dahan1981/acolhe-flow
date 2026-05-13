import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

function toDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

async function ensureOrganization(code: string, name: string, color: string) {
  return prisma.organization.upsert({
    where: { code },
    update: {
      name,
      color,
      isActive: true,
    },
    create: {
      code,
      name,
      color,
      isActive: true,
    },
  });
}

async function main() {
  const defaultPassword = await bcrypt.hash("Acolhe@123", 10);

  const secretariaMulher = await ensureOrganization("sec-mulher", "Secretaria da Mulher", "hsl(224, 71%, 45%)");
  const cras = await ensureOrganization("cras", "CRAS", "hsl(199, 60%, 45%)");
  const delegacia = await ensureOrganization("delegacia", "Delegacia da Mulher", "hsl(260, 50%, 50%)");
  const ubs = await ensureOrganization("ubs", "UBS", "hsl(340, 60%, 50%)");

  const ana = await prisma.user.upsert({
    where: { email: "ana@exemplo.com" },
    update: {
      passwordHash: defaultPassword,
      fullName: "Ana Beatriz Santos",
      role: Role.MULHER,
      organizationId: secretariaMulher.id,
      isActive: true,
    },
    create: {
      email: "ana@exemplo.com",
      passwordHash: defaultPassword,
      fullName: "Ana Beatriz Santos",
      role: Role.MULHER,
      organizationId: secretariaMulher.id,
      isActive: true,
    },
  });

  await prisma.womanProfile.upsert({
    where: { userId: ana.id },
    update: {
      socialName: null,
      cpf: "12345678900",
      birthDate: toDate("1990-03-15"),
      phone: "11987654321",
      addressLine: "Rua das Flores, 234, Jd. Primavera",
      city: "Mangaratiba",
      state: "RJ",
    },
    create: {
      userId: ana.id,
      socialName: null,
      cpf: "12345678900",
      birthDate: toDate("1990-03-15"),
      phone: "11987654321",
      addressLine: "Rua das Flores, 234, Jd. Primavera",
      city: "Mangaratiba",
      state: "RJ",
    },
  });

  const carla = await prisma.user.upsert({
    where: { email: "carla@exemplo.com" },
    update: {
      passwordHash: defaultPassword,
      fullName: "Carla Mendes",
      role: Role.PROFISSIONAL,
      organizationId: secretariaMulher.id,
      isActive: true,
    },
    create: {
      email: "carla@exemplo.com",
      passwordHash: defaultPassword,
      fullName: "Carla Mendes",
      role: Role.PROFISSIONAL,
      organizationId: secretariaMulher.id,
      isActive: true,
    },
  });

  await prisma.professionalProfile.upsert({
    where: { userId: carla.id },
    update: {
      organizationId: secretariaMulher.id,
      title: "Assistente social",
      specialties: "Acolhimento inicial",
    },
    create: {
      userId: carla.id,
      organizationId: secretariaMulher.id,
      title: "Assistente social",
      specialties: "Acolhimento inicial",
    },
  });

  const fernanda = await prisma.user.upsert({
    where: { email: "fernanda@exemplo.com" },
    update: {
      passwordHash: defaultPassword,
      fullName: "Fernanda Oliveira",
      role: Role.GESTORA,
      organizationId: secretariaMulher.id,
      isActive: true,
    },
    create: {
      email: "fernanda@exemplo.com",
      passwordHash: defaultPassword,
      fullName: "Fernanda Oliveira",
      role: Role.GESTORA,
      organizationId: secretariaMulher.id,
      isActive: true,
    },
  });

  await prisma.managerProfile.upsert({
    where: { userId: fernanda.id },
    update: {
      organizationId: secretariaMulher.id,
      scope: "municipal",
    },
    create: {
      userId: fernanda.id,
      organizationId: secretariaMulher.id,
      scope: "municipal",
    },
  });

  for (const woman of [
    {
      email: "maria@exemplo.com",
      fullName: "Maria Luisa Ferreira",
      organizationId: delegacia.id,
      socialName: "Malu",
      cpf: "98765432100",
      birthDate: "1985-11-22",
      phone: "11912345678",
      addressLine: "Av. Brasil, 1500, Centro",
    },
    {
      email: "juliana@exemplo.com",
      fullName: "Juliana Costa Ribeiro",
      organizationId: cras.id,
      socialName: null,
      cpf: "45678912300",
      birthDate: "1993-06-08",
      phone: "11976543210",
      addressLine: "Rua Esperanca, 89, Vila Nova",
    },
    {
      email: "patricia@exemplo.com",
      fullName: "Patricia Alves de Souza",
      organizationId: ubs.id,
      socialName: null,
      cpf: "32165498700",
      birthDate: "1978-01-30",
      phone: "11954321098",
      addressLine: "Rua Sao Jorge, 456, Pq. Industrial",
    },
  ]) {
    const user = await prisma.user.upsert({
      where: { email: woman.email },
      update: {
        passwordHash: defaultPassword,
        fullName: woman.fullName,
        role: Role.MULHER,
        organizationId: woman.organizationId,
        isActive: true,
      },
      create: {
        email: woman.email,
        passwordHash: defaultPassword,
        fullName: woman.fullName,
        role: Role.MULHER,
        organizationId: woman.organizationId,
        isActive: true,
      },
    });

    await prisma.womanProfile.upsert({
      where: { userId: user.id },
      update: {
        socialName: woman.socialName,
        cpf: woman.cpf,
        birthDate: toDate(woman.birthDate),
        phone: woman.phone,
        addressLine: woman.addressLine,
        city: "Mangaratiba",
        state: "RJ",
      },
      create: {
        userId: user.id,
        socialName: woman.socialName,
        cpf: woman.cpf,
        birthDate: toDate(woman.birthDate),
        phone: woman.phone,
        addressLine: woman.addressLine,
        city: "Mangaratiba",
        state: "RJ",
      },
    });
  }

  console.log("Contas de teste garantidas com sucesso.");
  console.log("Gestora: fernanda@exemplo.com / Acolhe@123");
  console.log("Profissional: carla@exemplo.com / Acolhe@123");
  console.log("Mulher: ana@exemplo.com / Acolhe@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

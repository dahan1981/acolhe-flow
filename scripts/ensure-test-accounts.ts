import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel ${name} nao configurada.`);
  }

  return value;
}

const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function ensureSupabaseWoman() {
  const email = "ana@exemplo.com";
  const password = "Acolhe@123";
  const metadata = {
    nomeCompleto: "Ana Beatriz Santos",
    nomeSocial: "",
    cpf: "12345678900",
    dataNascimento: "1990-03-15",
    telefone: "11987654321",
    endereco: "Rua das Flores, 234, Jd. Primavera",
    municipio: "Mangaratiba",
    uf: "RJ",
  };

  const existing = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (existing.error) {
    throw existing.error;
  }

  const current = existing.data.users.find((item) => item.email?.toLowerCase() === email);

  if (current) {
    const updated = await supabase.auth.admin.updateUserById(current.id, {
      password,
      email,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (updated.error) {
      throw updated.error;
    }

    return updated.data.user;
  }

  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (created.error || !created.data.user) {
    throw created.error ?? new Error("Nao foi possivel criar a usuaria de teste no Supabase.");
  }

  return created.data.user;
}

async function main() {
  const defaultPasswordHash = await bcrypt.hash("Acolhe@123", 10);
  const organization =
    (await prisma.organization.findUnique({
      where: { code: "sec-mulher" },
    })) ??
    (await prisma.organization.create({
      data: {
        name: "Secretaria da Mulher",
        code: "sec-mulher",
        color: "hsl(224, 71%, 45%)",
      },
    }));

  const supabaseWoman = await ensureSupabaseWoman();

  await prisma.user.upsert({
    where: { email: "ana@exemplo.com" },
    update: {
      fullName: "Ana Beatriz Santos",
      role: Role.MULHER,
      organizationId: organization.id,
      isActive: true,
      supabaseAuthUserId: supabaseWoman.id,
      womanProfile: {
        upsert: {
          create: {
            socialName: null,
            cpf: "12345678900",
            birthDate: new Date("1990-03-15T12:00:00.000Z"),
            phone: "11987654321",
            addressLine: "Rua das Flores, 234, Jd. Primavera",
            city: "Mangaratiba",
            state: "RJ",
          },
          update: {
            socialName: null,
            cpf: "12345678900",
            birthDate: new Date("1990-03-15T12:00:00.000Z"),
            phone: "11987654321",
            addressLine: "Rua das Flores, 234, Jd. Primavera",
            city: "Mangaratiba",
            state: "RJ",
          },
        },
      },
    },
    create: {
      email: "ana@exemplo.com",
      supabaseAuthUserId: supabaseWoman.id,
      passwordHash: defaultPasswordHash,
      fullName: "Ana Beatriz Santos",
      role: Role.MULHER,
      organizationId: organization.id,
      womanProfile: {
        create: {
          socialName: null,
          cpf: "12345678900",
          birthDate: new Date("1990-03-15T12:00:00.000Z"),
          phone: "11987654321",
          addressLine: "Rua das Flores, 234, Jd. Primavera",
          city: "Mangaratiba",
          state: "RJ",
        },
      },
    },
  });

  const professional = await prisma.user.upsert({
    where: { email: "carla@exemplo.com" },
    update: {
      passwordHash: defaultPasswordHash,
      fullName: "Carla Mendes",
      role: Role.PROFISSIONAL,
      organizationId: organization.id,
      isActive: true,
      professionalProfile: {
        upsert: {
          create: {
            organizationId: organization.id,
            title: "Assistente social",
            specialties: "Acolhimento inicial",
          },
          update: {
            organizationId: organization.id,
            title: "Assistente social",
            specialties: "Acolhimento inicial",
          },
        },
      },
    },
    create: {
      email: "carla@exemplo.com",
      passwordHash: defaultPasswordHash,
      fullName: "Carla Mendes",
      role: Role.PROFISSIONAL,
      organizationId: organization.id,
      professionalProfile: {
        create: {
          organizationId: organization.id,
          title: "Assistente social",
          specialties: "Acolhimento inicial",
        },
      },
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "fernanda@exemplo.com" },
    update: {
      passwordHash: defaultPasswordHash,
      fullName: "Fernanda Oliveira",
      role: Role.GESTORA,
      organizationId: organization.id,
      isActive: true,
      managerProfile: {
        upsert: {
          create: {
            organizationId: organization.id,
            scope: "municipal",
          },
          update: {
            organizationId: organization.id,
            scope: "municipal",
          },
        },
      },
    },
    create: {
      email: "fernanda@exemplo.com",
      passwordHash: defaultPasswordHash,
      fullName: "Fernanda Oliveira",
      role: Role.GESTORA,
      organizationId: organization.id,
      managerProfile: {
        create: {
          organizationId: organization.id,
          scope: "municipal",
        },
      },
    },
  });

  console.log(JSON.stringify({
    mulher: "ana@exemplo.com / Acolhe@123",
    profissional: `${professional.email} / Acolhe@123`,
    gestora: `${manager.email} / Acolhe@123`,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

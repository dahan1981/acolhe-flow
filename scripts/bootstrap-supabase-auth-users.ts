import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient, type User } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const TEST_PASSWORD = "Acolhe@123";

type TestAccount = {
  email: string;
  perfil: "mulher" | "profissional" | "gestora";
  nomeCompleto: string;
  metadata?: Record<string, string>;
};

const accounts: TestAccount[] = [
  {
    email: "ana@exemplo.com",
    perfil: "mulher",
    nomeCompleto: "Ana Beatriz Santos",
    metadata: {
      cpf: "12345678900",
      dataNascimento: "1990-03-15",
      telefone: "11987654321",
      endereco: "Rua das Flores, 234, Jd. Primavera",
      municipio: "Mangaratiba",
      uf: "RJ",
    },
  },
  {
    email: "maria@exemplo.com",
    perfil: "mulher",
    nomeCompleto: "Maria Luisa Ferreira",
    metadata: {
      nomeSocial: "Malu",
      cpf: "98765432100",
      dataNascimento: "1985-11-22",
      telefone: "11912345678",
      endereco: "Av. Brasil, 1500, Centro",
      municipio: "Mangaratiba",
      uf: "RJ",
    },
  },
  {
    email: "juliana@exemplo.com",
    perfil: "mulher",
    nomeCompleto: "Juliana Costa Ribeiro",
    metadata: {
      cpf: "45678912300",
      dataNascimento: "1993-06-08",
      telefone: "11976543210",
      endereco: "Rua Esperanca, 89, Vila Nova",
      municipio: "Mangaratiba",
      uf: "RJ",
    },
  },
  {
    email: "patricia@exemplo.com",
    perfil: "mulher",
    nomeCompleto: "Patricia Alves de Souza",
    metadata: {
      cpf: "32165498700",
      dataNascimento: "1978-01-30",
      telefone: "11954321098",
      endereco: "Rua Sao Jorge, 456, Pq. Industrial",
      municipio: "Mangaratiba",
      uf: "RJ",
    },
  },
  {
    email: "carla@exemplo.com",
    perfil: "profissional",
    nomeCompleto: "Carla Mendes",
  },
  {
    email: "fernanda@exemplo.com",
    perfil: "gestora",
    nomeCompleto: "Fernanda Oliveira",
  },
];

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

async function findAuthUserByEmail(email: string) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      return user;
    }

    if (data.users.length < 100) {
      return null;
    }

    page += 1;
  }
}

async function ensureAuthUser(account: TestAccount): Promise<User> {
  const metadata = {
    perfil: account.perfil,
    nomeCompleto: account.nomeCompleto,
    ...(account.metadata ?? {}),
  };
  const existing = await findAuthUserByEmail(account.email);

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      email: account.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error || !data.user) {
      throw error ?? new Error(`Nao foi possivel atualizar ${account.email} no Supabase.`);
    }

    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error || !data.user) {
    throw error ?? new Error(`Nao foi possivel criar ${account.email} no Supabase.`);
  }

  return data.user;
}

async function main() {
  for (const account of accounts) {
    const authUser = await ensureAuthUser(account);

    await prisma.user.update({
      where: { email: account.email },
      data: {
        supabaseAuthUserId: authUser.id,
        isActive: true,
      },
    });

    console.log(`${account.perfil}: ${account.email} vinculado ao Supabase.`);
  }

  console.log(`Senha padrao das contas teste: ${TEST_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

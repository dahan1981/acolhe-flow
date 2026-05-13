const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://cdzhrzchwdwtyalatezb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const accounts = [
  {
    email: "ana@exemplo.com",
    perfil: "mulher",
    nomeCompleto: "Ana Beatriz Santos",
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

async function main() {
  for (const account of accounts) {
    console.log(`Checking ${account.email}...`);
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = listData?.users?.find(u => u.email === account.email);

    if (existing) {
      await supabase.auth.admin.updateUserById(existing.id, {
        password: "Acolhe@123",
        email_confirm: true,
      });
      console.log(`Updated ${account.email}`);
    } else {
      await supabase.auth.admin.createUser({
        email: account.email,
        password: "Acolhe@123",
        email_confirm: true,
      });
      console.log(`Created ${account.email}`);
    }
  }
}

main().catch(console.error);

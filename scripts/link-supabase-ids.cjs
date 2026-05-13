// Script para vincular supabaseAuthUserId dos usuarios do Supabase com o banco local
const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL || "https://cdzhrzchwdwtyalatezb.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  for (const authUser of data.users) {
    if (!authUser.email) continue;
    const result = await prisma.user.updateMany({
      where: { email: authUser.email },
      data: { supabaseAuthUserId: authUser.id, isActive: true },
    });
    if (result.count > 0) {
      console.log(`✅ Vinculado: ${authUser.email} → ${authUser.id}`);
    } else {
      console.log(`⚠️  Não encontrado no banco: ${authUser.email}`);
    }
  }
  console.log("Concluído!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

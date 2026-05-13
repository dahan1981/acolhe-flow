const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Testing login for ana@exemplo.com...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "ana@exemplo.com",
    password: "Acolhe@123",
  });

  if (error) {
    console.error("Login failed:", error.message);
  } else {
    console.log("Login succeeded! Access token:", data.session?.access_token.substring(0, 20) + "...");
  }
}

main().catch(console.error);

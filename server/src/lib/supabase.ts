import { createClient } from "@supabase/supabase-js";
import { AppError } from "./errors.js";
import { config, hasSupabaseServerConfig } from "../config.js";

export const supabaseAdmin = hasSupabaseServerConfig
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new AppError(500, "A integração com o Supabase ainda não foi configurada neste ambiente.");
  }

  return supabaseAdmin;
}

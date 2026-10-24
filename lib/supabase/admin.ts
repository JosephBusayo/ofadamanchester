import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client: bypasses RLS. Server-only — used to write orders and read them
 * back for the confirmation page. Returns null when Supabase isn't configured.
 */
export function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

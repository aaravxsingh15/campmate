/**
 * Central place to read environment configuration.
 * The app is designed to boot with NOTHING configured (demo mode only),
 * and to progressively unlock features as credentials are supplied.
 */

export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  // Supabase renamed anon -> "publishable" (sb_publishable_…). Accept either name.
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "",
  // …and service_role -> "secret" (sb_secret_…).
  supabaseServiceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    "",
  supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "documents",

  databaseUrl: process.env.DATABASE_URL ?? "",

  aiApiKey: process.env.AI_API_KEY ?? "",
  aiModel: process.env.AI_MODEL ?? "",
  aiBaseUrl: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
  aiEmbeddingModel: process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small",
};

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseAnonKey,
);

export const isDatabaseConfigured = Boolean(env.databaseUrl);

export const isAIConfigured = Boolean(env.aiApiKey && env.aiModel);

/** True when the app can do real (non-demo) user accounts + persistence. */
export const isLiveMode = isSupabaseConfigured && isDatabaseConfigured;

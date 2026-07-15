import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ALLOWED_USER_EMAIL: z.string().email(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ALLOWED_USER_EMAIL: process.env.ALLOWED_USER_EMAIL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}

export function getClientEnv() {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

const googleEnvSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),
});

const encryptionEnvSchema = z.object({
  ENCRYPTION_KEY: z
    .string()
    .refine(
      (value) => Buffer.from(value, "base64").length === 32,
      "ENCRYPTION_KEY must be a base64-encoded 32-byte key (openssl rand -base64 32).",
    ),
});

const webPushEnvSchema = z.object({
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_SUBJECT: z.string().min(1),
});

const cronEnvSchema = z.object({
  CRON_SECRET: z.string().min(16),
});

const canvasEnvSchema = z.object({
  CANVAS_BASE_URL: z.string().url(),
  CANVAS_PERSONAL_ACCESS_TOKEN: z.string().min(1),
});

/**
 * Gmail (Phase 7) uses its own registered Google OAuth client — a separate
 * client ID/secret from Calendar's, not just a different account — plus its
 * own redirect URI since it's a separate callback route.
 */
const gmailEnvSchema = z.object({
  GMAIL_CLIENT_ID: z.string().min(1),
  GMAIL_CLIENT_SECRET: z.string().min(1),
  GMAIL_REDIRECT_URI: z.string().url(),
});

/** Throws with a clear message if Google OAuth isn't configured — call only from Google-integration code paths. */
export function getGoogleEnv() {
  return googleEnvSchema.parse({
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  });
}

/** Throws if ENCRYPTION_KEY is missing/malformed — call only from code paths that touch oauth_tokens. */
export function getEncryptionEnv() {
  return encryptionEnvSchema.parse({
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  });
}

/** Throws if VAPID keys aren't configured — call only from web-push send/subscribe code paths. */
export function getWebPushEnv() {
  return webPushEnvSchema.parse({
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  });
}

/** Throws if CRON_SECRET isn't configured — call only from /api/cron/* route handlers. */
export function getCronEnv() {
  return cronEnvSchema.parse({
    CRON_SECRET: process.env.CRON_SECRET,
  });
}

/** Throws if Canvas isn't configured — call only from Canvas-integration code paths. */
export function getCanvasEnv() {
  return canvasEnvSchema.parse({
    CANVAS_BASE_URL: process.env.CANVAS_BASE_URL,
    CANVAS_PERSONAL_ACCESS_TOKEN: process.env.CANVAS_PERSONAL_ACCESS_TOKEN,
  });
}

/** True if Canvas env vars are present, without throwing — call from paths that should degrade gracefully. */
export function isCanvasConfigured(): boolean {
  return canvasEnvSchema.safeParse({
    CANVAS_BASE_URL: process.env.CANVAS_BASE_URL,
    CANVAS_PERSONAL_ACCESS_TOKEN: process.env.CANVAS_PERSONAL_ACCESS_TOKEN,
  }).success;
}

/** Throws if Gmail OAuth isn't configured — call only from Gmail-integration code paths. */
export function getGmailEnv() {
  return gmailEnvSchema.parse({
    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI: process.env.GMAIL_REDIRECT_URI,
  });
}

/** True if Gmail env vars are present, without throwing — call from paths (e.g. cron) that should degrade gracefully. */
export function isGmailConfigured(): boolean {
  return gmailEnvSchema.safeParse({
    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI: process.env.GMAIL_REDIRECT_URI,
  }).success;
}

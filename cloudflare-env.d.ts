declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    RESEND_API_KEY?: string;
    BETTER_AUTH_SECRET?: string;
    PERSONAL_ACCOUNTS_ENABLED?: string;
    ACCOUNT_BASE_URL?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
  }
}

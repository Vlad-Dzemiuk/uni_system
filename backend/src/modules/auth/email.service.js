import { env } from "../../config/env.js";

export async function sendVerifyEmail({ email, token }) {
  const link = `${env.APP_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`;

  if (env.EMAIL_MODE === "log") {
    console.log(`[DEV_VERIFY_EMAIL] to=${email} link=${link}`);
    return { link };
  }

  throw new Error("EMAIL provider not configured");
}

import crypto from "crypto";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../users/user.model.js";
import { sendVerifyEmail } from "./email.service.js";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; 

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function createJwtForUser(user) {
  return jwt.sign(
    {
      role: user.role,
      email: user.email,
    },
    env.JWT_SECRET,
    {
      subject: String(user._id),
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );
}

export async function register({
  email,
  password,
  fullName,
  role,
  privacyPolicyAccepted,
  privacyPolicyVersion,
}) {
  const normalizedEmail = String(email).toLowerCase().trim();

  const exists = await User.findOne({ email: normalizedEmail }).lean();
  if (exists) throw new ApiError(409, "Email already in use");

  const user = new User({
    email: normalizedEmail,
    fullName: String(fullName).trim(),
    role,
    privacyPolicy: {
      acceptedAt: privacyPolicyAccepted ? new Date() : undefined,
      version: privacyPolicyVersion || "1.0",
    },
    providers: ["local"],
    isActive: true,
  });

  await user.setPassword(password);

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.emailVerification = {
    tokenHash: sha256(rawToken),
    expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
    sentAt: new Date(),
    verifiedAt: undefined,
  };

  await user.save();

  const sent = await sendVerifyEmail({ email: user.email, token: rawToken });

  return {
   message: "Registration successful. Please verify your email.",
   next: "VERIFY_EMAIL",
   ...(env.NODE_ENV !== "production" && sent?.link ? { debug: { verifyLink: sent.link } } : {}),
  };
}

export async function login({ email, password }) {
  const normalizedEmail = String(email).toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user) throw new ApiError(401, "Invalid email or password");

  if (user.isActive === false) throw new ApiError(403, "Account disabled");

  const ok = await user.verifyPassword(password);
  if (!ok) throw new ApiError(401, "Invalid email or password");

  const verified = Boolean(user.emailVerification?.verifiedAt);
  if (!verified) {
    throw new ApiError(403, "Email is not verified", { next: "VERIFY_EMAIL" });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = createJwtForUser(user);

  return {
    message: "Login successful",
    token,
    user: {
      id: String(user._id),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      emailVerified: true,
    },
  };
}

export async function verifyEmail({ token }) {
  const tokenHash = sha256(String(token));

  const user = await User.findOne({
    "emailVerification.tokenHash": tokenHash,
    "emailVerification.expiresAt": { $gt: new Date() },
  });

  if (!user) throw new ApiError(400, "Invalid or expired verification token");

  user.markEmailVerified();
  await user.save();

  return { message: "Email verified successfully. You can login now." };
}

export async function resendVerificationEmail({ email }) {
  const normalizedEmail = String(email).toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return { message: "If the email exists, a verification message has been sent." };
  }

  if (user.emailVerification?.verifiedAt) {
    return { message: "Email already verified." };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.emailVerification = {
    tokenHash: sha256(rawToken),
    expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
    sentAt: new Date(),
    verifiedAt: undefined,
  };

  await user.save();
  const sent = await sendVerifyEmail({ email: user.email, token: rawToken });

  return {
    message: "Verification email sent.",
    ...(env.NODE_ENV !== "production" && sent?.link ? { debug: { verifyLink: sent.link } } : {}),
  };
}

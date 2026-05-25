import crypto from "crypto";
import jwt from "jsonwebtoken";

import { OAuth2Client } from "google-auth-library";

import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../users/user.model.js";
import { sendVerifyEmail } from "./email.service.js";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; 
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
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



function assertCorporateEmail(payload) {
  const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || "oa.edu.ua").toLowerCase();

  const email = String(payload?.email || "").toLowerCase();
  if (!email) throw httpError(401, "Google token payload has no email");

  const domain = email.split("@")[1] || "";
  if (domain !== allowedDomain) {
    throw httpError(403, `Only corporate accounts @${allowedDomain} are allowed`);
  }

  if (payload?.hd && String(payload.hd).toLowerCase() !== allowedDomain) {
    throw httpError(403, `Hosted domain must be ${allowedDomain}`);
  }
}

export async function googleLoginWithCredential(idToken) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID is not set");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) throw httpError(401, "Invalid Google token");

  if (!payload.email_verified) {
    throw httpError(403, "Google email is not verified");
  }

  assertCorporateEmail(payload);

  const email = String(payload.email).toLowerCase().trim();
  const googleId = String(payload.sub);
  const fullName = String(payload.name || email.split("@")[0] || "User").trim();
  const picture = payload.picture ? String(payload.picture) : undefined;

  let user = await User.findOne({
    $or: [{ "google.id": googleId }, { email }],
  });

  const now = new Date();

  if (!user) {
    user = await User.create({
      email,
      fullName,
      role: "Student",
      google: {
        id: googleId,
        email,
        picture,
        linkedAt: now,
      },
      emailVerification: {
        verifiedAt: now,
      },
      lastLoginAt: now,
      isActive: true,
    });
  } else {
    if (user.isActive === false) throw httpError(403, "Account is inactive");
    if (user.blockedAt) throw httpError(403, "Account is blocked");

    user.email = email;
    if (!user.fullName || user.fullName.length < 3) user.fullName = fullName;

    user.google = user.google || {};
    user.google.id = user.google.id || googleId;
    user.google.email = email;
    if (picture) user.google.picture = picture;
    user.google.linkedAt = user.google.linkedAt || now;

    user.emailVerification = user.emailVerification || {};
    user.emailVerification.verifiedAt = user.emailVerification.verifiedAt || now;

    user.lastLoginAt = now;

    await user.save();
  }

  const token = signAccessToken(user);

  return {
    token,
    user, 
  };
}


function getOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI");
  }
  return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

export function buildGoogleAuthUrl() {
  const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || "oa.edu.ua").toLowerCase();
  const state = crypto.randomBytes(16).toString("hex");

  const client = getOAuthClient();
  const url = client.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    hd: allowedDomain,
    state,
  });

  return { url, state };
}

function signAccessToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign(
    { sub: String(user._id), email: user.email, role: user.role },
    secret,
    { expiresIn }
  );
}

function assertCorporate(payload) {
  const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || "oa.edu.ua").toLowerCase();

  const email = String(payload?.email || "").toLowerCase();
  if (!email) throw httpError(401, "Google payload has no email");
  if (!payload?.email_verified) throw httpError(403, "Google email is not verified");

  const domain = email.split("@")[1] || "";
  if (domain !== allowedDomain) throw httpError(403, `Only @${allowedDomain} allowed`);

  if (payload?.hd && String(payload.hd).toLowerCase() !== allowedDomain) {
    throw httpError(403, `Hosted domain must be ${allowedDomain}`);
  }

  return email;
}

function getBootstrapRole(email) {
  const list = (process.env.BOOTSTRAP_ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (list.includes(email)) return "Admin";
  return "Student";
}

export async function googleLoginWithCode(code) {
  const client = getOAuthClient();

  const { tokens } = await client.getToken(String(code));
  if (!tokens?.id_token) throw httpError(401, "No id_token from Google");

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) throw httpError(401, "Invalid Google token");

  const email = assertCorporate(payload);
  const googleId = String(payload.sub);
  const fullName = String(payload.name || email.split("@")[0] || "User").trim();
  const picture = payload.picture ? String(payload.picture) : undefined;

  let user = await User.findOne({ $or: [{ "google.id": googleId }, { email }] });

  const now = new Date();

  if (!user) {
    user = await User.create({
      email,
      fullName,
      role: getBootstrapRole(email), 
      google: { id: googleId, email, picture, linkedAt: now },
      emailVerification: { verifiedAt: now },
      lastLoginAt: now,
      isActive: true,
    });
  } else {
    user.google = user.google || {};
    user.google.id = user.google.id || googleId;
    user.google.email = email;
    if (picture) user.google.picture = picture;
    user.google.linkedAt = user.google.linkedAt || now;

    user.emailVerification = user.emailVerification || {};
    user.emailVerification.verifiedAt = user.emailVerification.verifiedAt || now;

    user.lastLoginAt = now;
    await user.save();
  }

  const token = signAccessToken(user);
  return { token, user: user.toJSON() };
}
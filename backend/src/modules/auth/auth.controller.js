import { asyncHandler } from "../../utils/asyncHandler.js";
import * as authService from "./auth.service.js";
import { User } from "../users/user.model.js";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "access_token";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, role, privacyPolicyAccepted, privacyPolicyVersion } =
    req.validated.body;

  const out = await authService.register({
    email,
    password,
    fullName,
    role,
    privacyPolicyAccepted,
    privacyPolicyVersion,
  });

  res.status(201).json(out);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const out = await authService.login({ email, password });
  res.json(out);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.validated.body;
  const out = await authService.verifyEmail({ token });
  res.json(out);
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.validated.body;
  const out = await authService.resendVerificationEmail({ email });
  res.json(out);
});

export const me = asyncHandler(async (req, res) => {

  return res.json( req.user );
  
});

export const logout = asyncHandler(async (req, res) => {
  res.json({ ok: true, message: "Вихід виконано" });
});

export async function googleStart(req, res, next) {
  try {
    const { url, state } = authService.buildGoogleAuthUrl();

    res.cookie("g_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
      path: "/",
    });

    return res.redirect(url);
  } catch (e) {
    next(e);
  }
}

export async function googleCallback(req, res, next) {
  try {
    const FRONT_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
    const { code, state } = req.query

    if (!code) return res.status(400).send('Відсутній код авторизації')
    if (!state) return res.status(400).send('Відсутній параметр стану')

    const cookieState = req.cookies?.g_state
    if (!cookieState || cookieState !== state) return res.status(400).send('Некоректний параметр стану')

    const redirectTo = req.cookies?.g_redirect || `${FRONT_URL}/login`

    res.clearCookie('g_state', { path: '/' })
    res.clearCookie('g_redirect', { path: '/' })

    const { token } = await authService.googleLoginWithCode(String(code))

    res.cookie(COOKIE_NAME, token, cookieOptions())

    return res.redirect(302, redirectTo)
  } catch (e) {
    next(e)
  }
}

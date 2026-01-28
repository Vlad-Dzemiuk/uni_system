import { asyncHandler } from "../../utils/asyncHandler.js";
import * as authService from "./auth.service.js";

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
  res.json({ user: req.user });
});

export const logout = asyncHandler(async (req, res) => {
  res.json({ ok: true, message: "Logged out (client should remove token)" });
});

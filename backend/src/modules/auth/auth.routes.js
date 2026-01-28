import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/auth.js";
import * as ctrl from "./auth.controller.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerifyEmailSchema,
} from "./auth.validation.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), ctrl.register);
authRouter.post("/login", validate(loginSchema), ctrl.login);

authRouter.post("/email/verify", validate(verifyEmailSchema), ctrl.verifyEmail);
authRouter.post("/email/resend", validate(resendVerifyEmailSchema), ctrl.resendVerificationEmail);

authRouter.get("/me", authenticate(), ctrl.me);

authRouter.post("/logout", authenticate(), ctrl.logout);

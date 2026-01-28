import { Router } from "express";
import { usersRouter } from "../modules/users/user.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/users", usersRouter);

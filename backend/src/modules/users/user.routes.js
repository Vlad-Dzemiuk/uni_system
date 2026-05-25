import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./user.controller.js";
import {
  createUserSchema,
  deleteUserSchema,
  listUsersSchema,
  updateUserSchema,
} from "./user.validation.js";

export const usersRouter = Router();

usersRouter.use(authenticate(), requireRoles("Admin"));

usersRouter.get("/", validate(listUsersSchema), ctrl.list);
usersRouter.post("/", validate(createUserSchema), ctrl.create);
usersRouter.patch("/:userId", validate(updateUserSchema), ctrl.update);
usersRouter.delete("/:userId", validate(deleteUserSchema), ctrl.remove);

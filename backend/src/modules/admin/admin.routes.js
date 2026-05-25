import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { requireRoles } from "../../middlewares/authorize.js";

import * as ctrl from "./admin.controller.js";
import { assignDeanSchema, unassignDeanSchema } from "./admin.validation.js";

export const adminRouter = Router();

adminRouter.use(authenticate());

adminRouter.post(
  "/assign-dean",
  requireRoles("Admin"),
  validate(assignDeanSchema),
  ctrl.assignDean
);

adminRouter.delete(
  "/deans/:facultyId",
  requireRoles("Admin"),
  validate(unassignDeanSchema),
  ctrl.unassignDean
);

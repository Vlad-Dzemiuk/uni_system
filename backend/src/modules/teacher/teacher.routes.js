import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";

import * as ctrl from "./teacher.controller.js";
import { createRequestSchema, updateMyRequestSchema } from "../admission/admission.validation.js";

export const teacherRouter = Router();

teacherRouter.use(authenticate());
teacherRouter.use(requireRoles("Teacher"));

teacherRouter.get("/certificates/available", ctrl.listAvailableCertificateTypes);
teacherRouter.get("/certificates/requests", ctrl.listMyCertificateRequests);
teacherRouter.get("/certificates/requests/:id", ctrl.getMyCertificateRequest);

teacherRouter.post("/certificates/requests", validate(createRequestSchema), ctrl.createMyCertificateRequest);
teacherRouter.patch("/certificates/requests/:id", validate(updateMyRequestSchema), ctrl.updateMyCertificateRequest);

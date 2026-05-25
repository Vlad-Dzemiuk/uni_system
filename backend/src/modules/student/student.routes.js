import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";

import * as ctrl from "./student.controller.js";
import { createRequestSchema, updateMyRequestSchema } from "../admission/admission.validation.js";

export const studentRouter = Router();

studentRouter.use(authenticate());
studentRouter.use(requireRoles("Student"));

studentRouter.get("/certificates/available", ctrl.listAvailableCertificateTypes);

studentRouter.get("/certificates/requests", ctrl.listMyCertificateRequests);

studentRouter.get("/certificates/requests/:id", ctrl.getMyCertificateRequest);

studentRouter.post("/certificates/requests", validate(createRequestSchema), ctrl.createMyCertificateRequest);

studentRouter.patch("/certificates/requests/:id", validate(updateMyRequestSchema), ctrl.updateMyCertificateRequest);

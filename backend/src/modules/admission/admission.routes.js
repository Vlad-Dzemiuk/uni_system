import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { requireRoles } from "../../middlewares/authorize.js";

import * as ctrl from "./admission.controller.js";
import {
  createFacultySchema,
  updateFacultySchema,
  createCertificateTypeSchema,
  updateCertificateTypeSchema,
  listRequestsSchema,
  updateRequestStatusSchema,
  getScopedFacultySchema,
  listFacultyMembersSchema,
  listFacultyCandidatesSchema,
  attachFacultyMemberSchema,
  updateFacultyMemberSchema,
} from "./admission.validation.js";

export const admissionRouter = Router();

admissionRouter.use(authenticate());

// FACULTIES (Admin/Dean)
admissionRouter.get("/faculties", requireRoles("Dean", "Admin"), ctrl.listFaculties);
admissionRouter.post("/faculties", requireRoles("Admin"), validate(createFacultySchema), ctrl.createFaculty);
admissionRouter.patch("/faculties/:id", requireRoles("Admin"), validate(updateFacultySchema), ctrl.updateFaculty);
admissionRouter.delete("/faculties/:id", requireRoles("Admin"), validate(updateFacultySchema), ctrl.deleteFaculty);

admissionRouter.get(
  "/faculty/me",
  requireRoles("Dean", "Admin"),
  validate(getScopedFacultySchema),
  ctrl.getMyFaculty
);

admissionRouter.get(
  "/faculty/members",
  requireRoles("Dean", "Admin"),
  validate(listFacultyMembersSchema),
  ctrl.listFacultyMembers
);

admissionRouter.get(
  "/faculty/candidates",
  requireRoles("Dean", "Admin"),
  validate(listFacultyCandidatesSchema),
  ctrl.listFacultyCandidates
);

admissionRouter.post(
  "/faculty/members/attach",
  requireRoles("Dean", "Admin"),
  validate(attachFacultyMemberSchema),
  ctrl.attachFacultyMember
);

admissionRouter.patch(
  "/faculty/members/:userId",
  requireRoles("Dean", "Admin"),
  validate(updateFacultyMemberSchema),
  ctrl.updateFacultyMember
);

// CERTIFICATE TYPES (Dean/Admin)
admissionRouter.get("/certificate-types", requireRoles("Dean", "Admin"), ctrl.listMyFacultyCertificateTypes);
admissionRouter.get("/certificate-types/:id", requireRoles("Dean", "Admin"), ctrl.getCertificateType);

admissionRouter.post(
  "/certificate-types",
  requireRoles("Dean", "Admin"),
  validate(createCertificateTypeSchema),
  ctrl.createCertificateType
);
admissionRouter.patch(
  "/certificate-types/:id",
  requireRoles("Dean", "Admin"),
  validate(updateCertificateTypeSchema),
  ctrl.updateCertificateType
);
admissionRouter.delete(
  "/certificate-types/:id",
  requireRoles("Dean", "Admin"),
  validate(updateCertificateTypeSchema),
  ctrl.deleteCertificateType
);

// REQUESTS (Dean/Admin)
admissionRouter.get(
  "/analytics/overview",
  requireRoles("Dean", "Admin"),
  validate(getScopedFacultySchema),
  ctrl.getFacultyAnalytics
);

admissionRouter.get(
  "/requests",
  requireRoles("Dean", "Admin"),
  validate(listRequestsSchema),
  ctrl.listRequests
);

admissionRouter.get(
  "/requests/:id",
  requireRoles("Dean", "Admin"),
  ctrl.getRequestDetails
);

admissionRouter.patch(
  "/requests/:id/status",
  requireRoles("Dean", "Admin"),
  validate(updateRequestStatusSchema),
  ctrl.updateRequestStatus
);

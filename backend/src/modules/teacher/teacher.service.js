import { CertificateType } from "../admission/certificateType.model.js";
import { CertificateRequest } from "../admission/certificateRequest.model.js";
import * as admissionSvc from "../admission/admission.service.js";
import {
  SPECIAL_PURPOSE_REQUEST_DESCRIPTION,
  SPECIAL_PURPOSE_REQUEST_FIELDS,
  SPECIAL_PURPOSE_REQUEST_ID,
  SPECIAL_PURPOSE_REQUEST_TITLE,
} from "../admission/constants.js";

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function requireFaculty(user) {
  if (!user?.faculty) {
    throw httpError(
      403,
      "До вашого облікового запису ще не прив’язано факультет. Зверніться до деканату."
    );
  }
  return String(user.faculty);
}

export async function listAvailableCertificateTypes(user) {
  if (user.role !== "Teacher") throw httpError(403, "Недостатньо прав");

  const facultyId = requireFaculty(user);

  const items = await CertificateType.find({
    faculty: facultyId,
    isActive: true,
    audience: { $in: ["teacher", "all"] },
  })
    .sort({ title: 1 })
    .lean();

  return [
    ...items,
    {
      _id: SPECIAL_PURPOSE_REQUEST_ID,
      title: SPECIAL_PURPOSE_REQUEST_TITLE,
      description: SPECIAL_PURPOSE_REQUEST_DESCRIPTION,
      isActive: true,
      audience: "all",
      fields: SPECIAL_PURPOSE_REQUEST_FIELDS,
      isSpecialPurpose: true,
    },
  ];
}

export async function listMyCertificateRequests(user) {
  if (user.role !== "Teacher") throw httpError(403, "Недостатньо прав");
  requireFaculty(user);

  return CertificateRequest.find({ requester: user._id })
    .populate("type", "title audience")
    .sort({ submittedAt: -1 })
    .lean();
}

export async function getMyCertificateRequest(user, requestId) {
  if (user.role !== "Teacher") throw httpError(403, "Недостатньо прав");
  requireFaculty(user);

  return admissionSvc.getRequest(user, requestId);
}

export async function createMyCertificateRequest(user, dto) {
  if (user.role !== "Teacher") throw httpError(403, "Недостатньо прав");
  requireFaculty(user);

  return admissionSvc.createRequest(user, dto);
}

export async function updateMyCertificateRequest(user, requestId, dto) {
  if (user.role !== "Teacher") throw httpError(403, "Недостатньо прав");
  requireFaculty(user);

  return admissionSvc.updateMyRequest(user, requestId, dto);
}

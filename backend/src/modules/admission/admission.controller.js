import * as svc from "./admission.service.js";

export async function createFaculty(req, res, next) {
  try {
    const fac = await svc.createFaculty(req.user, req.body);
    res.status(201).json(fac);
  } catch (e) { next(e); }
}

export async function updateFaculty(req, res, next) {
  try {
    const fac = await svc.updateFaculty(req.user, req.params.id, req.body);
    res.json(fac);
  } catch (e) { next(e); }
}

export async function deleteFaculty(req, res, next) {
  try {
    const out = await svc.deleteFaculty(req.user, req.params.id);
    res.json(out);
  } catch (e) { next(e); }
}

export async function listFaculties(req, res, next) {
  try {
    const items = await svc.listFaculties(req.user);
    res.json(items);
  } catch (e) { next(e); }
}

export async function getMyFaculty(req, res, next) {
  try {
    const item = await svc.getMyFaculty(req.user, req.query?.facultyId);
    res.json(item);
  } catch (e) { next(e); }
}

export async function listFacultyMembers(req, res, next) {
  try {
    const out = await svc.listFacultyMembers(req.user, req.query || {});
    res.json(out);
  } catch (e) { next(e); }
}

export async function listFacultyCandidates(req, res, next) {
  try {
    const out = await svc.listFacultyCandidates(req.user, req.query || {});
    res.json(out);
  } catch (e) { next(e); }
}

export async function attachFacultyMember(req, res, next) {
  try {
    const item = await svc.attachFacultyMember(req.user, req.body || {}, req.query?.facultyId);
    res.json(item);
  } catch (e) { next(e); }
}

export async function updateFacultyMember(req, res, next) {
  try {
    const item = await svc.updateFacultyMember(
      req.user,
      req.params.userId,
      req.body || {},
      req.query?.facultyId
    );
    res.json(item);
  } catch (e) { next(e); }
}

export async function createCertificateType(req, res, next) {
  try {
    const item = await svc.createCertificateType(req.user, req.body);
    res.status(201).json(item);
  } catch (e) { next(e); }
}

export async function updateCertificateType(req, res, next) {
  try {
    const item = await svc.updateCertificateType(req.user, req.params.id, req.body);
    res.json(item);
  } catch (e) { next(e); }
}

export async function deleteCertificateType(req, res, next) {
  try {
    const out = await svc.deleteCertificateType(req.user, req.params.id);
    res.json(out);
  } catch (e) { next(e); }
}

export async function listMyFacultyCertificateTypes(req, res, next) {
  try {
    const items = await svc.listMyFacultyCertificateTypes(req.user);
    res.json(items);
  } catch (e) { next(e); }
}

export async function getCertificateType(req, res, next) {
  try {
    const item = await svc.getCertificateType(req.user, req.params.id);
    res.json(item);
  } catch (e) { next(e); }
}

export async function createRequest(req, res, next) {
  try {
    const item = await svc.createRequest(req.user, req.body);
    res.status(201).json(item);
  } catch (e) { next(e); }
}

export async function listMyRequests(req, res, next) {
  try {
    const items = await svc.listMyRequests(req.user);
    res.json(items);
  } catch (e) { next(e); }
}

export async function getRequest(req, res, next) {
  try {
    const item = await svc.getRequest(req.user, req.params.id);
    res.json(item);
  } catch (e) { next(e); }
}

export async function updateMyRequest(req, res, next) {
  try {
    const item = await svc.updateMyRequest(req.user, req.params.id, req.body);
    res.json(item);
  } catch (e) { next(e); }
}

export async function listFacultyRequests(req, res, next) {
  try {
    const out = await svc.listFacultyRequests(req.user, req.query);
    res.json(out);
  } catch (e) { next(e); }
}

export async function updateRequestStatus(req, res, next) {
  try {
    const data = await svc.updateRequestStatus(req.user, req.params.id, req.body, req.query?.facultyId);
    res.json(data);
  } catch (e) { next(e); }
}

export async function listRequests(req, res, next) {
  try {
    const data = await svc.listRequests(req.user, req.query || {});
    res.json(data);
  } catch (e) { next(e); }
}

export async function getFacultyAnalytics(req, res, next) {
  try {
    const data = await svc.getFacultyAnalytics(req.user, req.query?.facultyId);
    res.json(data);
  } catch (e) { next(e); }
}
export async function getRequestDetails(req, res, next) {
  try {
    const data = await svc.getRequestForAdmission(req.user, req.params.id, req.query?.facultyId);
    res.json(data);
  } catch (e) { next(e); }
}

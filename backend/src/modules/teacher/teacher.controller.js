import * as svc from "./teacher.service.js";

export async function listAvailableCertificateTypes(req, res, next) {
  try { res.json(await svc.listAvailableCertificateTypes(req.user)); }
  catch (e) { next(e); }
}

export async function listMyCertificateRequests(req, res, next) {
  try { res.json(await svc.listMyCertificateRequests(req.user)); }
  catch (e) { next(e); }
}

export async function getMyCertificateRequest(req, res, next) {
  try { res.json(await svc.getMyCertificateRequest(req.user, req.params.id)); }
  catch (e) { next(e); }
}

export async function createMyCertificateRequest(req, res, next) {
  try { res.status(201).json(await svc.createMyCertificateRequest(req.user, req.body)); }
  catch (e) { next(e); }
}

export async function updateMyCertificateRequest(req, res, next) {
  try { res.json(await svc.updateMyCertificateRequest(req.user, req.params.id, req.body)); }
  catch (e) { next(e); }
}

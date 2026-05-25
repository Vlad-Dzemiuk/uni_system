import * as svc from "./student.service.js";

export async function listAvailableCertificateTypes(req, res, next) {
  try {
    const items = await svc.listAvailableCertificateTypes(req.user);
    res.json(items);
  } catch (e) { next(e); }
}

export async function listMyCertificateRequests(req, res, next) {
  try {
    const items = await svc.listMyCertificateRequests(req.user);
    res.json(items);
  } catch (e) { next(e); }
}

export async function getMyCertificateRequest(req, res, next) {
  try {
    const item = await svc.getMyCertificateRequest(req.user, req.params.id);
    res.json(item);
  } catch (e) { next(e); }
}

export async function createMyCertificateRequest(req, res, next) {
  try {
    const item = await svc.createMyCertificateRequest(req.user, req.body);
    res.status(201).json(item);
  } catch (e) { next(e); }
}

export async function updateMyCertificateRequest(req, res, next) {
  try {
    const item = await svc.updateMyCertificateRequest(req.user, req.params.id, req.body);
    res.json(item);
  } catch (e) { next(e); }
}

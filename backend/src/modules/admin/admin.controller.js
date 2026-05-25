import * as adminService from "./admin.service.js";

export async function assignDean(req, res, next) {
  try {
    const result = await adminService.assignDean(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function unassignDean(req, res, next) {
  try {
    const result = await adminService.unassignDean(req.params.facultyId);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

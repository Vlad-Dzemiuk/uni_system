import * as svc from "./notification.service.js";

export async function listMyNotifications(req, res, next) {
  try {
    const data = await svc.listMyNotifications(req.user, req.query || {});
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const data = await svc.markNotificationRead(req.user, req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    const data = await svc.markAllNotificationsRead(req.user);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

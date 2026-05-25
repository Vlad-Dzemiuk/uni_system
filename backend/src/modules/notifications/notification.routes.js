import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import * as ctrl from "./notification.controller.js";

export const notificationRouter = Router();

notificationRouter.use(authenticate());

notificationRouter.get("/", ctrl.listMyNotifications);
notificationRouter.patch("/read-all", ctrl.markAllNotificationsRead);
notificationRouter.patch("/:id/read", ctrl.markNotificationRead);

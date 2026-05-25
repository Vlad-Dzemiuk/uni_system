import { Router } from "express";
import { usersRouter } from "../modules/users/user.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";

import { admissionRouter } from "../modules/admission/admission.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";

import { studentRouter } from "../modules/student/student.routes.js";
import { teacherRouter } from "../modules/teacher/teacher.routes.js";
import { notificationRouter } from "../modules/notifications/notification.routes.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/users", usersRouter);

router.use("/admin", adminRouter);
router.use("/admission", admissionRouter);

router.use("/student", studentRouter);
router.use("/teacher", teacherRouter);
router.use("/notifications", notificationRouter);


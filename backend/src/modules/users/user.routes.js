import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as ctrl from './user.controller.js';
import { createUserSchema } from './user.validation.js';

export const usersRouter = Router();

usersRouter.get('/', ctrl.list);
usersRouter.post('/', validate(createUserSchema), ctrl.create);

import { asyncHandler } from '../../utils/asyncHandler.js';
import * as usersService from './user.service.js';

export const create = asyncHandler(async (req, res) => {
  const { email, name } = req.validated.body;
  const user = await usersService.createUser({ email, name });
  res.status(201).json({ user });
});

export const list = asyncHandler(async (req, res) => {
  const users = await usersService.listUsers();
  res.json({ users });
});

import { asyncHandler } from "../../utils/asyncHandler.js";
import * as usersService from "./user.service.js";

export const create = asyncHandler(async (req, res) => {
  const user = await usersService.createUser(req.validated.body);
  res.status(201).json({ user });
});

export const list = asyncHandler(async (req, res) => {
  const users = await usersService.listUsers(req.validated.query || {});
  res.json(users);
});

export const update = asyncHandler(async (req, res) => {
  const user = await usersService.updateUser(req.user, req.validated.params.userId, req.validated.body);
  res.json({ user });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await usersService.deleteUser(req.user, req.validated.params.userId);
  res.json(result);
});

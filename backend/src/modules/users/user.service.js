import { User } from './user.model.js';
import { ApiError } from '../../utils/ApiError.js';

export async function createUser({ email, name }) {
  const exists = await User.findOne({ email }).lean();
  if (exists) throw new ApiError(409, 'User already exists');

  const doc = await User.create({ email, name });
  return doc.toObject();
}

export async function listUsers() {
  return User.find().sort({ createdAt: -1 }).lean();
}

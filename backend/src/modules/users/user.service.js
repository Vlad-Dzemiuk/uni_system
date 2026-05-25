import { User } from "./user.model.js";
import { Faculty } from "../admission/faculty.model.js";
import { ApiError } from "../../utils/ApiError.js";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeEmail(value) {
  return String(value).toLowerCase().trim();
}

function normalizeOptionalString(value) {
  if (value === undefined) return undefined;
  const normalized = value === null ? "" : String(value).trim();
  return normalized || undefined;
}

function normalizeDisciplines(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function parseOptionalDate(value, label) {
  if (value === undefined) return undefined;
  if (value === null || String(value).trim() === "") return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `${label} must be a valid date`);
  }

  return date;
}

async function ensureFacultyExists(facultyId) {
  if (!facultyId) return null;

  const faculty = await Faculty.findById(facultyId);
  if (!faculty) throw new ApiError(404, "Faculty not found");
  return faculty;
}

async function clearDeanAssignment(userId) {
  const faculty = await Faculty.findOne({ deanUser: userId });
  if (!faculty) return null;

  faculty.deanUser = undefined;
  await faculty.save();
  return faculty;
}

async function mapUserById(userId) {
  return User.findById(userId)
    .populate("faculty", "code name slug")
    .lean();
}

export async function createUser(dto) {
  const email = normalizeEmail(dto.email);
  const exists = await User.findOne({ email }).lean();
  if (exists) throw new ApiError(409, "User already exists");
  if (dto.role === "Dean") {
    throw new ApiError(400, "Create a teacher first, then assign that user as dean");
  }

  const faculty = dto.role === "Admin" ? null : await ensureFacultyExists(dto.facultyId || null);

  const user = new User({
    email,
    fullName: String(dto.fullName).trim(),
    role: dto.role,
    isActive: dto.isActive ?? true,
    faculty: faculty?._id,
    groupName: normalizeOptionalString(dto.groupName),
    specialty: normalizeOptionalString(dto.specialty),
    birthDate: parseOptionalDate(dto.birthDate, "Birth date"),
    badge: normalizeOptionalString(dto.badge),
    disciplines: normalizeDisciplines(dto.disciplines),
  });

  await user.setPassword(dto.password);
  user.emailVerification = {
    verifiedAt: new Date(),
  };

  await user.save();
  return mapUserById(user._id);
}

export async function listUsers(query = {}) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 200);
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.role) filter.role = String(query.role);
  if (query.facultyId) filter.faculty = String(query.facultyId);
  if (query.isActive === "true") filter.isActive = true;
  if (query.isActive === "false") filter.isActive = false;

  if (query.q) {
    const rx = { $regex: escapeRegex(String(query.q).trim()), $options: "i" };
    filter.$or = [
      { fullName: rx },
      { email: rx },
      { groupName: rx },
      { specialty: rx },
      { badge: rx },
      { disciplines: rx },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("fullName email role faculty isActive groupName specialty birthDate badge disciplines createdAt")
      .populate("faculty", "code name slug")
      .sort({ role: 1, fullName: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function updateUser(_actor, userId, dto) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (dto.role === "Dean" && user.role !== "Dean") {
    throw new ApiError(400, "Use dean management to assign a dean");
  }

  if (user.role === "Dean" && (dto.role && dto.role !== "Dean")) {
    throw new ApiError(400, "Use dean management to remove or replace a dean");
  }

  if (user.role === "Dean" && dto.facultyId !== undefined) {
    throw new ApiError(400, "Use dean management to move a dean between faculties");
  }

  if (dto.email !== undefined) {
    const email = normalizeEmail(dto.email);
    const exists = await User.findOne({ email, _id: { $ne: user._id } }).lean();
    if (exists) throw new ApiError(409, "User with this email already exists");
    user.email = email;
  }

  if (dto.fullName !== undefined) user.fullName = String(dto.fullName).trim();
  if (dto.role !== undefined && user.role !== "Dean") user.role = dto.role;
  if (dto.isActive !== undefined) user.isActive = dto.isActive;

  if (dto.facultyId !== undefined && user.role !== "Dean") {
    if (dto.role === "Admin" || user.role === "Admin") {
      user.faculty = undefined;
    } else {
      const faculty = await ensureFacultyExists(dto.facultyId);
      user.faculty = faculty?._id;
    }
  }

  if (user.role === "Admin") {
    user.faculty = undefined;
  }

  if (dto.groupName !== undefined) user.groupName = normalizeOptionalString(dto.groupName);
  if (dto.specialty !== undefined) user.specialty = normalizeOptionalString(dto.specialty);
  if (dto.birthDate !== undefined) user.birthDate = parseOptionalDate(dto.birthDate, "Birth date");
  if (dto.badge !== undefined) user.badge = normalizeOptionalString(dto.badge);
  if (dto.disciplines !== undefined) user.disciplines = normalizeDisciplines(dto.disciplines);

  if (dto.password) {
    await user.setPassword(dto.password);
    user.emailVerification = user.emailVerification || {};
    user.emailVerification.verifiedAt = user.emailVerification.verifiedAt || new Date();
  }

  await user.save();
  return mapUserById(user._id);
}

export async function deleteUser(actor, userId) {
  if (String(actor?._id) === String(userId)) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  await clearDeanAssignment(user._id);
  await user.deleteOne();

  return { ok: true };
}

import { Faculty } from "./faculty.model.js";
import { CertificateType } from "./certificateType.model.js";
import { CertificateRequest } from "./certificateRequest.model.js";
import { CertificateCounter } from "./certificateCounter.model.js";
import { User } from "../users/user.model.js";
import {
  CERT_REQUEST_MODES,
  CERT_STATUSES,
  SPECIAL_PURPOSE_REQUEST_DESCRIPTION,
  SPECIAL_PURPOSE_REQUEST_FIELDS,
  SPECIAL_PURPOSE_REQUEST_ID,
  SPECIAL_PURPOSE_REQUEST_TITLE,
} from "./constants.js";
import {
  notifyFacultyAboutNewRequest,
  notifyRequesterAboutStatus,
} from "../notifications/notification.service.js";

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function requireFaculty(user) {
  if (!user?.faculty) {
    throw httpError(
      403,
      "До вашого облікового запису ще не прив’язано факультет. Зверніться до деканату."
    );
  }
  return String(user.faculty);
}

function isAdmin(user) {
  return user?.role === "Admin";
}

function isDeanOrAdmin(user) {
  return user?.role === "Dean" || user?.role === "Admin";
}

function getManagedFacultyId(user, queryFacultyId) {
  if (user?.role === "Dean") return requireFaculty(user);

  if (user?.role === "Admin") {
    if (queryFacultyId) return String(queryFacultyId);
    if (user?.faculty) return String(user.faculty);
    throw httpError(400, "Для адміністратора потрібно передати facultyId");
  }

  throw httpError(403, "Недостатньо прав");
}

function getScopedFacultyId(user, queryFacultyId) {
  if (user.role === "Dean") return requireFaculty(user);

  if (user.role === "Admin") {
    if (queryFacultyId) return String(queryFacultyId);
    return requireFaculty(user);
  }

  throw httpError(403, "Недостатньо прав");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function ensureFacultyExists(facultyId) {
  const exists = await Faculty.exists({ _id: facultyId });
  if (!exists) throw httpError(404, "Факультет не знайдено");
}

async function nextRegNumber(facultyId) {
  const year = new Date().getFullYear();
  const key = `${facultyId}:${year}`;

  const doc = await CertificateCounter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  const seq = String(doc.seq).padStart(4, "0");
  return `${year}-${seq}`;
}

async function nextRequestNo(facultyId) {
  const key = `CERT_REQ:${facultyId}`;
  const counter = await CertificateCounter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  const num = String(counter.seq).padStart(6, "0");
  const faculty = await Faculty.findById(facultyId).select("code").lean();
  const prefix = faculty?.code ? String(faculty.code).toUpperCase() : "FAC";
  return `${prefix}-${num}`;
}

function isAudienceAllowed(typeAudience, userRole) {
  const audience = typeAudience || "all";
  if (audience === "all") return true;
  if (audience === "student") return userRole === "Student";
  if (audience === "teacher") return userRole === "Teacher";
  return false;
}

function normalizeDateInput(value, fieldLabel) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw httpError(400, `Поле "${fieldLabel}" має містити коректну дату`);
  }
  return date;
}

function normalizeDateRangeEnd(value, fieldLabel) {
  const date = normalizeDateInput(value, fieldLabel);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

function normalizePayloadByFields(fields, payload, user) {
  const safe = {};
  const map = new Map(fields.map((field) => [field.key, field]));
  const source = payload && typeof payload === "object" ? { ...payload } : {};

  if (source.fullName == null && map.has("fullName") && user?.fullName) source.fullName = user.fullName;
  if (source.email == null && map.has("email") && user?.email) source.email = user.email;
  if (source.groupName == null && map.has("groupName") && user?.groupName) source.groupName = user.groupName;
  if (source.specialty == null && map.has("specialty") && user?.specialty) source.specialty = user.specialty;
  if (source.birthDate == null && map.has("birthDate") && user?.birthDate) source.birthDate = user.birthDate;

  for (const [key, field] of map.entries()) {
    const value = source[key];

    if (field.required && (value === undefined || value === null || String(value).trim() === "")) {
      throw httpError(400, `Поле "${field.label}" є обов’язковим`);
    }

    if (value === undefined) continue;

    if (field.type === "select") {
      const options = Array.isArray(field.options) ? field.options : [];
      if (options.length && !options.includes(String(value))) {
        throw httpError(400, `Недопустиме значення для поля "${field.label}"`);
      }
      safe[key] = String(value);
      continue;
    }

    if (field.type === "number") {
      const normalized = Number(value);
      if (Number.isNaN(normalized)) {
        throw httpError(400, `Поле "${field.label}" має бути числом`);
      }
      safe[key] = normalized;
      continue;
    }

    if (field.type === "checkbox") {
      safe[key] = Boolean(value);
      continue;
    }

    if (field.type === "date") {
      safe[key] = normalizeDateInput(value, field.label).toISOString();
      continue;
    }

    safe[key] = String(value).trim();
  }

  return safe;
}

function normalizeSpecialPurposePayload(dto, user) {
  const payload = dto?.payload && typeof dto.payload === "object" ? { ...dto.payload } : {};

  if (payload.requestPurpose == null && dto?.requestPurpose) {
    payload.requestPurpose = dto.requestPurpose;
  }

  return normalizePayloadByFields(SPECIAL_PURPOSE_REQUEST_FIELDS, payload, user);
}

function requestSubmittedComment(requestMode) {
  return requestMode === CERT_REQUEST_MODES.PURPOSE
    ? "Подано заявку за призначенням"
    : "Подано нову заявку";
}

function requestResubmittedComment(requestMode) {
  return requestMode === CERT_REQUEST_MODES.PURPOSE
    ? "Заявку за призначенням подано повторно після редагування"
    : "Заявку повторно подано після редагування";
}

function statusTimelineComment(status, dto = {}) {
  if (status === CERT_STATUSES.IN_REVIEW) return "Заявку взято в роботу";
  if (status === CERT_STATUSES.FORMING) return "Довідка перейшла в етап формування";
  if (status === CERT_STATUSES.READY) return dto.pickupFrom ? "Довідка готова до видачі" : "Довідка готова";
  if (status === CERT_STATUSES.REJECTED) {
    return dto.decisionComment?.trim() || "Заявку відхилено";
  }
  return "Статус заявки оновлено";
}

function requestTitleFrom(type, request) {
  return String(request?.requestTitle || type?.title || SPECIAL_PURPOSE_REQUEST_TITLE);
}

function buildRecentActivityItem(item) {
  return {
    id: String(item._id),
    requestNo: item.requestNo || item.regNumber || String(item._id),
    requestTitle: item.requestTitle || SPECIAL_PURPOSE_REQUEST_TITLE,
    status: item.status,
    requesterName: item.requesterFullName || "—",
    submittedAt: item.submittedAt,
  };
}

export async function createFaculty(user, dto) {
  if (!isAdmin(user)) throw httpError(403, "Недостатньо прав");
  return Faculty.create(dto);
}

export async function updateFaculty(user, id, dto) {
  if (!isAdmin(user)) throw httpError(403, "Недостатньо прав");
  const faculty = await Faculty.findByIdAndUpdate(id, dto, { new: true });
  if (!faculty) throw httpError(404, "Факультет не знайдено");
  return faculty;
}

export async function deleteFaculty(user, id) {
  if (!isAdmin(user)) throw httpError(403, "Недостатньо прав");
  const [membersCount, certificateTypesCount, requestsCount] = await Promise.all([
    User.countDocuments({ faculty: id }),
    CertificateType.countDocuments({ faculty: id }),
    CertificateRequest.countDocuments({ faculty: id }),
  ]);

  if (membersCount > 0 || certificateTypesCount > 0 || requestsCount > 0) {
    throw httpError(
      400,
      "Р¤Р°РєСѓР»СЊС‚РµС‚ РЅРµРјРѕР¶Р»РёРІРѕ РІРёРґР°Р»РёС‚Рё, РїРѕРєРё РґРѕ РЅСЊРѕРіРѕ РїСЂРёРІ'СЏР·Р°РЅС– РєРѕСЂРёСЃС‚СѓРІР°С‡С–, РґРѕРІС–РґРєРё Р°Р±Рѕ Р·Р°СЏРІРєРё"
    );
  }

  const faculty = await Faculty.findByIdAndDelete(id);
  if (!faculty) throw httpError(404, "Факультет не знайдено");
  return { ok: true };
}

export async function listFaculties(user) {
  if (!isDeanOrAdmin(user)) throw httpError(403, "Недостатньо прав");
  return Faculty.find({})
    .populate("deanUser", "fullName email role faculty")
    .sort({ name: 1 })
    .lean();
}

export async function getMyFaculty(user, queryFacultyId) {
  if (!isDeanOrAdmin(user)) throw httpError(403, "Недостатньо прав");

  const facultyId = getManagedFacultyId(user, queryFacultyId);
  const faculty = await Faculty.findById(facultyId)
    .populate("deanUser", "fullName email role faculty")
    .lean();

  if (!faculty) throw httpError(404, "Факультет не знайдено");
  return faculty;
}

export async function listFacultyMembers(user, query = {}) {
  if (!isDeanOrAdmin(user)) throw httpError(403, "Недостатньо прав");

  const facultyId = getManagedFacultyId(user, query.facultyId);
  await ensureFacultyExists(facultyId);

  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 200);
  const skip = (page - 1) * limit;

  const filter = { faculty: facultyId };
  if (query.role) filter.role = String(query.role);
  if (query.groupName) filter.groupName = { $regex: escapeRegex(query.groupName), $options: "i" };
  if (query.specialty) filter.specialty = { $regex: escapeRegex(query.specialty), $options: "i" };
  if (query.birthDate) {
    const date = normalizeDateInput(query.birthDate, "Дата народження");
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    filter.birthDate = { $gte: date, $lt: nextDate };
  }
  if (query.badge) filter.badge = { $regex: escapeRegex(query.badge), $options: "i" };
  if (query.discipline) {
    filter.disciplines = { $regex: escapeRegex(query.discipline), $options: "i" };
  }

  if (query.q) {
    const q = { $regex: escapeRegex(query.q), $options: "i" };
    filter.$or = [
      { fullName: q },
      { email: q },
      { groupName: q },
      { specialty: q },
      { badge: q },
      { disciplines: q },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("fullName email role faculty groupName specialty birthDate badge disciplines isActive createdAt")
      .sort({ role: 1, fullName: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function listFacultyCandidates(user, query = {}) {
  if (!isDeanOrAdmin(user)) throw httpError(403, "Недостатньо прав");

  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 200);
  const skip = (page - 1) * limit;

  const filter = {
    role: query.role ? String(query.role) : { $in: ["Student", "Teacher"] },
    $or: [{ faculty: null }, { faculty: { $exists: false } }],
    isActive: true,
  };

  if (query.q) {
    const q = { $regex: escapeRegex(query.q), $options: "i" };
    filter.$and = [{ $or: [{ fullName: q }, { email: q }, { badge: q }, { disciplines: q }] }];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("fullName email role faculty groupName specialty birthDate badge disciplines isActive createdAt")
      .sort({ role: 1, fullName: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function attachFacultyMember(user, dto = {}, queryFacultyId) {
  if (!isDeanOrAdmin(user)) throw httpError(403, "Недостатньо прав");

  const facultyId = getManagedFacultyId(user, dto.facultyId || queryFacultyId);
  const faculty = await Faculty.findById(facultyId);
  if (!faculty) throw httpError(404, "Факультет не знайдено");

  const member = await User.findById(dto.userId);
  if (!member) throw httpError(404, "Користувача не знайдено");
  if (member.role === "Admin") throw httpError(400, "Адміністратора не можна приєднати до факультету");

  if (member.faculty && String(member.faculty) !== String(faculty._id) && user.role !== "Admin") {
    throw httpError(403, "Користувач уже прив’язаний до іншого факультету");
  }

  if (dto.role) member.role = dto.role;
  if (!["Student", "Teacher", "Dean"].includes(member.role)) {
    throw httpError(400, "До факультету можна приєднати лише студента, викладача або декана");
  }

  if (dto.groupName !== undefined) member.groupName = String(dto.groupName).trim() || undefined;
  if (dto.specialty !== undefined) member.specialty = String(dto.specialty).trim() || undefined;
  if (dto.birthDate !== undefined) {
    member.birthDate = dto.birthDate ? normalizeDateInput(dto.birthDate, "Дата народження") : undefined;
  }
  if (dto.badge !== undefined) member.badge = String(dto.badge).trim() || undefined;
  if (dto.disciplines !== undefined) {
    member.disciplines = Array.isArray(dto.disciplines)
      ? dto.disciplines.map((value) => String(value).trim()).filter(Boolean)
      : [];
  }

  member.faculty = faculty._id;
  await member.save();

  return member.toJSON();
}

export async function updateFacultyMember(user, userId, dto = {}, queryFacultyId) {
  if (!isDeanOrAdmin(user)) throw httpError(403, "Недостатньо прав");

  const facultyId = getManagedFacultyId(user, dto.facultyId || queryFacultyId);
  await ensureFacultyExists(facultyId);

  const member = await User.findById(userId);
  if (!member) throw httpError(404, "Користувача не знайдено");
  if (!member.faculty || String(member.faculty) !== String(facultyId)) {
    throw httpError(403, "Користувач не належить до вашого факультету");
  }
  if (member.role === "Admin") throw httpError(400, "Адміністратора не можна змінювати як члена факультету");

  if (dto.role) member.role = dto.role;
  if (dto.groupName !== undefined) member.groupName = String(dto.groupName).trim() || undefined;
  if (dto.specialty !== undefined) member.specialty = String(dto.specialty).trim() || undefined;
  if (dto.birthDate !== undefined) {
    member.birthDate = dto.birthDate ? normalizeDateInput(dto.birthDate, "Дата народження") : undefined;
  }
  if (dto.badge !== undefined) member.badge = String(dto.badge).trim() || undefined;
  if (dto.disciplines !== undefined) {
    member.disciplines = Array.isArray(dto.disciplines)
      ? dto.disciplines.map((value) => String(value).trim()).filter(Boolean)
      : [];
  }

  await member.save();
  return member.toJSON();
}

export async function createCertificateType(user, dto) {
  if (!isDeanOrAdmin(user)) throw httpError(403, "Недостатньо прав");

  const facultyId = isAdmin(user) && dto.facultyId ? dto.facultyId : requireFaculty(user);

  const fields = Array.isArray(dto.fields) ? dto.fields : [];
  const keys = new Set();
  for (const field of fields) {
    const key = String(field.key);
    if (keys.has(key)) throw httpError(400, `Повторюється ключ поля: ${key}`);
    keys.add(key);
  }

  return CertificateType.create({
    faculty: facultyId,
    title: dto.title,
    description: dto.description,
    isActive: dto.isActive ?? true,
    audience: dto.audience ?? "all",
    fields,
    createdBy: user._id,
    updatedBy: user._id,
  });
}

export async function updateCertificateType(user, id, dto) {
  if (!isDeanOrAdmin(user)) throw httpError(403, "Недостатньо прав");

  const type = await CertificateType.findById(id);
  if (!type) throw httpError(404, "Тип довідки не знайдено");

  if (!isAdmin(user)) {
    const myFacultyId = requireFaculty(user);
    if (String(type.faculty) !== String(myFacultyId)) throw httpError(403, "Недостатньо прав");
  }

  if (dto.fields) {
    const keys = new Set();
    for (const field of dto.fields) {
      const key = String(field.key);
      if (keys.has(key)) throw httpError(400, `Повторюється ключ поля: ${key}`);
      keys.add(key);
    }
    type.fields = dto.fields;
  }

  if (dto.title != null) type.title = dto.title;
  if (dto.description != null) type.description = dto.description;
  if (dto.isActive != null) type.isActive = dto.isActive;
  if (dto.audience != null) type.audience = dto.audience;
  type.updatedBy = user._id;

  await type.save();
  return type;
}

export async function deleteCertificateType(user, id) {
  if (!isDeanOrAdmin(user)) throw httpError(403, "Недостатньо прав");

  const type = await CertificateType.findById(id);
  if (!type) throw httpError(404, "Тип довідки не знайдено");

  if (!isAdmin(user)) {
    const myFacultyId = requireFaculty(user);
    if (String(type.faculty) !== String(myFacultyId)) throw httpError(403, "Недостатньо прав");
  }

  await type.deleteOne();
  return { ok: true };
}

export async function listMyFacultyCertificateTypes(user) {
  const facultyId = requireFaculty(user);
  return CertificateType.find({ faculty: facultyId }).sort({ title: 1 }).lean();
}

export async function getCertificateType(user, id) {
  const type = await CertificateType.findById(id).lean();
  if (!type) throw httpError(404, "Тип довідки не знайдено");

  if (!isAdmin(user)) {
    const myFacultyId = requireFaculty(user);
    if (String(type.faculty) !== String(myFacultyId)) throw httpError(403, "Недостатньо прав");
  }

  return type;
}

export async function createRequest(user, dto) {
  const facultyId = requireFaculty(user);

  let type = null;
  let requestMode = CERT_REQUEST_MODES.PURPOSE;
  let requestTitle = SPECIAL_PURPOSE_REQUEST_TITLE;
  let requestPurpose = "";
  let payload = {};

  if (dto.typeId && dto.typeId !== SPECIAL_PURPOSE_REQUEST_ID) {
    type = await CertificateType.findOne({ _id: dto.typeId, faculty: facultyId }).lean();
    if (!type || !type.isActive) throw httpError(404, "Тип довідки не знайдено або він вимкнений");

    if (!isAudienceAllowed(type.audience, user.role) && user.role !== "Dean" && user.role !== "Admin") {
      throw httpError(403, "Цей тип довідки недоступний для вашої ролі");
    }

    requestMode = CERT_REQUEST_MODES.TEMPLATE;
    requestTitle = type.title;
    payload = normalizePayloadByFields(type.fields || [], dto.payload || {}, user);
  } else {
    payload = normalizeSpecialPurposePayload(dto, user);
    requestPurpose = String(payload.requestPurpose || dto.requestPurpose || "").trim();
  }

  const [requestNo, regNumber] = await Promise.all([
    nextRequestNo(facultyId),
    nextRegNumber(facultyId),
  ]);

  const request = await CertificateRequest.create({
    faculty: facultyId,
    type: type?._id,
    requestMode,
    requestTitle,
    requestPurpose,
    requester: user._id,
    requesterEmail: user.email,
    requesterFullName: user.fullName,
    requesterRole: user.role,
    payload,
    status: CERT_STATUSES.SUBMITTED,
    requestNo,
    regNumber,
    submittedAt: new Date(),
    timeline: [
      {
        status: CERT_STATUSES.SUBMITTED,
        by: user._id,
        comment: requestSubmittedComment(requestMode),
      },
    ],
    lastUpdatedBy: user._id,
  });

  await notifyFacultyAboutNewRequest({
    facultyId,
    request,
    requesterName: user.fullName,
    requestTitle,
  });

  return request.toJSON();
}

export async function listRequests(user, query = {}) {
  const facultyId = getScopedFacultyId(user, query.facultyId);

  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const skip = (page - 1) * limit;

  const filter = { faculty: facultyId };
  if (query.status) filter.status = String(query.status);
  if (query.typeId) filter.type = String(query.typeId);
  if (query.regNumber) filter.regNumber = String(query.regNumber);

  const dateFrom = query.dateFrom || query.from;
  const dateTo = query.dateTo || query.to;
  if (dateFrom || dateTo) {
    filter.submittedAt = {};
    if (dateFrom) filter.submittedAt.$gte = normalizeDateInput(dateFrom, "Дата від");
    if (dateTo) filter.submittedAt.$lte = normalizeDateRangeEnd(dateTo, "Дата до");
  }

  if (query.q) {
    const q = { $regex: escapeRegex(String(query.q).trim()), $options: "i" };
    filter.$or = [
      { requesterEmail: q },
      { requesterFullName: q },
      { requestTitle: q },
      { requestPurpose: q },
      { requestNo: q },
      { regNumber: q },
    ];
  }

  let sort = { submittedAt: -1 };
  if (query.sort === "submittedAt") sort = { submittedAt: 1 };
  if (query.sort === "-submittedAt") sort = { submittedAt: -1 };
  if (query.sort === "updatedAt") sort = { updatedAt: 1 };
  if (query.sort === "-updatedAt") sort = { updatedAt: -1 };

  const [total, items] = await Promise.all([
    CertificateRequest.countDocuments(filter),
    CertificateRequest.find(filter)
      .populate("type", "title audience")
      .populate("requester", "email fullName role")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    items,
  };
}

export async function getRequestForAdmission(user, id, queryFacultyId) {
  const facultyId = getScopedFacultyId(user, queryFacultyId);

  const request = await CertificateRequest.findOne({ _id: id, faculty: facultyId })
    .populate("type")
    .populate("requester", "email fullName role faculty groupName specialty birthDate")
    .lean();

  if (!request) throw httpError(404, "Заявку не знайдено");
  return request;
}

export async function listMyRequests(user) {
  return CertificateRequest.find({ requester: user._id })
    .populate("type", "title")
    .sort({ submittedAt: -1 })
    .lean();
}

export async function getRequest(user, id) {
  const request = await CertificateRequest.findById(id)
    .populate("type", "title fields")
    .populate("faculty", "name code slug")
    .lean();

  if (!request) throw httpError(404, "Заявку не знайдено");

  const isOwner = String(request.requester) === String(user._id);
  if (isOwner) return request;

  if (isDeanOrAdmin(user)) {
    if (isAdmin(user)) return request;
    const myFacultyId = requireFaculty(user);
    if (String(request.faculty?._id || request.faculty) !== String(myFacultyId)) {
      throw httpError(403, "Недостатньо прав");
    }
    return request;
  }

  throw httpError(403, "Недостатньо прав");
}

export async function updateMyRequest(user, id, dto) {
  const request = await CertificateRequest.findById(id);
  if (!request) throw httpError(404, "Заявку не знайдено");

  if (String(request.requester) !== String(user._id)) throw httpError(403, "Недостатньо прав");
  if (![CERT_STATUSES.REJECTED, CERT_STATUSES.SUBMITTED].includes(request.status)) {
    throw httpError(400, "Редагувати можна лише заявки зі статусом 'Подано' або 'Відхилено'");
  }

  let payload = {};
  if (request.requestMode === CERT_REQUEST_MODES.PURPOSE || !request.type) {
    payload = normalizeSpecialPurposePayload(dto, user);
    request.requestPurpose = String(payload.requestPurpose || dto.requestPurpose || "").trim();
  } else {
    const type = await CertificateType.findById(request.type).lean();
    if (!type) throw httpError(404, "Тип довідки не знайдено");
    payload = normalizePayloadByFields(type.fields || [], dto.payload || {}, user);
    request.requestTitle = requestTitleFrom(type, request);
  }

  request.payload = payload;
  request.status = CERT_STATUSES.SUBMITTED;
  request.decisionComment = undefined;
  request.reviewedAt = undefined;
  request.formingAt = undefined;
  request.readyAt = undefined;
  request.pickupFrom = undefined;
  request.submittedAt = new Date();
  request.lastUpdatedBy = user._id;
  request.timeline = request.timeline || [];
  request.timeline.push({
    status: CERT_STATUSES.SUBMITTED,
    by: user._id,
    comment: requestResubmittedComment(request.requestMode),
  });

  await request.save();

  await notifyFacultyAboutNewRequest({
    facultyId: request.faculty,
    request,
    requesterName: user.fullName,
    requestTitle: request.requestTitle,
    isResubmitted: true,
  });

  return request.toJSON();
}

export async function listFacultyRequests(user, query = {}) {
  if (!isDeanOrAdmin(user)) throw httpError(403, "Недостатньо прав");

  const facultyId = !isAdmin(user) ? requireFaculty(user) : query.facultyId;
  const q = {};
  if (facultyId) q.faculty = facultyId;
  if (query.status) q.status = query.status;
  if (query.typeId) q.type = query.typeId;
  if (query.requesterId) q.requester = query.requesterId;

  const from = query.from || query.dateFrom;
  const to = query.to || query.dateTo;
  if (from || to) {
    q.submittedAt = {};
    if (from) q.submittedAt.$gte = normalizeDateInput(from, "Дата від");
    if (to) q.submittedAt.$lte = normalizeDateRangeEnd(to, "Дата до");
  }

  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const page = Math.max(Number(query.page || 1), 1);
  const skip = (page - 1) * limit;
  const text = query.q ? String(query.q).trim() : null;

  const filter = { ...q };
  if (text) {
    const rx = { $regex: escapeRegex(text), $options: "i" };
    filter.$or = [{ requestNo: rx }, { regNumber: rx }, { requestTitle: rx }, { requesterFullName: rx }];
  }

  const [items, total] = await Promise.all([
    CertificateRequest.find(filter)
      .populate("type", "title")
      .populate("requester", "fullName email role")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CertificateRequest.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function updateRequestStatus(user, id, dto, queryFacultyId) {
  const facultyId = getScopedFacultyId(user, queryFacultyId);

  const request = await CertificateRequest.findOne({ _id: id, faculty: facultyId });
  if (!request) throw httpError(404, "Заявку не знайдено");

  const now = new Date();
  request.status = dto.status;
  request.lastUpdatedBy = user._id;

  if (dto.status === CERT_STATUSES.IN_REVIEW && !request.reviewedAt) request.reviewedAt = now;
  if (dto.status === CERT_STATUSES.FORMING && !request.formingAt) request.formingAt = now;
  if (dto.status === CERT_STATUSES.READY) request.readyAt = now;

  if (dto.pickupFrom) request.pickupFrom = normalizeDateInput(dto.pickupFrom, "Дата видачі");

  if (dto.decisionComment !== undefined) {
    request.decisionComment = String(dto.decisionComment).trim() || undefined;
  }

  if (dto.status === CERT_STATUSES.REJECTED) {
    if (!dto.decisionComment || String(dto.decisionComment).trim().length < 3) {
      throw httpError(400, "Для відхилення заявки потрібен коментар");
    }
  }

  request.timeline = request.timeline || [];
  request.timeline.push({
    status: dto.status,
    by: user._id,
    comment: statusTimelineComment(dto.status, dto),
  });

  await request.save();

  const data = await CertificateRequest.findById(request._id)
    .populate("type", "title audience")
    .populate("requester", "email fullName role")
    .lean();

  await notifyRequesterAboutStatus({
    request: {
      ...request.toJSON(),
      requesterRole: data?.requesterRole || request.requesterRole,
    },
    status: request.status,
    decisionComment: request.decisionComment,
    pickupFrom: request.pickupFrom,
  });

  return data;
}

export async function getFacultyAnalytics(user, queryFacultyId) {
  const facultyId = getScopedFacultyId(user, queryFacultyId);

  const items = await CertificateRequest.find({ faculty: facultyId })
    .sort({ submittedAt: -1 })
    .lean();

  const total = items.length;
  const counts = {
    [CERT_STATUSES.SUBMITTED]: 0,
    [CERT_STATUSES.IN_REVIEW]: 0,
    [CERT_STATUSES.FORMING]: 0,
    [CERT_STATUSES.READY]: 0,
    [CERT_STATUSES.REJECTED]: 0,
  };
  const roleCounts = { Student: 0, Teacher: 0, Dean: 0, Admin: 0 };
  const modeCounts = {
    [CERT_REQUEST_MODES.TEMPLATE]: 0,
    [CERT_REQUEST_MODES.PURPOSE]: 0,
  };
  const topTitles = new Map();

  const today = new Date();
  const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - 6);

  let submittedToday = 0;
  let submittedThisWeek = 0;
  let processingHoursTotal = 0;
  let processingCount = 0;

  const trendDays = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(startOfToday);
    date.setUTCDate(startOfToday.getUTCDate() - (13 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" }),
      submitted: 0,
      ready: 0,
      rejected: 0,
    };
  });
  const trendMap = new Map(trendDays.map((item) => [item.key, item]));

  for (const item of items) {
    if (counts[item.status] !== undefined) counts[item.status] += 1;
    if (roleCounts[item.requesterRole] !== undefined) roleCounts[item.requesterRole] += 1;

    const requestMode = item.requestMode || CERT_REQUEST_MODES.TEMPLATE;
    if (modeCounts[requestMode] !== undefined) modeCounts[requestMode] += 1;

    const title = item.requestTitle || SPECIAL_PURPOSE_REQUEST_TITLE;
    topTitles.set(title, (topTitles.get(title) || 0) + 1);

    if (item.submittedAt) {
      const submittedAt = new Date(item.submittedAt);
      if (submittedAt >= startOfToday) submittedToday += 1;
      if (submittedAt >= startOfWeek) submittedThisWeek += 1;

      const trendKey = submittedAt.toISOString().slice(0, 10);
      const trend = trendMap.get(trendKey);
      if (trend) {
        trend.submitted += 1;
        if (item.status === CERT_STATUSES.READY) trend.ready += 1;
        if (item.status === CERT_STATUSES.REJECTED) trend.rejected += 1;
      }
    }

    if (
      item.submittedAt &&
      (item.status === CERT_STATUSES.READY || item.status === CERT_STATUSES.REJECTED)
    ) {
      const finishedAt = item.readyAt || item.updatedAt;
      if (finishedAt) {
        processingHoursTotal +=
          (new Date(finishedAt).getTime() - new Date(item.submittedAt).getTime()) / 36e5;
        processingCount += 1;
      }
    }
  }

  const pending =
    counts[CERT_STATUSES.SUBMITTED] +
    counts[CERT_STATUSES.IN_REVIEW] +
    counts[CERT_STATUSES.FORMING];

  return {
    summary: {
      total,
      pending,
      ready: counts[CERT_STATUSES.READY],
      rejected: counts[CERT_STATUSES.REJECTED],
      inReview: counts[CERT_STATUSES.IN_REVIEW],
      forming: counts[CERT_STATUSES.FORMING],
      submittedToday,
      submittedThisWeek,
      completionRate: total > 0 ? Math.round((counts[CERT_STATUSES.READY] / total) * 100) : 0,
      averageProcessingHours:
        processingCount > 0 ? Number((processingHoursTotal / processingCount).toFixed(1)) : 0,
    },
    byStatus: [
      { status: CERT_STATUSES.SUBMITTED, label: "Подано", count: counts[CERT_STATUSES.SUBMITTED] },
      { status: CERT_STATUSES.IN_REVIEW, label: "На розгляді", count: counts[CERT_STATUSES.IN_REVIEW] },
      { status: CERT_STATUSES.FORMING, label: "Формується", count: counts[CERT_STATUSES.FORMING] },
      { status: CERT_STATUSES.READY, label: "Готово", count: counts[CERT_STATUSES.READY] },
      { status: CERT_STATUSES.REJECTED, label: "Відхилено", count: counts[CERT_STATUSES.REJECTED] },
    ],
    byRole: [
      { role: "Student", label: "Студенти", count: roleCounts.Student },
      { role: "Teacher", label: "Викладачі", count: roleCounts.Teacher },
      { role: "Dean", label: "Деканат", count: roleCounts.Dean },
      { role: "Admin", label: "Адміністратори", count: roleCounts.Admin },
    ],
    byMode: [
      { mode: CERT_REQUEST_MODES.TEMPLATE, label: "За типом довідки", count: modeCounts[CERT_REQUEST_MODES.TEMPLATE] },
      { mode: CERT_REQUEST_MODES.PURPOSE, label: "За призначенням", count: modeCounts[CERT_REQUEST_MODES.PURPOSE] },
    ],
    dailyTrend: trendDays,
    topRequests: [...topTitles.entries()]
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    recent: items.slice(0, 8).map(buildRecentActivityItem),
    specialRequest: {
      id: SPECIAL_PURPOSE_REQUEST_ID,
      title: SPECIAL_PURPOSE_REQUEST_TITLE,
      description: SPECIAL_PURPOSE_REQUEST_DESCRIPTION,
      fields: SPECIAL_PURPOSE_REQUEST_FIELDS,
    },
  };
}

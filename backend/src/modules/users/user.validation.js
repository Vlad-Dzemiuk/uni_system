import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);
const userRole = z.enum(["Student", "Teacher", "Dean", "Admin"]);
const nullableObjectId = z.union([objectId, z.null()]);
const nullableTrimmedString = (max) => z.union([z.string().trim().max(max), z.null()]);

const passwordSchema = z.string().min(8).max(72);

export const listUsersSchema = z.object({
  query: z
    .object({
      role: userRole.optional(),
      facultyId: objectId.optional(),
      isActive: z.enum(["true", "false"]).optional(),
      q: z.string().trim().min(1).max(160).optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(200).optional(),
    })
    .optional(),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    fullName: z.string().trim().min(3).max(120),
    role: userRole,
    password: passwordSchema,
    facultyId: nullableObjectId.optional(),
    isActive: z.boolean().optional(),
    groupName: nullableTrimmedString(80).optional(),
    specialty: nullableTrimmedString(140).optional(),
    birthDate: z.union([z.string(), z.null()]).optional(),
    badge: nullableTrimmedString(80).optional(),
    disciplines: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateUserSchema = z.object({
  params: z.object({
    userId: objectId,
  }),
  body: z
    .object({
      email: z.string().email().optional(),
      fullName: z.string().trim().min(3).max(120).optional(),
      role: userRole.optional(),
      password: passwordSchema.optional(),
      facultyId: nullableObjectId.optional(),
      isActive: z.boolean().optional(),
      groupName: nullableTrimmedString(80).optional(),
      specialty: nullableTrimmedString(140).optional(),
      birthDate: z.union([z.string(), z.null()]).optional(),
      badge: nullableTrimmedString(80).optional(),
      disciplines: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
    })
    .refine(
      (value) =>
        value.email !== undefined ||
        value.fullName !== undefined ||
        value.role !== undefined ||
        value.password !== undefined ||
        value.facultyId !== undefined ||
        value.isActive !== undefined ||
        value.groupName !== undefined ||
        value.specialty !== undefined ||
        value.birthDate !== undefined ||
        value.badge !== undefined ||
        value.disciplines !== undefined,
      { message: "No fields to update" }
    ),
  query: z.object({}).optional(),
});

export const deleteUserSchema = z.object({
  params: z.object({
    userId: objectId,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

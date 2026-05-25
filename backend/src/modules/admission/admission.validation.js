import { z } from "zod";
import { SPECIAL_PURPOSE_REQUEST_ID } from "./constants.js";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);
const attachableRole = z.enum(["Student", "Teacher"]);
const userRole = z.enum(["Student", "Teacher", "Dean", "Admin"]);
const certificateTypeId = z.union([objectId, z.literal(SPECIAL_PURPOSE_REQUEST_ID)]);

export const createFacultySchema = z.object({
  body: z.object({
    code: z.string().min(2).max(10),
    name: z.string().min(3).max(200),
    slug: z.string().min(2).max(50),
    isActive: z.boolean().optional(),
  }),
});

export const updateFacultySchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    code: z.string().min(2).max(10).optional(),
    name: z.string().min(3).max(200).optional(),
    slug: z.string().min(2).max(50).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createCertificateTypeSchema = z.object({
  body: z.object({
    facultyId: objectId.optional(),
    title: z.string().min(3).max(200),
    description: z.string().max(1000).optional(),
    isActive: z.boolean().optional(),
    audience: z.enum(["student", "teacher", "all"]).optional(),
    fields: z
      .array(
        z.object({
          key: z.string().min(1).max(60),
          label: z.string().min(1).max(200),
          type: z.enum(["text", "textarea", "number", "select", "date", "checkbox"]).optional(),
          required: z.boolean().optional(),
          options: z.array(z.string().min(1).max(200)).optional(),
          placeholder: z.string().max(200).optional(),
          helpText: z.string().max(300).optional(),
          order: z.number().int().min(0).max(999).optional(),
        })
      )
      .default([]),
  }),
});

export const updateCertificateTypeSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(1000).optional(),
    isActive: z.boolean().optional(),
    audience: z.enum(["student", "teacher", "all"]).optional(),
    fields: z
      .array(
        z.object({
          key: z.string().min(1).max(60),
          label: z.string().min(1).max(200),
          type: z.enum(["text", "textarea", "number", "select", "date", "checkbox"]).optional(),
          required: z.boolean().optional(),
          options: z.array(z.string().min(1).max(200)).optional(),
          placeholder: z.string().max(200).optional(),
          helpText: z.string().max(300).optional(),
          order: z.number().int().min(0).max(999).optional(),
        })
      )
      .optional(),
  }),
});

export const createRequestSchema = z.object({
  body: z
    .object({
      typeId: certificateTypeId.optional(),
      payload: z.record(z.any()).default({}),
      requestPurpose: z.string().trim().min(5).max(2000).optional(),
    })
    .refine((value) => Boolean(value.typeId || value.requestPurpose), {
      message: "Потрібно вказати тип довідки або описати її призначення",
    }),
});

export const updateMyRequestSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    payload: z.record(z.any()).default({}),
    requestPurpose: z.string().trim().min(5).max(2000).optional(),
  }),
});

export const listRequestsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),

    status: z.string().optional(),  
    typeId: objectId.optional(),
    regNumber: z.string().optional(),

    q: z.string().min(1).optional(),

    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),

    facultyId: objectId.optional(),

    sort: z.enum(["submittedAt", "-submittedAt", "updatedAt", "-updatedAt"]).optional(),
  }).optional(),
});

export const updateRequestStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.enum(["SUBMITTED", "IN_REVIEW", "FORMING", "READY", "REJECTED"]),
    decisionComment: z.string().trim().min(3).max(1000).optional(),
    pickupFrom: z.string().datetime().optional(),
  }),
});

export const getScopedFacultySchema = z.object({
  query: z
    .object({
      facultyId: objectId.optional(),
    })
    .optional(),
});

export const listFacultyMembersSchema = z.object({
  query: z
    .object({
      facultyId: objectId.optional(),
      role: userRole.optional(),
      groupName: z.string().min(1).max(80).optional(),
      specialty: z.string().min(1).max(140).optional(),
      birthDate: z.string().optional(),
      badge: z.string().min(1).max(80).optional(),
      discipline: z.string().min(1).max(120).optional(),
      q: z.string().min(1).max(160).optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(200).optional(),
    })
    .optional(),
});

export const listFacultyCandidatesSchema = z.object({
  query: z
    .object({
      role: attachableRole.optional(),
      q: z.string().min(1).max(160).optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(200).optional(),
    })
    .optional(),
});

export const attachFacultyMemberSchema = z.object({
  body: z.object({
    userId: objectId,
    facultyId: objectId.optional(),
    role: attachableRole.optional(),
    groupName: z.string().trim().min(1).max(80).optional(),
    specialty: z.string().trim().min(1).max(140).optional(),
    birthDate: z.string().optional(),
    badge: z.string().trim().min(1).max(80).optional(),
    disciplines: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
  }),
  query: z
    .object({
      facultyId: objectId.optional(),
    })
    .optional(),
});

export const updateFacultyMemberSchema = z.object({
  params: z.object({
    userId: objectId,
  }),
  body: z
    .object({
      facultyId: objectId.optional(),
      role: attachableRole.optional(),
      groupName: z.string().trim().max(80).optional(),
      specialty: z.string().trim().max(140).optional(),
      birthDate: z.string().optional(),
      badge: z.string().trim().max(80).optional(),
      disciplines: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
    })
    .refine(
      (v) =>
        v.role !== undefined ||
        v.groupName !== undefined ||
        v.specialty !== undefined ||
        v.birthDate !== undefined ||
        v.badge !== undefined ||
        v.disciplines !== undefined ||
        v.facultyId !== undefined,
      { message: "No fields to update" }
    ),
  query: z
    .object({
      facultyId: objectId.optional(),
    })
    .optional(),
});

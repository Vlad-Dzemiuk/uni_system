import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const assignDeanSchema = z.object({
  body: z
    .object({
      userId: objectId.optional(),
      email: z.string().email().optional(),
      facultyId: objectId,
    })
    .refine((v) => v.userId || v.email, {
      message: "Provide userId or email",
      path: ["userId"],
    }),
});

export const unassignDeanSchema = z.object({
  params: z.object({
    facultyId: objectId,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

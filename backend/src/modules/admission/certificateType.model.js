import mongoose from "mongoose";

const { Schema } = mongoose;

const FIELD_TYPES = ["text", "textarea", "number", "select", "date", "checkbox"];
const AUDIENCE = ["student", "teacher", "all"];

const fieldSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },     
    label: { type: String, required: true, trim: true },       
    type: { type: String, enum: FIELD_TYPES, default: "text" },
    required: { type: Boolean, default: true },
    options: [{ type: String, trim: true }],                    
    placeholder: { type: String, trim: true },
    helpText: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const certificateTypeSchema = new Schema(
  {
    faculty: { type: Schema.Types.ObjectId, ref: "Faculty", required: true, index: true },

    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },

    audience: { type: String, enum: AUDIENCE, default: "all", index: true },

    fields: { type: [fieldSchema], default: [] },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

certificateTypeSchema.index({ faculty: 1, title: 1 }, { unique: true });

export const CertificateType = mongoose.model("CertificateType", certificateTypeSchema);

export const CERT_FIELD_TYPES = FIELD_TYPES;
export const CERT_AUDIENCE = AUDIENCE;


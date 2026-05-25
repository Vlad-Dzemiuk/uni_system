import mongoose from "mongoose";
import {
  CERT_REQUEST_MODES,
  CERT_STATUSES,
  REQUEST_MODE_ENUM,
  STATUS_ENUM,
} from "./constants.js";

const { Schema } = mongoose;

const certificateRequestSchema = new Schema(
  {
    faculty: { type: Schema.Types.ObjectId, ref: "Faculty", required: true, index: true },

    type: { type: Schema.Types.ObjectId, ref: "CertificateType", index: true },
    requestMode: {
      type: String,
      enum: REQUEST_MODE_ENUM,
      default: CERT_REQUEST_MODES.TEMPLATE,
      index: true,
    },
    requestTitle: { type: String, required: true, trim: true, maxlength: 240 },
    requestPurpose: { type: String, trim: true, maxlength: 2000 },

    requester: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requesterEmail: { type: String, lowercase: true, trim: true, index: true },
    requesterFullName: { type: String, trim: true, index: true },
    requesterRole: { type: String, index: true },

    payload: { type: Schema.Types.Mixed, default: {} },

    status: { type: String, enum: STATUS_ENUM, default: CERT_STATUSES.SUBMITTED, index: true },

    requestNo: { type: String, index: true },
    regNumber: { type: String, index: true },

    submittedAt: { type: Date, default: () => new Date(), index: true },
    reviewedAt: { type: Date },
    formingAt: { type: Date },
    readyAt: { type: Date },

    pickupFrom: { type: Date },

    decisionComment: { type: String, trim: true },

    timeline: {
      type: [
        {
          status: { type: String, enum: STATUS_ENUM, required: true },
          at: { type: Date, default: () => new Date() },
          by: { type: Schema.Types.ObjectId, ref: "User" },
          comment: { type: String, trim: true },
        },
      ],
      default: [],
    },

    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

certificateRequestSchema.index({ faculty: 1, status: 1, submittedAt: -1 });
certificateRequestSchema.index({ faculty: 1, regNumber: 1 });
certificateRequestSchema.index({ faculty: 1, requestNo: 1 });
certificateRequestSchema.index({ requester: 1, submittedAt: -1 });

export const CertificateRequest = mongoose.model("CertificateRequest", certificateRequestSchema);

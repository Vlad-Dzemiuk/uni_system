import mongoose from "mongoose";
const { Schema } = mongoose;

const certificateCounterSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

export const CertificateCounter = mongoose.model("CertificateCounter", certificateCounterSchema);

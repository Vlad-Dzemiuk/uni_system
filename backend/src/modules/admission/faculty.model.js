import mongoose from "mongoose";

const { Schema } = mongoose;

const facultySchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, index: true }, 
    name: { type: String, required: true, trim: true, index: true }, 
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    deanUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true, versionKey: false }
);

facultySchema.index({ code: 1 }, { unique: true });

export const Faculty = mongoose.model("Faculty", facultySchema);

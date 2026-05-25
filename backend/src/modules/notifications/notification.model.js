import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    faculty: { type: Schema.Types.ObjectId, ref: "Faculty", index: true },
    kind: { type: String, required: true, trim: true, maxlength: 80, index: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    entityType: { type: String, trim: true, maxlength: 80, default: "certificateRequest" },
    entityId: { type: String, trim: true, maxlength: 80, index: true },
    link: { type: String, trim: true, maxlength: 240 },
    meta: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);

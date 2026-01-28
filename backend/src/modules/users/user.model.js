import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const ROLES = ["Student", "Teacher", "Dean", "Admin"];

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
      index: true,
    },

    role: {
      type: String,
      enum: ROLES,
      required: true,
      index: true,
    },

    passwordHash: {
      type: String,
      select: false,
    },

    emailVerification: {
      tokenHash: { type: String, select: false },
      expiresAt: { type: Date },
      sentAt: { type: Date },
      verifiedAt: { type: Date },
    },

    passwordReset: {
      tokenHash: { type: String, select: false },
      expiresAt: { type: Date },
      requestedAt: { type: Date },
      usedAt: { type: Date },
    },

    google: {
      id: { type: String, index: true, sparse: true },
      email: { type: String, lowercase: true, trim: true },
      picture: { type: String },
      linkedAt: { type: Date },
    },

    isActive: { type: Boolean, default: true, index: true },
    blockedAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_, ret) => {
        delete ret.passwordHash;
        if (ret.emailVerification) delete ret.emailVerification.tokenHash;
        if (ret.passwordReset) delete ret.passwordReset.tokenHash;
        return ret;
      },
    },
    toObject: {
      transform: (_, ret) => {
        delete ret.passwordHash;
        if (ret.emailVerification) delete ret.emailVerification.tokenHash;
        if (ret.passwordReset) delete ret.passwordReset.tokenHash;
        return ret;
      },
    },
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ fullName: 1 });
userSchema.index({ role: 1, isActive: 1 });

userSchema.index({ fullName: "text", email: "text" });

userSchema.virtual("emailVerified").get(function () {
  return Boolean(this.emailVerification?.verifiedAt);
});

userSchema.methods.setPassword = async function (plainPassword) {
  const saltRounds = 12;
  this.passwordHash = await bcrypt.hash(String(plainPassword), saltRounds);

  if (!Array.isArray(this.providers)) this.providers = [];
  if (!this.providers.includes("local")) this.providers.push("local");
};


userSchema.methods.verifyPassword = async function (plainPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(String(plainPassword), this.passwordHash);
};

userSchema.methods.markEmailVerified = function () {
  this.emailVerification = this.emailVerification || {};
  this.emailVerification.verifiedAt = new Date();
  this.emailVerification.tokenHash = undefined;
  this.emailVerification.expiresAt = undefined;
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: String(email).toLowerCase().trim() });
};

export const User = mongoose.model("User", userSchema);
export const USER_ROLES = ROLES;

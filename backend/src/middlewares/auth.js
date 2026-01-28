import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../modules/users/user.model.js";

export function authenticate() {
  return async (req, res, next) => {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return next(new ApiError(401, "Missing Bearer token"));
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET);

      const user = await User.findById(payload.sub).lean();
      if (!user) return next(new ApiError(401, "Invalid token"));

      if (user.isActive === false) return next(new ApiError(403, "Account disabled"));

      req.user = user;
      req.auth = payload;
      next();
    } catch (e) {
      return next(new ApiError(401, "Invalid or expired token"));
    }
  };
}

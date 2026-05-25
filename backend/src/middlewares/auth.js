import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../modules/users/user.model.js";

export function authenticate() {
  return async (req, res, next) => {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return next(new ApiError(401, "Відсутній токен авторизації"));
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET);

      const user = await User.findById(payload.sub).lean();
      if (!user) return next(new ApiError(401, "Недійсний токен"));

      if (user.isActive === false) return next(new ApiError(403, "Обліковий запис вимкнено"));

      req.user = user;
      req.auth = payload;
      next();
    } catch (e) {
      return next(new ApiError(401, "Недійсний або протермінований токен"));
    }
  };
}

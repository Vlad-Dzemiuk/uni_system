import { ApiError } from "../utils/ApiError.js";

function zodIssuesToFieldErrors(error) {
  const fieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "form";
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return { fieldErrors, formErrors: [] };
}

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
    });

    if (!result.success) {
      return next(new ApiError(400, "Validation failed", zodIssuesToFieldErrors(result.error)));
    }

    req.validated = result.data;
    next();
  };
}

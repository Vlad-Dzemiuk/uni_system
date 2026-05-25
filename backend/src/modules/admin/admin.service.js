import { User } from "../users/user.model.js";
import { Faculty } from "../admission/faculty.model.js";

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export async function assignDean({ userId, email, facultyId }) {
  const faculty = await Faculty.findById(facultyId);
  if (!faculty) throw httpError(404, "Faculty not found");

  const user = await User.findOne(
    userId ? { _id: userId } : { email: String(email).toLowerCase().trim() }
  );
  if (!user) throw httpError(404, "User not found");
  if (user.role === "Admin") throw httpError(400, "An administrator cannot be assigned as dean");

  if (faculty.deanUser) {
    const prevDean = await User.findById(faculty.deanUser);
    if (prevDean) {
      if (prevDean.role === "Dean") prevDean.role = "Teacher";
      await prevDean.save();
    }
  }

  const previousFaculty = await Faculty.findOne({ deanUser: user._id });
  if (previousFaculty && String(previousFaculty._id) !== String(faculty._id)) {
    previousFaculty.deanUser = undefined;
    await previousFaculty.save();
  }

  user.role = "Dean";
  user.faculty = faculty._id;
  user.isActive = true;

  user.emailVerification = user.emailVerification || {};
  user.emailVerification.verifiedAt = user.emailVerification.verifiedAt || new Date();

  await user.save();

  faculty.deanUser = user._id;
  await faculty.save();

  return { user: user.toJSON(), faculty: faculty.toJSON() };
}

export async function unassignDean(facultyId) {
  const faculty = await Faculty.findById(facultyId);
  if (!faculty) throw httpError(404, "Faculty not found");

  const currentDeanId = faculty.deanUser;
  if (!currentDeanId) {
    return { ok: true, faculty: faculty.toJSON() };
  }

  const dean = await User.findById(currentDeanId);
  if (dean && dean.role === "Dean") {
    dean.role = "Teacher";
    await dean.save();
  }

  faculty.deanUser = undefined;
  await faculty.save();

  return {
    ok: true,
    faculty: faculty.toJSON(),
    user: dean ? dean.toJSON() : null,
  };
}

import { User } from "../users/user.model.js";
import { Notification } from "./notification.model.js";
import { CERT_STATUSES } from "../admission/constants.js";

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function readRequestId(value) {
  if (!value) return "";
  return String(value._id || value.id || value);
}

function requestLinkForRecipient(role, requestId) {
  if (!requestId) return undefined;
  return role === "Dean" || role === "Admin"
    ? `/dean/orders?request=${encodeURIComponent(requestId)}`
    : `/certificates/ordered?request=${encodeURIComponent(requestId)}`;
}

function statusNotificationCopy(requestTitle, status, decisionComment, pickupFrom) {
  if (status === CERT_STATUSES.IN_REVIEW) {
    return {
      kind: "request.in_review",
      title: "Заявку взято в роботу",
      message: `Деканат почав опрацьовувати вашу заявку "${requestTitle}".`,
    };
  }

  if (status === CERT_STATUSES.FORMING) {
    return {
      kind: "request.forming",
      title: "Довідка формується",
      message: `Заявка "${requestTitle}" перейшла в етап формування довідки.`,
    };
  }

  if (status === CERT_STATUSES.READY) {
    const pickupLabel = pickupFrom
      ? ` Орієнтовна дата видачі: ${new Date(pickupFrom).toLocaleDateString("uk-UA")}.`
      : "";
    return {
      kind: "request.ready",
      title: "Довідка готова",
      message: `Вашу довідку "${requestTitle}" підготовлено.${pickupLabel}`,
    };
  }

  if (status === CERT_STATUSES.REJECTED) {
    return {
      kind: "request.rejected",
      title: "Заявку відхилено",
      message: decisionComment?.trim()
        ? `Заявку "${requestTitle}" відхилено. Коментар деканату: ${decisionComment.trim()}`
        : `Заявку "${requestTitle}" відхилено деканатом.`,
    };
  }

  return {
    kind: "request.updated",
    title: "Статус заявки оновлено",
    message: `Для заявки "${requestTitle}" змінено статус.`,
  };
}

async function createMany(records = []) {
  const items = records.filter(Boolean);
  if (items.length === 0) return [];
  return Notification.insertMany(items);
}

export async function listMyNotifications(user, query = {}) {
  const limit = Math.min(Math.max(Number(query.limit || 12), 1), 50);
  const filter = { recipient: user._id };
  if (query.unreadOnly === "true" || query.unreadOnly === true) {
    filter.isRead = false;
  }

  const [items, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ recipient: user._id, isRead: false }),
  ]);

  return { items, unreadCount };
}

export async function markNotificationRead(user, notificationId) {
  const item = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: user._id },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  ).lean();

  if (!item) throw httpError(404, "Сповіщення не знайдено");
  return item;
}

export async function markAllNotificationsRead(user) {
  const result = await Notification.updateMany(
    { recipient: user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return { ok: true, updatedCount: result.modifiedCount || 0 };
}

export async function notifyFacultyAboutNewRequest({ facultyId, request, requesterName, requestTitle, isResubmitted = false }) {
  const requestId = readRequestId(request);
  const recipients = await User.find({
    isActive: true,
    $or: [{ role: "Dean", faculty: facultyId }, { role: "Admin" }],
  })
    .select("_id role")
    .lean();

  if (!recipients.length) return [];

  const title = isResubmitted ? "Заявку подано повторно" : "Нова заявка на довідку";
  const message = isResubmitted
    ? `${requesterName} повторно подав(ла) заявку "${requestTitle}" після редагування.`
    : `${requesterName} подав(ла) заявку "${requestTitle}".`;

  return createMany(
    recipients.map((recipient) => ({
      recipient: recipient._id,
      faculty: facultyId,
      kind: isResubmitted ? "request.resubmitted" : "request.created",
      title,
      message,
      entityId: requestId,
      link: requestLinkForRecipient(String(recipient.role), requestId),
      meta: {
        requestId,
        requestTitle,
        requesterName,
      },
    }))
  );
}

export async function notifyRequesterAboutStatus({ request, status, decisionComment, pickupFrom }) {
  if (!request?.requester) return null;

  const requestId = readRequestId(request);
  const requestTitle = String(request.requestTitle || request.type?.title || "Заявка на довідку");
  const copy = statusNotificationCopy(requestTitle, status, decisionComment, pickupFrom);

  return Notification.create({
    recipient: request.requester,
    faculty: request.faculty,
    kind: copy.kind,
    title: copy.title,
    message: copy.message,
    entityId: requestId,
    link: requestLinkForRecipient(String(request.requesterRole || ""), requestId),
    meta: {
      requestId,
      requestTitle,
      status,
      pickupFrom,
    },
  });
}

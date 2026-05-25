export const CERT_STATUSES = {
  SUBMITTED: "SUBMITTED",
  IN_REVIEW: "IN_REVIEW",
  FORMING: "FORMING",
  READY: "READY",
  REJECTED: "REJECTED",
};

export const STATUS_ENUM = Object.values(CERT_STATUSES);

export const CERT_REQUEST_MODES = {
  TEMPLATE: "TEMPLATE",
  PURPOSE: "PURPOSE",
};

export const REQUEST_MODE_ENUM = Object.values(CERT_REQUEST_MODES);

export const SPECIAL_PURPOSE_REQUEST_ID = "purpose-request";
export const SPECIAL_PURPOSE_REQUEST_TITLE = "Довідка за призначенням";
export const SPECIAL_PURPOSE_REQUEST_DESCRIPTION =
  "Якщо ви не знаєте точну назву довідки, опишіть її призначення, а деканат підбере потрібний формат.";

export const SPECIAL_PURPOSE_REQUEST_FIELDS = [
  {
    key: "requestPurpose",
    label: "Для чого потрібна довідка",
    type: "textarea",
    required: true,
    placeholder: "Опишіть, куди саме подається довідка та для чого вона вам потрібна.",
    helpText: "Наприклад: для військкомату, соціальної служби, роботодавця або консульства.",
    order: 1,
  },
  {
    key: "specialty",
    label: "Спеціальність",
    type: "text",
    required: true,
    placeholder: "Наприклад: Комп'ютерні науки",
    order: 2,
  },
  {
    key: "groupName",
    label: "Група",
    type: "text",
    required: true,
    placeholder: "Наприклад: КН-31",
    order: 3,
  },
  {
    key: "birthDate",
    label: "Дата народження",
    type: "date",
    required: true,
    order: 4,
  },
  {
    key: "additionalComment",
    label: "Додатковий коментар",
    type: "textarea",
    required: false,
    placeholder: "За потреби додайте уточнення для деканату.",
    order: 5,
  },
];

import type { CertificateType, Order } from "./types";

export const seedCertificates: CertificateType[] = [
  {
    id: "CERT-ENROLL",
    name: "Довідка з місця навчання",
    description: "Підтвердження факту навчання (банк / стипендія / консульство).",
    fields: [
      { key: "pib", label: "ПІБ (як у паспорті)", type: "text", required: true, placeholder: "Іваненко Іван Іванович" },
      { key: "studentId", label: "Номер студентського квитка", type: "number", required: true, placeholder: "Напр. 102938" },
      { key: "purpose", label: "Куди/для чого потрібна довідка", type: "text", required: true, placeholder: "Банк / стипендія / тощо" }
    ],
  },
  {
    id: "CERT-GRADE",
    name: "Витяг з оцінками (період)",
    description: "Частковий витяг з успішності за обраний період.",
    fields: [
      { key: "pib", label: "ПІБ", type: "text", required: true },
      { key: "fromDate", label: "Дата початку", type: "date", required: true },
      { key: "toDate", label: "Дата завершення", type: "date", required: true },
      { key: "notes", label: "Примітки", type: "textarea", placeholder: "За потреби: мова, формат, додаткові деталі..." }
    ],
  },
  {
    id: "CERT-DORM",
    name: "Довідка про проживання в гуртожитку",
    description: "Підтвердження проживання студента у гуртожитку.",
    fields: [
      { key: "pib", label: "ПІБ", type: "text", required: true },
      { key: "block", label: "Корпус/блок", type: "text", required: true, placeholder: "Блок А" },
      { key: "room", label: "Кімната", type: "number", required: true, min: 1 },
      { key: "sinceDate", label: "Проживає з", type: "date", required: true }
    ],
  },
];

export const seedOrders: Order[] = [
  {
    id: "ORD-A1C9F2",
    studentName: "Міла Коваленко",
    certificateTypeId: "CERT-ENROLL",
    certificateTypeName: "Довідка з місця навчання",
    dateSubmitted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    status: "Pending",
  },
  {
    id: "ORD-77B2D0",
    studentName: "Артем Шевчук",
    certificateTypeId: "CERT-GRADE",
    certificateTypeName: "Витяг з оцінками (період)",
    dateSubmitted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    status: "Approved",
    pickupDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().slice(0, 10),
  },
  {
    id: "ORD-91F0AA",
    studentName: "Софія Мартиненко",
    certificateTypeId: "CERT-DORM",
    certificateTypeName: "Довідка про проживання в гуртожитку",
    dateSubmitted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: "Rejected",
    comment: "Невірно вказано блок/кімнату. Перевірте дані в адміністрації.",
  },
];

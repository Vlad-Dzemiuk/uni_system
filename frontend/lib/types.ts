export type AppRole = "STUDENT" | "TEACHER" | "DEAN_OFFICE" | "ADMIN";
export type CertificateAudience = "all" | "student" | "teacher";

export type FieldType = "text" | "number" | "date" | "textarea" | "select" | "checkbox";

export type CertificateField = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  options?: string[];
  order?: number;
  min?: number;
  max?: number;
};

export type CertificateType = {
  id: string;
  name: string;
  description?: string;
  audience?: CertificateAudience;
  fields: CertificateField[];
  isSpecialPurpose?: boolean;
};

export type OrderStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export type Order = {
  id: string;
  studentName: string;
  certificateTypeId: string;
  certificateTypeName: string;
  dateSubmitted: string; // ISO
  status: OrderStatus;

  comment?: string;     // required for reject/cancel
  pickupDate?: string;  // required for approve (YYYY-MM-DD)
};

export type AppNotification = {
  id: string;
  kind: string;
  title: string;
  message: string;
  link?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
};
